// Billing Portal Component for Kateriss AI Video Generator
// Comprehensive subscription management interface

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, CardFooter, Loading } from '../ui';
import { BillingPortalProps } from '../../types/payment';
import { useSubscription } from '../../hooks/useSubscription';
import { useUsage } from '../../hooks/useUsage';
import { useBilling } from '../../hooks/useBilling';
import { UsageTracker } from './UsageTracker';
import { PaymentHistory } from './PaymentHistory';
import { PaymentMethod } from './PaymentMethod';
import { UpgradeModal } from './UpgradeModal';

type BillingTab = 'overview' | 'usage' | 'payments' | 'methods';

export const BillingPortal: React.FC<BillingPortalProps> = ({
  subscription,
  onSubscriptionChange,
  onError,
  className
}) => {
  const { subscription: currentSubscription, cancelSubscription, reactivateSubscription, getStatusInfo, getLimits } = useSubscription();
  const { usage } = useUsage();
  const { invoices, paymentMethods, getBillingSummary } = useBilling();
  
  const [activeTab, setActiveTab] = useState<BillingTab>('overview');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [billingSummary, setBillingSummary] = useState<any>(null);

  const activeSubscription = subscription || currentSubscription;
  const statusInfo = getStatusInfo();

  useEffect(() => {
    loadBillingSummary();
  }, []);

  const loadBillingSummary = async () => {
    try {
      const summary = await getBillingSummary();
      setBillingSummary(summary);
    } catch (error) {
      console.error('Failed to load billing summary:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;
    
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your current billing period.')) {
      try {
        setIsLoading(true);
        await cancelSubscription(false); // Cancel at period end
        onSubscriptionChange?.(activeSubscription);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReactivateSubscription = async () => {
    if (!activeSubscription) return;
    
    try {
      setIsLoading(true);
      const reactivatedSubscription = await reactivateSubscription();
      onSubscriptionChange?.(reactivatedSubscription);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate subscription';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabNavigation = () => (
    <div className="tab-navigation mb-6">
      <div className="flex border-b-3 border-black">
        {[
          { key: 'overview', label: 'OVERVIEW' },
          { key: 'usage', label: 'USAGE' },
          { key: 'payments', label: 'PAYMENTS' },
          { key: 'methods', label: 'PAYMENT METHODS' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as BillingTab)}
            className={clsx(
              'tab px-6 py-3 font-bold font-[Space_Grotesk] uppercase tracking-wide',
              'border-r-3 border-black transition-all duration-200',
              {
                'bg-[#ff0080] text-white': activeTab === tab.key,
                'bg-white text-black hover:bg-gray-100': activeTab !== tab.key,
              }
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="overview-content space-y-6">
      {/* Subscription Status */}
      <Card className="subscription-status border-3 border-black shadow-brutal">
        <CardHeader className="border-b-3 border-black">
          <h3 className="text-xl font-bold font-[Space_Grotesk] text-black uppercase">
            SUBSCRIPTION STATUS
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          {activeSubscription ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="status-info space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 uppercase tracking-wide">Current Plan</span>
                    <div className="text-xl font-bold text-black">{activeSubscription.plan}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500 uppercase tracking-wide">Status</span>
                    <div className={clsx(
                      'inline-block px-3 py-1 text-sm font-bold uppercase border-2 border-black',
                      {
                        'bg-[#00ff00] text-black': activeSubscription.status === 'active',
                        'bg-yellow-400 text-black': activeSubscription.status === 'trialing',
                        'bg-red-500 text-white': activeSubscription.status === 'canceled',
                        'bg-gray-400 text-white': ['past_due', 'unpaid'].includes(activeSubscription.status),
                      }
                    )}>
                      {activeSubscription.status}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500 uppercase tracking-wide">
                      {statusInfo.willCancelAtPeriodEnd ? 'Cancels On' : 'Renews On'}
                    </span>
                    <div className="text-lg font-bold text-black">
                      {statusInfo.renewalDate?.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="actions space-y-3">
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    variant="primary"
                    size="md"
                    fullWidth
                    className="font-bold uppercase"
                  >
                    UPGRADE PLAN
                  </Button>

                  {statusInfo.willCancelAtPeriodEnd ? (
                    <Button
                      onClick={handleReactivateSubscription}
                      variant="secondary"
                      size="md"
                      fullWidth
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      REACTIVATE SUBSCRIPTION
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCancelSubscription}
                      variant="outline"
                      size="md"
                      fullWidth
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      CANCEL SUBSCRIPTION
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <h4 className="text-lg font-bold text-black mb-4">No Active Subscription</h4>
              <p className="text-gray-600 mb-6">
                You don't have an active subscription. Choose a plan to get started.
              </p>
              <Button
                onClick={() => setIsUpgradeModalOpen(true)}
                variant="primary"
                size="lg"
                className="font-bold uppercase"
              >
                CHOOSE A PLAN
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Summary */}
      {billingSummary && (
        <Card className="billing-summary border-3 border-black shadow-brutal">
          <CardHeader className="border-b-3 border-black">
            <h3 className="text-xl font-bold font-[Space_Grotesk] text-black uppercase">
              BILLING SUMMARY
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card border-2 border-black p-4 bg-gray-50">
                <div className="text-2xl font-bold font-[Space_Grotesk] text-[#ff0080]">
                  ${billingSummary.totalSpent}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Spent
                </div>
              </div>

              <div className="stat-card border-2 border-black p-4 bg-gray-50">
                <div className="text-2xl font-bold font-[Space_Grotesk] text-black">
                  {billingSummary.totalInvoices}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Invoices
                </div>
              </div>

              <div className="stat-card border-2 border-black p-4 bg-gray-50">
                <div className="text-2xl font-bold font-[Space_Grotesk] text-[#00ff00]">
                  {billingSummary.paidInvoices}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Paid Invoices
                </div>
              </div>

              <div className="stat-card border-2 border-black p-4 bg-gray-50">
                <div className="text-2xl font-bold font-[Space_Grotesk] text-red-500">
                  {billingSummary.overdueinvoices}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Overdue
                </div>
              </div>
            </div>

            {billingSummary.nextPaymentDate && (
              <div className="next-payment mt-4 p-4 border-2 border-[#ff0080] bg-pink-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-black">Next Payment</div>
                    <div className="text-sm text-gray-600">
                      {billingSummary.nextPaymentDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[#ff0080]">
                    ${billingSummary.nextPaymentAmount}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="quick-actions border-3 border-black shadow-brutal">
        <CardHeader className="border-b-3 border-black">
          <h3 className="text-xl font-bold font-[Space_Grotesk] text-black uppercase">
            QUICK ACTIONS
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setActiveTab('usage')}
              variant="outline"
              size="md"
              fullWidth
            >
              VIEW USAGE
            </Button>
            
            <Button
              onClick={() => setActiveTab('payments')}
              variant="outline"
              size="md"
              fullWidth
            >
              PAYMENT HISTORY
            </Button>
            
            <Button
              onClick={() => setActiveTab('methods')}
              variant="outline"
              size="md"
              fullWidth
            >
              MANAGE PAYMENTS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsage = () => (
    <div className="usage-content">
      {usage ? (
        <UsageTracker
          usage={usage}
          showDetails={true}
          onUpgrade={() => setIsUpgradeModalOpen(true)}
        />
      ) : (
        <Card className="border-3 border-black shadow-brutal">
          <CardContent className="p-12 text-center">
            <Loading size="lg" className="mb-4" />
            <p className="text-gray-600">Loading usage data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="payments-content">
      <PaymentHistory
        payments={[]} // This would be populated from billing service
        loading={false}
      />
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="payment-methods-content">
      <PaymentMethod
        paymentMethods={paymentMethods}
        onUpdate={loadBillingSummary}
      />
    </div>
  );

  return (
    <div className={clsx('billing-portal', className)}>
      {/* Header */}
      <div className="portal-header mb-8">
        <h1 className="text-3xl font-bold font-[Space_Grotesk] text-black uppercase mb-2">
          BILLING PORTAL
        </h1>
        <p className="text-gray-600">
          Manage your subscription, payments, and billing preferences
        </p>
      </div>

      {/* Navigation */}
      {renderTabNavigation()}

      {/* Content */}
      <div className="portal-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'usage' && renderUsage()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'methods' && renderPaymentMethods()}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentPlan={activeSubscription?.plan}
        onUpgrade={(plan) => {
          setIsUpgradeModalOpen(false);
          // Refresh data after upgrade
          loadBillingSummary();
        }}
        onError={(error) => {
          onError?.(error);
        }}
      />
    </div>
  );
};

export default BillingPortal;