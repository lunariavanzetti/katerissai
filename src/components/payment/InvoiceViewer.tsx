// Invoice Viewer Component for Kateriss AI Video Generator
// Invoice display and download functionality with brutalist design

import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, CardFooter, Loading, Modal, ModalHeader, ModalContent, ModalFooter } from '../ui';
import { Invoice, InvoiceLineItem } from '../../types/payment';
import { useBilling } from '../../hooks/useBilling';

interface InvoiceViewerProps {
  invoice: Invoice;
  onDownload?: (invoiceId: string) => void;
  onRetryPayment?: (invoiceId: string) => void;
  className?: string;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoice,
  onDownload,
  onRetryPayment,
  className
}) => {
  const { downloadInvoice, retryFailedPayment } = useBilling();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      if (onDownload) {
        onDownload(invoice.id);
      } else {
        const downloadUrl = await downloadInvoice(invoice.id);
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `invoice-${invoice.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!onRetryPayment) return;
    
    try {
      setIsRetrying(true);
      await retryFailedPayment(invoice.id);
      onRetryPayment(invoice.id);
    } catch (error) {
      console.error('Failed to retry payment:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#00ff00] text-black';
      case 'open':
        return 'bg-yellow-400 text-black';
      case 'void':
        return 'bg-red-500 text-white';
      case 'uncollectible':
        return 'bg-gray-500 text-white';
      case 'draft':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const isOverdue = invoice.status === 'open' && invoice.dueAt < new Date();

  return (
    <Card className={clsx(
      'invoice-viewer border-3 border-black shadow-brutal',
      {
        'border-red-500': isOverdue,
        'border-yellow-500': invoice.status === 'open' && !isOverdue,
        'border-[#00ff00]': invoice.status === 'paid',
      },
      className
    )}>
      {/* Invoice Header */}
      <CardHeader className="border-b-3 border-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold font-[Space_Grotesk] text-black uppercase">
                INVOICE {invoice.number}
              </h3>
              <div className={clsx(
                'status-badge px-3 py-1 text-sm font-bold uppercase border-2 border-black',
                getStatusColor(invoice.status)
              )}>
                {invoice.status}
              </div>
            </div>
            <p className="text-gray-600">{invoice.description}</p>
          </div>

          <div className="invoice-total text-right">
            <div className="text-2xl font-bold font-[Space_Grotesk] text-[#ff0080]">
              {formatAmount(invoice.total, invoice.currency)}
            </div>
            <div className="text-sm text-gray-500">
              {invoice.currency.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Overdue Alert */}
        {isOverdue && (
          <div className="overdue-alert mt-4 p-3 border-2 border-red-500 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-red-500 fill-current">
                <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
                <path d="M8 6v3M8 11h.01" stroke="red" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-bold text-sm">OVERDUE</span>
              <span className="text-sm">Payment was due {formatDate(invoice.dueAt)}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {/* Invoice Details */}
        <div className="invoice-details grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="invoice-info">
            <h4 className="font-bold text-black mb-3 uppercase text-sm">Invoice Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice ID:</span>
                <span className="font-mono text-black">{invoice.paddleInvoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="text-black">{formatDate(invoice.issuedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="text-black">{formatDate(invoice.dueAt)}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Date:</span>
                  <span className="text-black">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
              {invoice.subscriptionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscription:</span>
                  <span className="font-mono text-black">{invoice.subscriptionId.slice(-8)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="billing-summary">
            <h4 className="font-bold text-black mb-3 uppercase text-sm">Billing Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-black">{formatAmount(invoice.amount, invoice.currency)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-black">{formatAmount(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <hr className="border-black border-1" />
              <div className="flex justify-between font-bold">
                <span className="text-black">Total:</span>
                <span className="text-[#ff0080]">{formatAmount(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        {invoice.lineItems.length > 0 && (
          <div className="line-items mb-6">
            <h4 className="font-bold text-black mb-3 uppercase text-sm">Items</h4>
            <div className="border-3 border-black bg-white">
              {/* Table Header */}
              <div className="line-item-header grid grid-cols-4 bg-gray-100 border-b-2 border-black">
                <div className="p-3 font-bold text-black uppercase text-xs">Description</div>
                <div className="p-3 font-bold text-black uppercase text-xs text-center">Quantity</div>
                <div className="p-3 font-bold text-black uppercase text-xs text-right">Unit Price</div>
                <div className="p-3 font-bold text-black uppercase text-xs text-right">Amount</div>
              </div>

              {/* Line Items */}
              {invoice.lineItems.map((item, index) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  isLast={index === invoice.lineItems.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="payment-status">
          <h4 className="font-bold text-black mb-3 uppercase text-sm">Payment Status</h4>
          <div className={clsx(
            'status-card p-4 border-2 border-black',
            {
              'bg-green-50': invoice.status === 'paid',
              'bg-yellow-50': invoice.status === 'open' && !isOverdue,
              'bg-red-50': isOverdue || invoice.status === 'void',
              'bg-gray-50': invoice.status === 'draft',
            }
          )}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-black mb-1">
                  {invoice.status === 'paid' && 'Payment Received'}
                  {invoice.status === 'open' && !isOverdue && 'Payment Pending'}
                  {invoice.status === 'open' && isOverdue && 'Payment Overdue'}
                  {invoice.status === 'void' && 'Invoice Voided'}
                  {invoice.status === 'draft' && 'Draft Invoice'}
                </div>
                <div className="text-sm text-gray-600">
                  {invoice.status === 'paid' && `Paid on ${formatDate(invoice.paidAt!)}`}
                  {invoice.status === 'open' && !isOverdue && `Due ${formatDate(invoice.dueAt)}`}
                  {invoice.status === 'open' && isOverdue && `Overdue by ${Math.ceil((new Date().getTime() - invoice.dueAt.getTime()) / (1000 * 60 * 60 * 24))} days`}
                  {invoice.status === 'void' && 'This invoice has been cancelled'}
                  {invoice.status === 'draft' && 'This invoice is still being prepared'}
                </div>
              </div>
              
              <div className={clsx(
                'status-icon w-12 h-12 border-2 border-black flex items-center justify-center',
                {
                  'bg-[#00ff00] text-black': invoice.status === 'paid',
                  'bg-yellow-400 text-black': invoice.status === 'open' && !isOverdue,
                  'bg-red-500 text-white': isOverdue || invoice.status === 'void',
                  'bg-gray-400 text-white': invoice.status === 'draft',
                }
              )}>
                {invoice.status === 'paid' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {(invoice.status === 'open' || isOverdue) && (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {invoice.status === 'void' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Actions Footer */}
      <CardFooter className="border-t-3 border-black p-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {invoice.status !== 'draft' && (
            <Button
              onClick={handleDownload}
              variant="outline"
              size="md"
              loading={isDownloading}
              disabled={isDownloading}
              className="flex-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" className="mr-2 fill-current">
                <path d="M8 10L12 6H9V0H7V6H4L8 10ZM16 12V14H0V12H2V13H14V12H16Z"/>
              </svg>
              DOWNLOAD PDF
            </Button>
          )}

          {invoice.status === 'open' && onRetryPayment && (
            <Button
              onClick={handleRetryPayment}
              variant="primary"
              size="md"
              loading={isRetrying}
              disabled={isRetrying}
              className="flex-1 font-bold uppercase"
            >
              RETRY PAYMENT
            </Button>
          )}

          {invoice.status === 'paid' && (
            <Button
              variant="secondary"
              size="md"
              disabled
              className="flex-1 font-bold uppercase"
            >
              PAYMENT COMPLETE
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

interface LineItemRowProps {
  item: InvoiceLineItem;
  isLast: boolean;
}

const LineItemRow: React.FC<LineItemRowProps> = ({ item, isLast }) => {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  return (
    <div className={clsx(
      'line-item grid grid-cols-4 hover:bg-gray-50 transition-colors',
      !isLast && 'border-b border-gray-200'
    )}>
      <div className="p-3">
        <div className="font-medium text-black">{item.description}</div>
        {item.period && (
          <div className="text-xs text-gray-500 mt-1">
            {item.period.start.toLocaleDateString()} - {item.period.end.toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="p-3 text-center text-black">{item.quantity}</div>
      <div className="p-3 text-right text-black">
        {formatAmount(item.unitPrice, item.currency)}
      </div>
      <div className="p-3 text-right font-bold text-black">
        {formatAmount(item.amount, item.currency)}
      </div>
    </div>
  );
};

export default InvoiceViewer;