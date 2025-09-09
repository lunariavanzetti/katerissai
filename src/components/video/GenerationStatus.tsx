// Generation Status Component for Kateriss AI Video Generator
// Shows real-time status updates with progress indicators

import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  StopIcon,
  CogIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Video, GenerationStage } from '../../types/video';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface GenerationStatusProps {
  video: Video | null;
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

// Stage configuration
const STAGE_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  description: string;
}> = {
  idle: {
    icon: ClockIcon,
    label: 'Ready',
    color: 'text-gray-500',
    description: 'Ready to generate videos',
  },
  queued: {
    icon: ClockIcon,
    label: 'Queued',
    color: 'text-blue-500',
    description: 'Video added to generation queue',
  },
  initializing: {
    icon: CogIcon,
    label: 'Initializing',
    color: 'text-[#ff0080]',
    description: 'Setting up generation parameters',
  },
  generating: {
    icon: SparklesIcon,
    label: 'Generating',
    color: 'text-[#ff0080]',
    description: 'AI is creating your video',
  },
  processing: {
    icon: CogIcon,
    label: 'Processing',
    color: 'text-[#ff0080]',
    description: 'Processing and optimizing video',
  },
  finalizing: {
    icon: CloudArrowUpIcon,
    label: 'Finalizing',
    color: 'text-[#ff0080]',
    description: 'Uploading and preparing final video',
  },
  uploading: {
    icon: CloudArrowUpIcon,
    label: 'Uploading',
    color: 'text-blue-500',
    description: 'Saving video to your library',
  },
  completed: {
    icon: CheckCircleIcon,
    label: 'Completed',
    color: 'text-[#00ff00]',
    description: 'Video generation completed successfully',
  },
  failed: {
    icon: XCircleIcon,
    label: 'Failed',
    color: 'text-red-500',
    description: 'Generation failed - you can retry',
  },
  cancelled: {
    icon: StopIcon,
    label: 'Cancelled',
    color: 'text-gray-500',
    description: 'Generation was cancelled',
  },
};

export function GenerationStatus({
  video,
  progress,
  stage,
  estimatedTimeRemaining,
  onCancel,
  onRetry,
  className,
}: GenerationStatusProps) {
  const stageConfig = STAGE_CONFIG[stage] || STAGE_CONFIG.idle;
  const IconComponent = stageConfig.icon;

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get progress bar color based on stage
  const getProgressBarColor = (): string => {
    switch (stage) {
      case 'completed':
        return 'bg-[#00ff00]';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-[#ff0080]';
    }
  };

  // Show error details if failed
  const showErrorDetails = stage === 'failed' && video?.error;

  return (
    <Card
      variant={stage === 'completed' ? 'default' : 'pink'}
      className={clsx(
        'generation-status border-3',
        {
          'border-[#00ff00]': stage === 'completed',
          'border-red-500': stage === 'failed',
          'border-gray-500': stage === 'cancelled',
          'border-[#ff0080]': !['completed', 'failed', 'cancelled'].includes(stage),
        },
        className
      )}
    >
      <CardContent>
        <div className="flex items-start justify-between">
          {/* Status Info */}
          <div className="flex items-start gap-4 flex-1">
            {/* Status Icon */}
            <div
              className={clsx(
                'p-3 border-2 border-black flex-shrink-0',
                {
                  'bg-[#00ff00] text-black': stage === 'completed',
                  'bg-red-500 text-white': stage === 'failed',
                  'bg-gray-500 text-white': stage === 'cancelled',
                  'bg-[#ff0080] text-white': !['completed', 'failed', 'cancelled'].includes(stage),
                }
              )}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            {/* Status Details */}
            <div className="flex-1 min-w-0">
              {/* Title and Stage */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg uppercase tracking-wide">
                  {video?.title || 'Video Generation'}
                </h3>
                <span
                  className={clsx(
                    'px-2 py-1 text-xs font-bold uppercase tracking-wide border-2 border-black',
                    {
                      'bg-[#00ff00] text-black': stage === 'completed',
                      'bg-red-500 text-white': stage === 'failed',
                      'bg-gray-500 text-white': stage === 'cancelled',
                      'bg-[#ff0080] text-white': !['completed', 'failed', 'cancelled'].includes(stage),
                    }
                  )}
                >
                  {stageConfig.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-3">
                {stageConfig.description}
              </p>

              {/* Progress Bar */}
              {progress > 0 && stage !== 'completed' && (
                <div className="mb-3">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-semibold">Progress</span>
                    <span className="font-bold">{Math.round(progress)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 border-2 border-black h-6 relative overflow-hidden">
                    <motion.div
                      className={clsx('h-full', getProgressBarColor())}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    
                    {/* Animated progress stripes */}
                    {['generating', 'processing', 'finalizing'].includes(stage) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: 'linear'
                        }}
                        style={{ width: '50%' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Time Remaining */}
              {estimatedTimeRemaining && estimatedTimeRemaining > 0 && stage !== 'completed' && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    Estimated time remaining: 
                    <strong className="ml-1 text-[#ff0080]">
                      {formatTimeRemaining(estimatedTimeRemaining)}
                    </strong>
                  </span>
                </div>
              )}

              {/* Video Details */}
              {video && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600 bg-gray-50 p-3 border-2 border-gray-200">
                  <div>
                    <div className="font-bold text-black">Resolution</div>
                    <div>{video.settings.resolution}</div>
                  </div>
                  <div>
                    <div className="font-bold text-black">Duration</div>
                    <div>{video.settings.duration}s</div>
                  </div>
                  <div>
                    <div className="font-bold text-black">Quality</div>
                    <div className="capitalize">{video.settings.quality}</div>
                  </div>
                  <div>
                    <div className="font-bold text-black">Cost</div>
                    <div>{video.costCredits} credits</div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {showErrorDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-red-50 border-2 border-red-500"
                >
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-700 mb-1">
                        Generation Error
                      </h4>
                      <p className="text-red-600 text-sm mb-2">
                        {video.error?.message}
                      </p>
                      {video.error?.suggestedAction && (
                        <p className="text-red-700 text-sm font-semibold">
                          Suggestion: {video.error.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success Message */}
              {stage === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-50 border-2 border-[#00ff00] flex items-center gap-3"
                >
                  <CheckCircleIcon className="w-8 h-8 text-[#00ff00] flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-green-700 text-lg">
                      Video Generated Successfully! 🎉
                    </h4>
                    <p className="text-green-600 text-sm">
                      Your video is ready and has been added to your library.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-4">
            {onCancel && ['generating', 'processing', 'queued', 'initializing'].includes(stage) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <StopIcon className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}

            {onRetry && stage === 'failed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={onRetry}
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}

            {stage === 'completed' && video?.videoUrl && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open(video.videoUrl, '_blank')}
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                View Video
              </Button>
            )}
          </div>
        </div>

        {/* Animated Status Indicator */}
        {['generating', 'processing', 'initializing'].includes(stage) && (
          <motion.div
            className="mt-4 h-1 bg-gray-200 border border-black overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#ff0080] via-[#ff69b4] to-[#ff0080]"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: 'easeInOut',
              }}
              style={{ width: '50%' }}
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default GenerationStatus;