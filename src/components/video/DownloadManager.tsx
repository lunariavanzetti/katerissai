// Download Manager Component for Kateriss AI Video Generator
// Handles downloads with progress tracking

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentIcon,
  PlayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Video, VideoExportJob, VideoDownloadOptions } from '../../types/video';
import { videoProcessor } from '../../services/videoProcessor';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Loading } from '../ui/Loading';
import toast from 'react-hot-toast';

interface DownloadManagerProps {
  video: Video;
  onClose?: () => void;
  className?: string;
}

interface DownloadProgress {
  id: string;
  progress: number;
  status: 'preparing' | 'downloading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export function DownloadManager({ video, onClose, className }: DownloadManagerProps) {
  const [downloadOptions, setDownloadOptions] = useState<VideoDownloadOptions>({
    format: 'mp4',
    quality: 'high',
    includeMetadata: true,
    includeThumbnails: false,
  });
  const [activeDownloads, setActiveDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [exportJobs, setExportJobs] = useState<VideoExportJob[]>([]);

  // Start download
  const handleDownload = useCallback(async (options: VideoDownloadOptions) => {
    const downloadId = `download_${Date.now()}`;
    
    // Add to active downloads
    setActiveDownloads(prev => new Map(prev.set(downloadId, {
      id: downloadId,
      progress: 0,
      status: 'preparing',
    })));

    try {
      // Create export job
      const exportResult = await videoProcessor.createExportJob(video.id, options);
      
      if (!exportResult.success || !exportResult.data) {
        throw new Error(exportResult.error?.message || 'Failed to create export job');
      }

      const exportJob = exportResult.data;
      setExportJobs(prev => [...prev, exportJob]);

      // Update progress
      setActiveDownloads(prev => new Map(prev.set(downloadId, {
        ...prev.get(downloadId)!,
        status: 'downloading',
        progress: 10,
      })));

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      
      const pollStatus = async () => {
        try {
          const statusResult = await videoProcessor.getExportJobStatus(exportJob.id);
          
          if (!statusResult.success || !statusResult.data) {
            throw new Error('Failed to check export status');
          }

          const job = statusResult.data;
          
          setActiveDownloads(prev => new Map(prev.set(downloadId, {
            ...prev.get(downloadId)!,
            progress: job.progress,
          })));

          if (job.status === 'completed' && job.downloadUrl) {
            // Download completed
            setActiveDownloads(prev => new Map(prev.set(downloadId, {
              ...prev.get(downloadId)!,
              status: 'completed',
              progress: 100,
              url: job.downloadUrl,
            })));

            // Trigger browser download
            const link = document.createElement('a');
            link.href = job.downloadUrl;
            link.download = `${video.title}.${options.format}`;
            link.click();

            toast.success('Download completed!');
            
            // Clean up after 5 seconds
            setTimeout(() => {
              setActiveDownloads(prev => {
                const newMap = new Map(prev);
                newMap.delete(downloadId);
                return newMap;
              });
            }, 5000);

          } else if (job.status === 'failed') {
            throw new Error('Export job failed');
          } else if (attempts < maxAttempts) {
            // Continue polling
            attempts++;
            setTimeout(pollStatus, 5000);
          } else {
            throw new Error('Download timed out');
          }

        } catch (error) {
          setActiveDownloads(prev => new Map(prev.set(downloadId, {
            ...prev.get(downloadId)!,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })));
          
          toast.error('Download failed');
        }
      };

      // Start polling
      setTimeout(pollStatus, 2000);

    } catch (error) {
      setActiveDownloads(prev => new Map(prev.set(downloadId, {
        ...prev.get(downloadId)!,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })));
      
      toast.error('Failed to start download');
    }
  }, [video.id, video.title]);

  // Quick download (direct video URL)
  const handleQuickDownload = useCallback(() => {
    if (!video.videoUrl) {
      toast.error('Video URL not available');
      return;
    }

    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = `${video.title}.mp4`;
    link.click();
    
    toast.success('Download started');
  }, [video.videoUrl, video.title]);

  // Cancel download
  const cancelDownload = useCallback((downloadId: string) => {
    setActiveDownloads(prev => {
      const newMap = new Map(prev);
      newMap.delete(downloadId);
      return newMap;
    });
    toast.success('Download cancelled');
  }, []);

  return (
    <Card variant="pink" className={clsx('download-manager', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff0080] text-white">
              <ArrowDownTrayIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide">
                Download Video
              </h2>
              <p className="text-gray-600 text-sm">
                {video.title}
              </p>
            </div>
          </div>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <XMarkIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Download */}
        {video.videoUrl && (
          <div className="p-4 bg-green-50 border-2 border-[#00ff00]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#00ff00] mb-1">Quick Download</h3>
                <p className="text-sm text-gray-600">
                  Download the original video file directly
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleQuickDownload}
                className="bg-[#00ff00] border-[#00ff00] text-black hover:bg-green-400"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Download Now
              </Button>
            </div>
          </div>
        )}

        {/* Custom Download Options */}
        <div>
          <h3 className="font-bold mb-4">Custom Download</h3>
          
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-bold mb-2">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {['mp4', 'webm'].map((format) => (
                  <label
                    key={format}
                    className={clsx(
                      'flex items-center justify-center p-3 border-3 cursor-pointer transition-colors',
                      downloadOptions.format === format
                        ? 'bg-[#ff0080] text-white border-[#ff0080]'
                        : 'bg-white border-black hover:bg-gray-100'
                    )}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={downloadOptions.format === format}
                      onChange={(e) => setDownloadOptions(prev => ({
                        ...prev,
                        format: e.target.value as any,
                      }))}
                      className="sr-only"
                    />
                    <span className="font-bold uppercase">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quality Selection */}
            <div>
              <label className="block text-sm font-bold mb-2">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {['fast', 'balanced', 'high'].map((quality) => (
                  <label
                    key={quality}
                    className={clsx(
                      'flex items-center justify-center p-3 border-3 cursor-pointer transition-colors',
                      downloadOptions.quality === quality
                        ? 'bg-[#ff0080] text-white border-[#ff0080]'
                        : 'bg-white border-black hover:bg-gray-100'
                    )}
                  >
                    <input
                      type="radio"
                      name="quality"
                      value={quality}
                      checked={downloadOptions.quality === quality}
                      onChange={(e) => setDownloadOptions(prev => ({
                        ...prev,
                        quality: e.target.value as any,
                      }))}
                      className="sr-only"
                    />
                    <span className="font-bold capitalize">{quality}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={downloadOptions.includeMetadata}
                  onChange={(e) => setDownloadOptions(prev => ({
                    ...prev,
                    includeMetadata: e.target.checked,
                  }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold">Include Metadata</div>
                  <div className="text-sm text-gray-600">
                    Add video information to file properties
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={downloadOptions.includeThumbnails}
                  onChange={(e) => setDownloadOptions(prev => ({
                    ...prev,
                    includeThumbnails: e.target.checked,
                  }))}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold">Include Thumbnails</div>
                  <div className="text-sm text-gray-600">
                    Download thumbnail images separately
                  </div>
                </div>
              </label>
            </div>

            {/* Download Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleDownload(downloadOptions)}
              disabled={activeDownloads.size > 0}
              className="w-full"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Start Custom Download
            </Button>
          </div>
        </div>

        {/* Active Downloads */}
        <AnimatePresence>
          {activeDownloads.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-bold mb-4">Active Downloads</h3>
              <div className="space-y-3">
                {Array.from(activeDownloads.values()).map((download) => (
                  <div
                    key={download.id}
                    className="p-4 border-3 border-[#ff0080] bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'p-2 border-2 border-black',
                          download.status === 'preparing' && 'bg-blue-500 text-white',
                          download.status === 'downloading' && 'bg-[#ff0080] text-white',
                          download.status === 'completed' && 'bg-[#00ff00] text-black',
                          download.status === 'failed' && 'bg-red-500 text-white'
                        )}>
                          {download.status === 'preparing' && <DocumentIcon className="w-4 h-4" />}
                          {download.status === 'downloading' && <ArrowDownTrayIcon className="w-4 h-4" />}
                          {download.status === 'completed' && <CheckCircleIcon className="w-4 h-4" />}
                          {download.status === 'failed' && <ExclamationTriangleIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold capitalize">
                            {download.status === 'preparing' && 'Preparing download...'}
                            {download.status === 'downloading' && 'Downloading...'}
                            {download.status === 'completed' && 'Download completed!'}
                            {download.status === 'failed' && 'Download failed'}
                          </div>
                          {download.error && (
                            <div className="text-sm text-red-600">{download.error}</div>
                          )}
                        </div>
                      </div>

                      {download.status !== 'completed' && download.status !== 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelDownload(download.id)}
                          className="text-red-600 border-red-600"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {download.status === 'downloading' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round(download.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 border-2 border-black h-3">
                          <motion.div
                            className="h-full bg-[#ff0080]"
                            initial={{ width: 0 }}
                            animate={{ width: `${download.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Completed Actions */}
                    {download.status === 'completed' && download.url && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(download.url, '_blank')}
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = download.url!;
                            link.download = `${video.title}.${downloadOptions.format}`;
                            link.click();
                          }}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                          Download Again
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Info */}
        <div className="p-4 bg-gray-50 border-2 border-gray-200">
          <h4 className="font-bold mb-2">Video Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Title:</span>
              <div className="font-semibold">{video.title}</div>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <div className="font-semibold">{video.settings.duration}s</div>
            </div>
            <div>
              <span className="text-gray-600">Resolution:</span>
              <div className="font-semibold">{video.settings.resolution}</div>
            </div>
            <div>
              <span className="text-gray-600">Quality:</span>
              <div className="font-semibold capitalize">{video.settings.quality}</div>
            </div>
            {video.metadata && (
              <>
                <div>
                  <span className="text-gray-600">File Size:</span>
                  <div className="font-semibold">
                    {(video.metadata.fileSize / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Format:</span>
                  <div className="font-semibold uppercase">{video.metadata.format}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DownloadManager;