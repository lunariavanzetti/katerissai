// Video Preview Component for Kateriss AI Video Generator
// Shows video preview with pink play button and hover effects

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  HeartIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Video, VideoStatus } from '../../types/video';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import { VideoPlayer } from './VideoPlayer';
import { Modal } from '../ui/Modal';
import { formatDistance } from 'date-fns';

interface VideoPreviewProps {
  video: Video;
  size?: 'sm' | 'md' | 'lg';
  showMetadata?: boolean;
  showActions?: boolean;
  showStatus?: boolean;
  onClick?: () => void;
  onFavorite?: (videoId: string) => void;
  onDownload?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  className?: string;
}

// Status indicator colors
const STATUS_COLORS: Record<VideoStatus, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-[#ff0080]',
  completed: 'bg-[#00ff00]',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

const STATUS_LABELS: Record<VideoStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Ready',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function VideoPreview({
  video,
  size = 'md',
  showMetadata = true,
  showActions = true,
  showStatus = true,
  onClick,
  onFavorite,
  onDownload,
  onShare,
  className,
}: VideoPreviewProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'max-w-sm',
      aspectRatio: 'aspect-video',
      titleSize: 'text-sm',
      metaSize: 'text-xs',
      buttonSize: 'sm' as const,
      iconSize: 'w-4 h-4',
      playIconSize: 'w-8 h-8',
    },
    md: {
      container: 'max-w-md',
      aspectRatio: 'aspect-video',
      titleSize: 'text-base',
      metaSize: 'text-sm',
      buttonSize: 'sm' as const,
      iconSize: 'w-5 h-5',
      playIconSize: 'w-12 h-12',
    },
    lg: {
      container: 'max-w-lg',
      aspectRatio: 'aspect-video',
      titleSize: 'text-lg',
      metaSize: 'text-base',
      buttonSize: 'md' as const,
      iconSize: 'w-6 h-6',
      playIconSize: 'w-16 h-16',
    },
  };

  const config = sizeConfig[size];

  // Handle click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (video.status === 'completed' && video.videoUrl) {
      setShowPlayer(true);
    }
  }, [onClick, video.status, video.videoUrl]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(video.id);
  }, [onFavorite, video.id]);

  // Handle download
  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.(video.id);
  }, [onDownload, video.id]);

  // Handle share
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(video.id);
  }, [onShare, video.id]);

  // Format view count
  const formatViewCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // Get thumbnail or placeholder
  const getThumbnailSrc = (): string => {
    if (video.thumbnailUrl && !imageError) {
      return video.thumbnailUrl;
    }
    return ''; // Will show placeholder
  };

  return (
    <>
      <Card
        variant="default"
        hover={video.status === 'completed'}
        className={clsx(
          'video-preview cursor-pointer overflow-hidden',
          config.container,
          {
            'opacity-60': video.status !== 'completed',
            'cursor-not-allowed': video.status !== 'completed' && !onClick,
          },
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Thumbnail Container */}
        <div className={clsx('relative', config.aspectRatio, 'bg-gray-200 overflow-hidden')}>
          {/* Status Badge */}
          {showStatus && (
            <div className="absolute top-2 left-2 z-10">
              <div
                className={clsx(
                  'px-2 py-1 text-white text-xs font-bold uppercase tracking-wide border-2 border-white',
                  STATUS_COLORS[video.status]
                )}
              >
                {STATUS_LABELS[video.status]}
              </div>
            </div>
          )}

          {/* Progress Bar for Processing Videos */}
          {video.status === 'processing' && video.progress > 0 && (
            <div className="absolute top-0 left-0 right-0 z-10">
              <div className="h-1 bg-gray-300">
                <motion.div
                  className="h-full bg-[#ff0080]"
                  initial={{ width: 0 }}
                  animate={{ width: `${video.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Favorite Button */}
          {showActions && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered || video.isFavorite ? 1 : 0,
                scale: isHovered || video.isFavorite ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
              onClick={handleFavoriteToggle}
              className="absolute top-2 right-2 z-10 p-2 bg-white/90 border-2 border-black hover:bg-white transition-colors"
            >
              {video.isFavorite ? (
                <HeartSolidIcon className={clsx(config.iconSize, 'text-[#ff0080]')} />
              ) : (
                <HeartIcon className={clsx(config.iconSize, 'text-black')} />
              )}
            </motion.button>
          )}

          {/* Thumbnail Image */}
          {getThumbnailSrc() ? (
            <img
              src={getThumbnailSrc()}
              alt={video.title}
              className={clsx(
                'w-full h-full object-cover transition-transform duration-300',
                { 'scale-105': isHovered && video.status === 'completed' }
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              {video.status === 'processing' ? (
                <div className="text-center">
                  <Loading size="md" />
                  <p className="text-xs text-gray-600 mt-2 font-bold">
                    {video.stage === 'generating' ? 'Generating...' : 'Processing...'}
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <VideoCameraIcon className={clsx(config.playIconSize, 'mx-auto mb-2')} />
                  <p className="text-xs font-bold">
                    {video.status === 'failed' ? 'Generation Failed' : 'No Preview'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Play Button Overlay */}
          {video.status === 'completed' && video.videoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered ? 1 : 0.8,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="p-4 bg-[#ff0080] text-white border-3 border-white shadow-lg">
                <PlayIcon className={config.playIconSize} />
              </div>
            </motion.div>
          )}

          {/* Processing Overlay */}
          {video.status === 'processing' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm font-bold uppercase">
                  {Math.round(video.progress)}% Complete
                </p>
                {video.estimatedTimeRemaining && (
                  <p className="text-xs opacity-80">
                    ~{Math.ceil(video.estimatedTimeRemaining / 60)} min remaining
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Failed Overlay */}
          {video.status === 'failed' && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <div className="text-center text-red-600">
                <div className="text-2xl mb-2">❌</div>
                <p className="text-sm font-bold uppercase">Generation Failed</p>
                <p className="text-xs">Click to retry</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Information */}
        {showMetadata && (
          <div className="p-4">
            {/* Title */}
            <h3 className={clsx(
              'font-bold uppercase tracking-wide text-black mb-2 line-clamp-2',
              config.titleSize
            )}>
              {video.title}
            </h3>

            {/* Description */}
            {video.description && (
              <p className={clsx(
                'text-gray-600 mb-3 line-clamp-2',
                config.metaSize
              )}>
                {video.description}
              </p>
            )}

            {/* Metadata Row */}
            <div className={clsx('flex items-center gap-4 text-gray-500', config.metaSize)}>
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {formatDistance(new Date(video.createdAt), new Date(), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{video.settings.duration}s</span>
              </div>

              {video.viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <EyeIcon className="w-4 h-4" />
                  <span>{formatViewCount(video.viewCount)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {video.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-300"
                  >
                    {tag}
                  </span>
                ))}
                {video.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-300">
                    +{video.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            {showActions && video.status === 'completed' && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-gray-100">
                <div className="flex items-center gap-2">
                  {video.videoUrl && (
                    <Button
                      variant="outline"
                      size={config.buttonSize}
                      onClick={handleDownload}
                      className="flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download
                    </Button>
                  )}

                  {onShare && (
                    <Button
                      variant="ghost"
                      size={config.buttonSize}
                      onClick={handleShare}
                      className="flex items-center gap-1"
                    >
                      <ShareIcon className="w-4 h-4" />
                      Share
                    </Button>
                  )}
                </div>

                <div className={clsx('font-bold text-[#ff0080]', config.metaSize)}>
                  {video.costCredits} credits
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Video Player Modal */}
      {video.videoUrl && (
        <Modal
          isOpen={showPlayer}
          onClose={() => setShowPlayer(false)}
          title={video.title}
          size="xl"
          className="video-player-modal"
        >
          <VideoPlayer
            video={video}
            controls
            showDownload
            showShare={!!onShare}
            onPlay={() => {
              // Track view
              if (video.viewCount !== undefined) {
                video.viewCount += 1;
              }
            }}
          />

          {video.description && (
            <div className="mt-4 p-4 bg-gray-50 border-2 border-gray-200">
              <h4 className="font-bold mb-2">Description:</h4>
              <p className="text-gray-700">{video.description}</p>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export default VideoPreview;