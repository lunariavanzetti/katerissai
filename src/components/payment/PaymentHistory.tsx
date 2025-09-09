// Payment History Component for Kateriss AI Video Generator
// Transaction history with brutal card design

import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, Loading } from '../ui';
import { PaymentHistoryProps, Payment } from '../../types/payment';

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  loading = false,
  onRefund,
  onDownloadInvoice,
  className
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Sort and filter payments
  const processedPayments = payments
    .filter(payment => filterStatus === 'all' || payment.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#00ff00] text-black';
      case 'pending':
        return 'bg-yellow-400 text-black';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'refunded':
        return 'bg-gray-500 text-white';
      case 'partially_refunded':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={clsx('payment-history border-3 border-black shadow-brutal', className)}>
        <CardContent className="p-12 text-center">
          <Loading size="lg" className="mb-4" />
          <p className="text-gray-600">Loading payment history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={clsx('payment-history border-3 border-black shadow-brutal', className)}>
      <CardHeader className="border-b-3 border-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-xl font-bold font-[Space_Grotesk] text-black uppercase">
            PAYMENT HISTORY
          </h3>

          {/* Filters */}
          <div className="filters flex flex-col sm:flex-row gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border-2 border-black font-bold text-sm uppercase bg-white"
            >
              <option value="date">SORT BY DATE</option>
              <option value="amount">SORT BY AMOUNT</option>
              <option value="status">SORT BY STATUS</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border-2 border-black font-bold text-sm uppercase bg-white"
            >
              <option value="all">ALL STATUSES</option>
              <option value="completed">COMPLETED</option>
              <option value="pending">PENDING</option>
              <option value="failed">FAILED</option>
              <option value="refunded">REFUNDED</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {processedPayments.length === 0 ? (
          <div className="empty-state p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 border-3 border-black mx-auto mb-4 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-500 fill-current">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8H20V18ZM18 11H6V13H18V11Z"/>
              </svg>
            </div>
            <h4 className="text-lg font-bold text-black mb-2">No Payments Found</h4>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'You haven\'t made any payments yet.'
                : `No ${filterStatus} payments found.`
              }
            </p>
          </div>
        ) : (
          <div className="payments-list">
            {processedPayments.map((payment, index) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onRefund={onRefund}
                onDownloadInvoice={onDownloadInvoice}
                isLast={index === processedPayments.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PaymentCardProps {
  payment: Payment;
  onRefund?: (paymentId: string) => void;
  onDownloadInvoice?: (invoiceId: string) => void;
  isLast: boolean;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ 
  payment, 
  onRefund, 
  onDownloadInvoice, 
  isLast 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#00ff00] text-black';
      case 'pending':
        return 'bg-yellow-400 text-black';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'refunded':
        return 'bg-gray-500 text-white';
      case 'partially_refunded':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  return (
    <div className={clsx(
      'payment-card transition-all duration-200 hover:bg-gray-50',
      !isLast && 'border-b-2 border-gray-200'
    )}>
      <div 
        className="payment-summary p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="payment-info flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h4 className="font-bold text-black">{payment.description}</h4>
              <div className={clsx(
                'status-badge px-2 py-1 text-xs font-bold uppercase border-2 border-black',
                getStatusColor(payment.status)
              )}>
                {payment.status}
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>
                <strong>ID:</strong> {payment.id.slice(-8)}
              </span>
              <span>
                <strong>Date:</strong> {formatDate(payment.createdAt)}
              </span>
              <span>
                <strong>Type:</strong> {payment.type}
              </span>
            </div>
          </div>

          <div className="payment-amount text-right">
            <div className="text-xl font-bold font-[Space_Grotesk] text-[#ff0080]">
              {formatAmount(payment.amount, payment.currency)}
            </div>
            <div className="text-sm text-gray-500">
              {payment.currency.toUpperCase()}
            </div>
          </div>

          <div className="expand-icon ml-4">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              className={clsx(
                'transform transition-transform duration-200 text-gray-400 fill-current',
                isExpanded && 'rotate-180'
              )}
            >
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="payment-details border-t-2 border-gray-200 bg-gray-50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <div className="details-section">
              <h5 className="font-bold text-black mb-3 uppercase text-sm">Payment Details</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-black">{payment.paddleOrderId}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-black">{formatAmount(payment.amount, payment.currency)}</span>
                </div>

                {payment.videoCount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Videos:</span>
                    <span className="text-black">{payment.videoCount}</span>
                  </div>
                )}

                {payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At:</span>
                    <span className="text-black">{formatDate(payment.paidAt)}</span>
                  </div>
                )}

                {payment.refundedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refunded At:</span>
                    <span className="text-black">{formatDate(payment.refundedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="actions-section">
              <h5 className="font-bold text-black mb-3 uppercase text-sm">Actions</h5>
              <div className="space-y-2">
                {onDownloadInvoice && payment.status === 'completed' && (
                  <Button
                    onClick={() => onDownloadInvoice(payment.id)}
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="text-xs"
                  >
                    DOWNLOAD INVOICE
                  </Button>
                )}

                {onRefund && payment.status === 'completed' && !payment.refundedAt && (
                  <Button
                    onClick={() => onRefund(payment.id)}
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="text-xs"
                  >
                    REQUEST REFUND
                  </Button>
                )}

                {payment.status === 'failed' && (
                  <Button
                    onClick={() => {/* Retry payment logic */}}
                    variant="primary"
                    size="sm"
                    fullWidth
                    className="text-xs"
                  >
                    RETRY PAYMENT
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          {payment.metadata && Object.keys(payment.metadata).length > 0 && (
            <div className="metadata-section mt-4 pt-4 border-t border-gray-300">
              <h5 className="font-bold text-black mb-2 uppercase text-sm">Additional Info</h5>
              <div className="bg-white border-2 border-gray-300 p-3 font-mono text-xs">
                <pre>{JSON.stringify(payment.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;