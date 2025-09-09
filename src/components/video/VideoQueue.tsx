// Video Queue Component for Kateriss AI Video Generator
// Shows generation queue with status tracking and controls

import React, { useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QueueListIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useQueue } from '../../hooks/useQueue';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { formatDistance } from 'date-fns';

interface VideoQueueProps {
  className?: string;
}

export function VideoQueue({ className }: VideoQueueProps) {
  const {
    queue,
    queueState,
    queuedVideos,
    isLoading,
    error,
    removeFromQueue,
    clearQueue,
    pauseQueue,
    resumeQueue,
    refreshQueue,
    getQueuePosition,
    getEstimatedWaitTime,
    getProcessingStats,
  } = useQueue();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const stats = getProcessingStats();

  if (error) {
    return (
      <Card variant="pink" className={clsx('queue-error', className)}>
        <CardContent>
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Queue Error</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={refreshQueue} variant="primary">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={clsx('video-queue', className)}>
      <Card variant="pink">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff0080] text-white">
                <QueueListIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  Generation Queue
                </h2>
                <p className="text-gray-600 text-sm">
                  {queuedVideos.length} videos • {stats.active} active • {stats.pending} pending
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {queueState.isProcessing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pauseQueue}
                  className="flex items-center gap-2 text-yellow-600 border-yellow-600"
                >
                  <PauseIcon className="w-4 h-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resumeQueue}
                  className="flex items-center gap-2 text-[#00ff00] border-[#00ff00]"
                >
                  <PlayIcon className="w-4 h-4" />
                  Resume
                </Button>
              )}

              {queuedVideos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 text-red-600 border-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                  Clear
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={refreshQueue}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loading size="lg" />
              <p className="mt-4 text-gray-600 font-bold">Loading queue...</p>
            </div>
          ) : queuedVideos.length === 0 ? (
            <div className="text-center py-12">
              <QueueListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Queue is Empty</h3>
              <p className="text-gray-600">
                No videos in generation queue. Create a new video to get started!
              </p>
            </div>
          ) : (
            <>
              {/* Queue Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 border-2 border-gray-200 text-center">
                  <div className="text-2xl font-bold text-[#ff0080]">{stats.active}</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Active</div>
                </div>
                <div className="bg-gray-50 p-3 border-2 border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.pending}</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Pending</div>
                </div>
                <div className="bg-gray-50 p-3 border-2 border-gray-200 text-center">
                  <div className="text-2xl font-bold text-[#00ff00]">{stats.completed}</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Completed</div>
                </div>
                <div className="bg-gray-50 p-3 border-2 border-gray-200 text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Failed</div>
                </div>
              </div>

              {/* Queue Items */}
              <div className="space-y-3">
                <AnimatePresence>
                  {queuedVideos.map((queuedVideo, index) => {
                    const video = queuedVideo.video;
                    const position = getQueuePosition(queuedVideo.id);
                    const waitTime = getEstimatedWaitTime(queuedVideo.id);
                    
                    return (
                      <motion.div
                        key={queuedVideo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        transition={{ delay: index * 0.05 }}
                        className={clsx(
                          'queue-item border-3 bg-white p-4',
                          video.status === 'processing' && 'border-[#ff0080] bg-[#ff0080]/5',
                          video.status === 'pending' && 'border-blue-500 bg-blue-50',
                          video.status === 'failed' && 'border-red-500 bg-red-50',
                          video.status === 'completed' && 'border-[#00ff00] bg-green-50'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Position Badge */}
                          <div className={clsx(
                            'flex-shrink-0 w-8 h-8 border-2 border-black flex items-center justify-center text-sm font-bold',
                            video.status === 'processing' && 'bg-[#ff0080] text-white',
                            video.status === 'pending' && 'bg-blue-500 text-white',
                            video.status === 'failed' && 'bg-red-500 text-white',
                            video.status === 'completed' && 'bg-[#00ff00] text-black'
                          )}>
                            {position > 0 ? position : '?'}
                          </div>

                          {/* Video Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-lg line-clamp-1">
                                  {video.title}
                                </h4>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {video.prompt}
                                </p>
                              </div>

                              {/* Status Badge */}
                              <div className={clsx(
                                'px-2 py-1 text-xs font-bold uppercase border-2 border-black',
                                video.status === 'processing' && 'bg-[#ff0080] text-white',
                                video.status === 'pending' && 'bg-blue-500 text-white',
                                video.status === 'failed' && 'bg-red-500 text-white',
                                video.status === 'completed' && 'bg-[#00ff00] text-black'
                              )}>
                                {video.status === 'processing' && (
                                  <div className="flex items-center gap-1">
                                    <SparklesIcon className="w-3 h-3" />
                                    Processing
                                  </div>
                                )}
                                {video.status === 'pending' && (
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    Pending
                                  </div>
                                )}
                                {video.status === 'failed' && (
                                  <div className="flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                    Failed
                                  </div>
                                )}
                                {video.status === 'completed' && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" />
                                    Done
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {video.status === 'processing' && video.progress > 0 && (
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{video.stage || 'Processing'}...</span>
                                  <span className="font-bold">{Math.round(video.progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 border-2 border-black h-3">
                                  <motion.div
                                    className="h-full bg-[#ff0080]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${video.progress}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                              <div>
                                Resolution: <strong>{video.settings.resolution}</strong>
                              </div>
                              <div>
                                Duration: <strong>{video.settings.duration}s</strong>
                              </div>
                              <div>
                                Quality: <strong className="capitalize">{video.settings.quality}</strong>
                              </div>
                              <div>
                                Cost: <strong className="text-[#ff0080]">{video.costCredits} credits</strong>
                              </div>
                            </div>

                            {/* Time Info */}
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                Added {formatDistance(new Date(queuedVideo.addedAt), new Date(), { addSuffix: true })}
                                {waitTime > 0 && (
                                  <span className="ml-2">
                                    • Est. wait: <strong>{Math.ceil(waitTime / 60)}min</strong>
                                  </span>
                                )}
                                {video.estimatedTimeRemaining && video.status === 'processing' && (
                                  <span className="ml-2">
                                    • Time remaining: <strong>{Math.ceil(video.estimatedTimeRemaining / 60)}min</strong>
                                  </span>
                                )}
                              </div>

                              {/* Priority Badge */}
                              {queuedVideo.priority !== 'normal' && (
                                <div className={clsx(
                                  'px-2 py-1 text-xs font-bold uppercase border-2 border-black',
                                  queuedVideo.priority === 'high' && 'bg-red-500 text-white',
                                  queuedVideo.priority === 'low' && 'bg-gray-500 text-white'
                                )}>
                                  {queuedVideo.priority} priority
                                </div>
                              )}
                            </div>

                            {/* Error Details */}
                            {video.status === 'failed' && video.error && (
                              <div className="mt-3 p-3 bg-red-100 border-2 border-red-300 text-sm">
                                <div className="font-bold text-red-700 mb-1">Error:</div>
                                <div className="text-red-600">{video.error.message}</div>
                                {video.error.suggestedAction && (
                                  <div className="text-red-700 font-semibold mt-1">
                                    Suggestion: {video.error.suggestedAction}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {video.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromQueue(queuedVideo.id)}
                                className="text-red-600 border-red-600"
                              >
                                <StopIcon className="w-4 h-4" />
                              </Button>
                            )}

                            {video.status === 'processing' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromQueue(queuedVideo.id)}
                                className="text-red-600 border-red-600"
                              >
                                <StopIcon className="w-4 h-4" />
                              </Button>
                            )}

                            {(video.status === 'failed' || video.status === 'completed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromQueue(queuedVideo.id)}
                                className="text-gray-600 border-gray-600"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Queue Status Footer */}
              {queueState.estimatedTimeRemaining && queueState.estimatedTimeRemaining > 0 && (
                <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <ClockIcon className="w-5 h-5" />
                    <span>
                      Total estimated time for queue: 
                      <strong className="ml-1 text-[#ff0080]">
                        {Math.ceil(queueState.estimatedTimeRemaining / 60)} minutes
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Clear Queue Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Queue"
        size="md"
      >
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Clear Entire Queue?</h3>
          <p className="text-gray-600 mb-6">
            This will remove all {queuedVideos.length} videos from the queue and cancel any active generations. 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                clearQueue();
                setShowClearConfirm(false);
              }}
              className="bg-red-500 border-red-500 hover:bg-red-600"
            >
              Clear Queue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default VideoQueue;