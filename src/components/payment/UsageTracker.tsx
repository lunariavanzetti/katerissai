// Usage Tracker Component for Kateriss AI Video Generator
// Video usage display with pink progress bars and brutalist design

import React from 'react';
import clsx from 'clsx';
import { Button, Card, CardHeader, CardContent, CardFooter } from '../ui';
import { UsageTrackerProps } from '../../types/payment';
import { useUsage } from '../../hooks/useUsage';

export const UsageTracker: React.FC<UsageTrackerProps> = ({
  usage,
  showDetails = true,
  onUpgrade,
  className
}) => {
  const { 
    getUsageColor, 
    getUsageMessage, 
    isApproachingLimit, 
    hasExceededLimit,
    getDaysUntilReset,
    formatUsageDisplay
  } = useUsage();

  if (!usage) {
    return (
      <Card className={clsx('usage-tracker bg-white border-3 border-black shadow-brutal', className)}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">No usage data available</div>
        </CardContent>
      </Card>
    );
  }

  const { current, limit, percentage } = formatUsageDisplay();
  const usageColor = getUsageColor();
  const usageMessage = getUsageMessage();
  const daysUntilReset = getDaysUntilReset();

  return (
    <Card className={clsx(
      'usage-tracker bg-white border-3 border-black shadow-brutal',
      {
        'border-red-500': hasExceededLimit(),
        'border-yellow-500': isApproachingLimit(),
      },
      className
    )}>
      <CardHeader className="border-b-3 border-black">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-[Space_Grotesk] text-black uppercase">
            VIDEO USAGE
          </h3>
          <div className="text-sm text-gray-600">
            {daysUntilReset > 0 ? `${daysUntilReset} days until reset` : 'Resets today'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Main Usage Display */}
        <div className="usage-main mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-2xl font-bold font-[Space_Grotesk] text-black">
              {current} / {limit}
            </div>
            <div className={clsx(
              'text-sm font-bold px-2 py-1 border-2 border-black uppercase',
              {
                'bg-red-500 text-white': hasExceededLimit(),
                'bg-yellow-500 text-black': isApproachingLimit() && !hasExceededLimit(),
                'bg-[#00ff00] text-black': !isApproachingLimit() && !hasExceededLimit(),
              }
            )}>
              {percentage.toFixed(0)}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar mb-3">
            <div className="w-full h-6 border-3 border-black bg-white relative overflow-hidden">
              <div 
                className={clsx(
                  'h-full transition-all duration-300 ease-out',
                  {
                    'bg-red-500': hasExceededLimit(),
                    'bg-gradient-to-r from-yellow-400 to-red-500': isApproachingLimit() && !hasExceededLimit(),
                    'bg-gradient-to-r from-[#00ff00] to-[#ff0080]': !isApproachingLimit() && !hasExceededLimit() && percentage > 0,
                    'bg-gray-200': percentage === 0,
                  }
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
              
              {/* Progress Bar Pattern */}
              <div className="absolute inset-0 bg-repeat-x opacity-20" 
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 3px,
                    rgba(0,0,0,0.1) 3px,
                    rgba(0,0,0,0.1) 6px
                  )`
                }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center">
            {usageMessage}
          </div>
        </div>

        {/* Usage Status Alert */}
        {hasExceededLimit() && (
          <div className="usage-alert mb-4 p-4 border-3 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-500 border-2 border-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-white fill-current">
                  <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
                  <path d="M8 6v3M8 11h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-red-700 mb-1">LIMIT EXCEEDED</h4>
                <p className="text-sm text-red-600">
                  You've used all {usage.videoLimit} videos in your plan.
                  {usage.overageCount > 0 && ` (${usage.overageCount} overage videos)`}
                </p>
                {onUpgrade && (
                  <Button
                    onClick={onUpgrade}
                    variant="primary"
                    size="sm"
                    className="mt-2"
                  >
                    UPGRADE NOW
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {isApproachingLimit() && !hasExceededLimit() && (
          <div className="usage-alert mb-4 p-4 border-3 border-yellow-500 bg-yellow-50">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-500 border-2 border-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-yellow-800 fill-current">
                  <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" strokeWidth="1" fill="currentColor"/>
                  <path d="M8 6v3M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-yellow-700 mb-1">APPROACHING LIMIT</h4>
                <p className="text-sm text-yellow-600">
                  You have {usage.remainingVideos} videos remaining this month.
                </p>
                {onUpgrade && (
                  <Button
                    onClick={onUpgrade}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    CONSIDER UPGRADING
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage Details */}
        {showDetails && (
          <div className="usage-details">
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card border-2 border-black p-3 bg-gray-50">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  This Period
                </div>
                <div className="text-xl font-bold font-[Space_Grotesk] text-black">
                  {usage.videosGenerated}
                </div>
              </div>
              
              <div className="stat-card border-2 border-black p-3 bg-gray-50">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {usage.videoLimit ? 'Remaining' : 'Generated'}
                </div>
                <div className="text-xl font-bold font-[Space_Grotesk] text-black">
                  {usage.remainingVideos ?? '∞'}
                </div>
              </div>
            </div>

            {usage.overageCount > 0 && (
              <div className="overage-info mt-4 p-3 border-2 border-dashed border-red-300 bg-red-50">
                <div className="text-sm">
                  <div className="font-bold text-red-700 mb-1">Overage Usage</div>
                  <div className="text-red-600">
                    {usage.overageCount} additional videos
                    {usage.overageCharges > 0 && (
                      <span className="ml-2 font-bold">
                        ${usage.overageCharges.toFixed(2)} in charges
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {usage.lastVideoAt && (
              <div className="last-usage mt-4 text-xs text-gray-500">
                Last video generated: {usage.lastVideoAt.toLocaleDateString()} at {usage.lastVideoAt.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      {(hasExceededLimit() || isApproachingLimit()) && onUpgrade && (
        <CardFooter className="border-t-3 border-black p-4">
          <div className="w-full text-center">
            <p className="text-sm text-gray-600 mb-3">
              Need more videos? Upgrade to a higher plan for unlimited generation.
            </p>
            <Button
              onClick={onUpgrade}
              variant="primary"
              size="md"
              fullWidth
              className="font-bold uppercase"
            >
              {hasExceededLimit() ? 'UPGRADE NOW' : 'UPGRADE PLAN'}
            </Button>
          </div>
        </CardFooter>
      )}

      {!usage.videoLimit && (
        <CardFooter className="border-t-3 border-black p-4">
          <div className="w-full text-center">
            <div className="flex items-center justify-center gap-2 text-[#ff0080]">
              <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
                <path d="M8 0L10 6H16L11 10L13 16L8 12L3 16L5 10L0 6H6L8 0Z"/>
              </svg>
              <span className="font-bold uppercase tracking-wide">UNLIMITED VIDEOS</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You're on a premium plan with unlimited video generation
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default UsageTracker;