// Custom Video Player Component for Kateriss AI Video Generator
// Features custom pink controls and brutalist design

import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ShareIcon,
} from '@heroicons/react/24/solid';
import { 
  ArrowsPointingInIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Video } from '../../types/video';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  video: Video;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  showMetadata?: boolean;
  showDownload?: boolean;
  showShare?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export function VideoPlayer({
  video,
  autoplay = false,
  controls = true,
  loop = false,
  muted = true, // Default to muted since Veo doesn't generate audio
  showMetadata = false,
  showDownload = true,
  showShare = false,
  className,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 0.7);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');

  // Control visibility timer
  const controlsTimerRef = useRef<NodeJS.Timeout>();

  // Initialize video
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const time = videoElement.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
      hideControlsAfterDelay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
      showControlsPermanently();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
      showControlsPermanently();
    };

    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('volumechange', handleVolumeChange);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls visibility
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const showControlsPermanently = useCallback(() => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    setShowControls(true);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  // Playback controls
  const togglePlayPause = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.volume = newVolume;
    videoElement.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isMuted) {
      videoElement.muted = false;
      videoElement.volume = volume > 0 ? volume : 0.7;
    } else {
      videoElement.muted = true;
    }
  }, [isMuted, volume]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Fullscreen not supported');
    }
  }, [isFullscreen]);

  const handleDownload = useCallback(async () => {
    if (!video.videoUrl) return;

    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video.title}.mp4`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  }, [video.videoUrl, video.title]);

  const handleShare = useCallback(async () => {
    if (!video.videoUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || `Check out this AI-generated video: ${video.title}`,
          url: video.videoUrl,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(video.videoUrl);
      toast.success('Video URL copied to clipboard');
    }
  }, [video.videoUrl, video.title, video.description]);

  // Format time
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!video.videoUrl) {
    return (
      <div className={clsx('video-player-placeholder', className)}>
        <div className="aspect-video bg-gray-100 border-3 border-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🎬</div>
            <p className="text-gray-600 font-bold">Video not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'video-player relative bg-black border-3 border-black overflow-hidden',
        { 'cursor-none': !showControls && isPlaying },
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => hideControlsAfterDelay()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <Loading size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play Button Overlay */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#ff0080] text-white p-6 border-3 border-white shadow-lg">
              <PlayIcon className="w-16 h-16" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {controls && showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-none appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:bg-[#ff0080]
                           [&::-webkit-slider-thumb]:border-2
                           [&::-webkit-slider-thumb]:border-white
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-moz-range-thumb]:w-4
                           [&::-moz-range-thumb]:h-4
                           [&::-moz-range-thumb]:bg-[#ff0080]
                           [&::-moz-range-thumb]:border-2
                           [&::-moz-range-thumb]:border-white
                           [&::-moz-range-thumb]:cursor-pointer
                           [&::-moz-range-thumb]:border-radius-0"
                style={{
                  background: `linear-gradient(to right, #ff0080 ${(currentTime / duration) * 100}%, #666 ${(currentTime / duration) * 100}%)`
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  onClick={togglePlayPause}
                  className="p-2 bg-[#ff0080] text-white border-2 border-white hover:bg-[#ff69b4] transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:text-[#ff0080] transition-colors"
                  >
                    {isMuted ? (
                      <SpeakerXMarkIcon className="w-5 h-5" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5" />
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-none appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-3
                               [&::-webkit-slider-thumb]:h-3
                               [&::-webkit-slider-thumb]:bg-[#ff0080]
                               [&::-webkit-slider-thumb]:border-white
                               [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <div className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Download */}
                {showDownload && (
                  <button
                    onClick={handleDownload}
                    className="p-2 text-white hover:text-[#ff0080] transition-colors"
                    title="Download video"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Share */}
                {showShare && (
                  <button
                    onClick={handleShare}
                    className="p-2 text-white hover:text-[#ff0080] transition-colors"
                    title="Share video"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-white hover:text-[#ff0080] transition-colors"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:text-[#ff0080] transition-colors"
                  title="Fullscreen"
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="w-5 h-5" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 bg-black/90 text-white p-4 border-2 border-white min-w-48"
          >
            <h3 className="font-bold mb-3">Settings</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="block mb-1">Playback Speed</label>
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = Number(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = rate;
                    }
                  }}
                  className="w-full bg-gray-800 text-white p-1 border border-gray-600"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full bg-gray-800 text-white p-1 border border-gray-600"
                >
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Metadata */}
      {showMetadata && video.metadata && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 bg-black/90 text-white p-3 border-2 border-white max-w-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <InformationCircleIcon className="w-5 h-5" />
            <h3 className="font-bold text-sm">Video Info</h3>
          </div>
          
          <div className="text-xs space-y-1">
            <div>Resolution: {video.metadata.width}×{video.metadata.height}</div>
            <div>Duration: {video.metadata.duration}s</div>
            <div>FPS: {video.metadata.fps}</div>
            <div>Format: {video.metadata.format.toUpperCase()}</div>
            <div>File Size: {(video.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default VideoPlayer;