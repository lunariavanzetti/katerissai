// Billing Operations Service for Kateriss AI Video Generator
// Invoice generation and payment method management via Paddle

import { 
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  PaymentMethod,
  Payment,
  PaymentStatus
} from '../types/payment';
import { paddleService } from './paddle';
import { supabase } from '../config/supabase';

export interface InvoiceCreateData {
  userId: string;
  subscriptionId?: string;
  paddleInvoiceId: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  taxAmount: number;
  total: number;
  description: string;
  lineItems: InvoiceLineItem[];
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  downloadUrl?: string;
}

export interface PaymentMethodCreateData {
  userId: string;
  paddlePaymentMethodId: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

class BillingService {
  /**
   * Create a new invoice record
   */
  async createInvoice(data: InvoiceCreateData): Promise<Invoice> {
    try {
      const invoiceData = {
        user_id: data.userId,
        subscription_id: data.subscriptionId,
        paddle_invoice_id: data.paddleInvoiceId,
        number: data.number,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        tax_amount: data.taxAmount,
        total: data.total,
        description: data.description,
        line_items: data.lineItems,
        issued_at: data.issuedAt.toISOString(),
        due_at: data.dueAt.toISOString(),
        paid_at: data.paidAt?.toISOString(),
        download_url: data.downloadUrl,
        created_at: new Date().toISOString()
      };

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create invoice: ${error.message}`);
      }

      return this.mapDatabaseToInvoice(invoice);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          return null;
        }
        throw new Error(`Failed to get invoice: ${error.message}`);
      }

      return this.mapDatabaseToInvoice(invoice);
    } catch (error) {
      console.error('Failed to get invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a user
   */
  async getUserInvoices(userId: string, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get user invoices: ${error.message}`);
      }

      return invoices.map(this.mapDatabaseToInvoice);
    } catch (error) {
      console.error('Failed to get user invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a subscription
   */
  async getSubscriptionInvoices(subscriptionId: string): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('issued_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get subscription invoices: ${error.message}`);
      }

      return invoices.map(this.mapDatabaseToInvoice);
    } catch (error) {
      console.error('Failed to get subscription invoices:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, paidAt?: Date): Promise<Invoice> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (paidAt) {
        updateData.paid_at = paidAt.toISOString();
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update invoice status: ${error.message}`);
      }

      return this.mapDatabaseToInvoice(invoice);
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      throw error;
    }
  }

  /**
   * Generate invoice download URL
   */
  async generateInvoiceDownloadUrl(invoiceId: string): Promise<string> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.downloadUrl) {
        return invoice.downloadUrl;
      }

      // Request download URL from Paddle
      const response = await fetch(`/api/paddle/invoice/${invoice.paddleInvoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${paddleService.getConfig().clientSideToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice download URL');
      }

      const data = await response.json();
      const downloadUrl = data.download_url;

      // Update invoice with download URL
      await supabase
        .from('invoices')
        .update({ download_url: downloadUrl })
        .eq('id', invoiceId);

      return downloadUrl;
    } catch (error) {
      console.error('Failed to generate invoice download URL:', error);
      throw error;
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoicePdf(invoiceId: string): Promise<Blob> {
    try {
      const downloadUrl = await this.generateInvoiceDownloadUrl(invoiceId);
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download invoice PDF');
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Retry failed invoice payment
   */
  async retryInvoicePayment(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status !== 'open') {
        throw new Error('Invoice is not in a retryable state');
      }

      // Call Paddle API to retry payment
      const response = await fetch(`/api/paddle/invoice/${invoice.paddleInvoiceId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paddleService.getConfig().clientSideToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retry invoice payment');
      }
    } catch (error) {
      console.error('Failed to retry invoice payment:', error);
      throw error;
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(data: PaymentMethodCreateData): Promise<PaymentMethod> {
    try {
      const paymentMethodData = {
        user_id: data.userId,
        paddle_payment_method_id: data.paddlePaymentMethodId,
        type: data.type,
        last4: data.last4,
        brand: data.brand,
        expiry_month: data.expiryMonth,
        expiry_year: data.expiryYear,
        is_default: data.isDefault || false,
        created_at: new Date().toISOString()
      };

      // If this is set as default, unset other default payment methods
      if (data.isDefault) {
        await supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', data.userId);
      }

      const { data: paymentMethod, error } = await supabase
        .from('payment_methods')
        .insert([paymentMethodData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payment method: ${error.message}`);
      }

      return this.mapDatabaseToPaymentMethod(paymentMethod);
    } catch (error) {
      console.error('Failed to create payment method:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for a user
   */
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data: paymentMethods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get payment methods: ${error.message}`);
      }

      return paymentMethods.map(this.mapDatabaseToPaymentMethod);
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string, userId: string): Promise<PaymentMethod> {
    try {
      // Unset all other default payment methods for the user
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set the specified payment method as default
      const { data: paymentMethod, error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to set default payment method: ${error.message}`);
      }

      return this.mapDatabaseToPaymentMethod(paymentMethod);
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      throw error;
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove payment method: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      throw error;
    }
  }

  /**
   * Get billing summary for a user
   */
  async getBillingSummary(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalSpent: number;
    totalInvoices: number;
    paidInvoices: number;
    overdueinvoices: number;
    nextPaymentAmount: number;
    nextPaymentDate: Date | null;
  }> {
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('issued_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('issued_at', endDate.toISOString());
      }

      const { data: invoices, error } = await query;

      if (error) {
        throw new Error(`Failed to get billing summary: ${error.message}`);
      }

      const totalSpent = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter(inv => 
        inv.status === 'open' && new Date(inv.due_at) < new Date()
      ).length;

      // Get next payment from active subscription
      const nextOpenInvoice = invoices
        .filter(inv => inv.status === 'open')
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())[0];

      return {
        totalSpent,
        totalInvoices,
        paidInvoices,
        overdueinvoices: overdueInvoices,
        nextPaymentAmount: nextOpenInvoice?.total || 0,
        nextPaymentDate: nextOpenInvoice ? new Date(nextOpenInvoice.due_at) : null
      };
    } catch (error) {
      console.error('Failed to get billing summary:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for amount and country
   */
  async calculateTax(amount: number, country: string, taxId?: string): Promise<{
    taxAmount: number;
    taxRate: number;
    total: number;
  }> {
    try {
      // In a real implementation, this would call Paddle's tax calculation API
      // Paddle handles tax calculation automatically, but this can be used for estimates
      
      // Mock tax calculation for demonstration
      const taxRates: Record<string, number> = {
        'US': 0.08,    // Average US sales tax
        'GB': 0.20,    // UK VAT
        'DE': 0.19,    // German VAT
        'FR': 0.20,    // French VAT
        'CA': 0.13,    // Canadian GST/HST average
        'AU': 0.10,    // Australian GST
      };

      const taxRate = taxRates[country.toUpperCase()] || 0;
      const taxAmount = amount * taxRate;
      const total = amount + taxAmount;

      return {
        taxAmount: Math.round(taxAmount * 100) / 100,
        taxRate,
        total: Math.round(total * 100) / 100
      };
    } catch (error) {
      console.error('Failed to calculate tax:', error);
      throw error;
    }
  }

  /**
   * Generate billing portal URL
   */
  async getBillingPortalUrl(userId: string): Promise<string> {
    try {
      // Get user's customer ID from Paddle
      // This would typically be stored when the customer is created
      const { data: customer, error } = await supabase
        .from('profiles')
        .select('paddle_customer_id')
        .eq('id', userId)
        .single();

      if (error || !customer.paddle_customer_id) {
        throw new Error('Customer not found in Paddle');
      }

      return await paddleService.getCustomerPortalUrl(customer.paddle_customer_id);
    } catch (error) {
      console.error('Failed to get billing portal URL:', error);
      throw error;
    }
  }

  /**
   * Export invoices to CSV
   */
  async exportInvoicesToCsv(userId: string, startDate?: Date, endDate?: Date): Promise<string> {
    try {
      const invoices = await this.getUserInvoices(userId);
      
      let filteredInvoices = invoices;
      if (startDate || endDate) {
        filteredInvoices = invoices.filter(invoice => {
          const invoiceDate = invoice.issuedAt;
          if (startDate && invoiceDate < startDate) return false;
          if (endDate && invoiceDate > endDate) return false;
          return true;
        });
      }

      // Generate CSV content
      const headers = ['Date', 'Invoice Number', 'Description', 'Amount', 'Tax', 'Total', 'Status'];
      const csvRows = [headers.join(',')];

      filteredInvoices.forEach(invoice => {
        const row = [
          invoice.issuedAt.toISOString().split('T')[0],
          invoice.number,
          `"${invoice.description}"`,
          invoice.amount.toString(),
          invoice.taxAmount.toString(),
          invoice.total.toString(),
          invoice.status
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('Failed to export invoices to CSV:', error);
      throw error;
    }
  }

  /**
   * Map database record to Invoice type
   */
  private mapDatabaseToInvoice(dbInvoice: any): Invoice {
    return {
      id: dbInvoice.id,
      userId: dbInvoice.user_id,
      paddleInvoiceId: dbInvoice.paddle_invoice_id,
      subscriptionId: dbInvoice.subscription_id,
      number: dbInvoice.number,
      status: dbInvoice.status,
      amount: dbInvoice.amount,
      currency: dbInvoice.currency,
      taxAmount: dbInvoice.tax_amount,
      total: dbInvoice.total,
      description: dbInvoice.description,
      lineItems: dbInvoice.line_items || [],
      issuedAt: new Date(dbInvoice.issued_at),
      dueAt: new Date(dbInvoice.due_at),
      paidAt: dbInvoice.paid_at ? new Date(dbInvoice.paid_at) : undefined,
      downloadUrl: dbInvoice.download_url,
      createdAt: new Date(dbInvoice.created_at)
    };
  }

  /**
   * Map database record to PaymentMethod type
   */
  private mapDatabaseToPaymentMethod(dbPaymentMethod: any): PaymentMethod {
    return {
      id: dbPaymentMethod.id,
      userId: dbPaymentMethod.user_id,
      paddlePaymentMethodId: dbPaymentMethod.paddle_payment_method_id,
      type: dbPaymentMethod.type,
      last4: dbPaymentMethod.last4,
      brand: dbPaymentMethod.brand,
      expiryMonth: dbPaymentMethod.expiry_month,
      expiryYear: dbPaymentMethod.expiry_year,
      isDefault: dbPaymentMethod.is_default,
      createdAt: new Date(dbPaymentMethod.created_at)
    };
  }
}

// Export singleton instance
export const billingService = new BillingService();
export default billingService;