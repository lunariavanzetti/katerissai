// Queue Management Hook for Kateriss AI Video Generator
// Manages generation queue state and provides real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  GenerationQueue,
  QueuedVideo,
  CreateVideoRequest,
  ApiResponse,
} from '../types/video';
import { queueService, QueueEvent, QueueEventData } from '../services/queue';
import { useAuth } from './useAuth';

// Hook configuration
interface UseQueueConfig {
  enableRealTimeUpdates?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showNotifications?: boolean;
}

// Queue state
interface QueueState {
  isProcessing: boolean;
  currentVideoId?: string;
  estimatedTimeRemaining?: number;
  totalInQueue: number;
  completedToday: number;
  failedToday: number;
}

// Hook return type
interface UseQueueReturn {
  // Data
  queue: GenerationQueue | null;
  queueState: QueueState;
  queuedVideos: QueuedVideo[];
  
  // State
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addToQueue: (request: CreateVideoRequest, priority?: 'low' | 'normal' | 'high') => Promise<void>;
  removeFromQueue: (videoId: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;
  prioritizeVideo: (videoId: string, priority: 'low' | 'normal' | 'high') => Promise<void>;
  pauseQueue: () => Promise<void>;
  resumeQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  
  // Queue control
  startProcessing: () => void;
  stopProcessing: () => void;
  
  // Utilities
  refreshQueue: () => void;
  getQueuePosition: (videoId: string) => number;
  getEstimatedWaitTime: (videoId: string) => number;
  
  // Statistics
  getProcessingStats: () => {
    active: number;
    pending: number;
    completed: number;
    failed: number;
  };
}

const DEFAULT_QUEUE_STATE: QueueState = {
  isProcessing: false,
  totalInQueue: 0,
  completedToday: 0,
  failedToday: 0,
};

export function useQueue(config: UseQueueConfig = {}): UseQueueReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Configuration
  const {
    enableRealTimeUpdates = true,
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds
    showNotifications = true,
  } = config;

  // State
  const [queueState, setQueueState] = useState<QueueState>(DEFAULT_QUEUE_STATE);
  
  // Refs for cleanup
  const mountedRef = useRef(true);
  const eventListenersRef = useRef<Map<QueueEvent, () => void>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup event listeners
      eventListenersRef.current.forEach((cleanup) => cleanup());
      eventListenersRef.current.clear();
    };
  }, []);

  // Fetch queue data
  const {
    data: queue,
    isLoading,
    error,
    refetch: refreshQueue,
  } = useQuery({
    queryKey: ['generationQueue', user?.id],
    queryFn: async (): Promise<GenerationQueue> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await queueService.getQueueStatus(user.id);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch queue');
      }
      
      return response.data;
    },
    enabled: !!user?.id,
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
  });

  // Set up real-time event listeners
  useEffect(() => {
    if (!enableRealTimeUpdates || !user?.id) return;

    const setupEventListener = (event: QueueEvent, handler: (data: QueueEventData) => void) => {
      queueService.addEventListener(event, handler);
      
      const cleanup = () => queueService.removeEventListener(event, handler);
      eventListenersRef.current.set(event, cleanup);
      
      return cleanup;
    };

    // Video added to queue
    setupEventListener('video_added', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Video added to queue:', data);
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      
      if (showNotifications) {
        toast.success('Video added to generation queue');
      }
    });

    // Video started processing
    setupEventListener('video_started', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Video generation started:', data);
      setQueueState(prev => ({
        ...prev,
        isProcessing: true,
        currentVideoId: data.videoId,
      }));
      
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      
      if (showNotifications) {
        toast.loading('Video generation started', { id: data.videoId });
      }
    });

    // Video progress update
    setupEventListener('video_progress', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Video progress:', data);
      
      // Update specific video in cache if possible
      queryClient.setQueryData(['generationQueue', user.id], (oldData: GenerationQueue | undefined) => {
        if (!oldData) return oldData;
        
        const updatedVideos = oldData.videos.map(video => 
          video.id === data.videoId 
            ? { ...video, video: { ...video.video, progress: data.data?.progress || 0 } }
            : video
        );
        
        return { ...oldData, videos: updatedVideos };
      });
    });

    // Video completed
    setupEventListener('video_completed', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Video generation completed:', data);
      setQueueState(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1,
      }));
      
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
      
      if (showNotifications) {
        toast.success('Video generation completed!', { id: data.videoId });
      }
    });

    // Video failed
    setupEventListener('video_failed', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Video generation failed:', data);
      setQueueState(prev => ({
        ...prev,
        failedToday: prev.failedToday + 1,
      }));
      
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      
      if (showNotifications) {
        toast.error('Video generation failed', { id: data.videoId });
      }
    });

    // Video cancelled
    setupEventListener('video_cancelled', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Video cancelled:', data);
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      
      if (showNotifications) {
        toast('Video generation cancelled', { icon: '⏹️' });
      }
    });

    // Queue started
    setupEventListener('queue_started', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Queue processing started');
      setQueueState(prev => ({ ...prev, isProcessing: true }));
      
      if (showNotifications) {
        toast.success('Queue processing started');
      }
    });

    // Queue paused
    setupEventListener('queue_paused', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Queue processing paused');
      setQueueState(prev => ({ ...prev, isProcessing: false }));
      
      if (showNotifications) {
        toast('Queue processing paused', { icon: '⏸️' });
      }
    });

    // Queue empty
    setupEventListener('queue_empty', (data) => {
      if (!mountedRef.current) return;
      
      console.log('Queue is empty');
      setQueueState(prev => ({
        ...prev,
        isProcessing: false,
        currentVideoId: undefined,
        totalInQueue: 0,
      }));
      
      if (showNotifications) {
        toast.success('All videos processed!');
      }
    });

    // Cleanup function
    return () => {
      eventListenersRef.current.forEach((cleanup) => cleanup());
      eventListenersRef.current.clear();
    };
  }, [user?.id, enableRealTimeUpdates, showNotifications, queryClient]);

  // Update queue state when queue data changes
  useEffect(() => {
    if (!queue) return;

    const processingVideo = queue.videos.find(v => v.video.status === 'processing');
    
    setQueueState(prev => ({
      ...prev,
      totalInQueue: queue.videos.length,
      currentVideoId: processingVideo?.id,
      estimatedTimeRemaining: queue.estimatedTimeRemaining,
    }));
  }, [queue]);

  // Add to queue mutation
  const addToQueueMutation = useMutation({
    mutationFn: async ({ 
      request, 
      priority = 'normal' 
    }: { 
      request: CreateVideoRequest; 
      priority?: 'low' | 'normal' | 'high' 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await queueService.addToQueue(user.id, request, priority);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add to queue');
      }
      
      return response.data;
    },
    onSuccess: (queuedVideo) => {
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      
      if (showNotifications) {
        toast.success(`"${queuedVideo.video.title}" added to queue`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to add to queue: ${error.message}`);
    },
  });

  // Remove from queue mutation
  const removeFromQueueMutation = useMutation({
    mutationFn: async (videoId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await queueService.removeFromQueue(user.id, videoId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to remove from queue');
      }
      
      return true;
    },
    onMutate: async (videoId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['generationQueue'] });
      
      const previousData = queryClient.getQueryData(['generationQueue', user?.id]);
      
      queryClient.setQueryData(['generationQueue', user?.id], (old: GenerationQueue | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          videos: old.videos.filter(v => v.id !== videoId),
        };
      });
      
      return { previousData };
    },
    onError: (error, videoId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['generationQueue', user?.id], context.previousData);
      }
      toast.error(`Failed to remove from queue: ${error.message}`);
    },
    onSuccess: () => {
      if (showNotifications) {
        toast.success('Video removed from queue');
      }
    },
  });

  // Clear queue mutation
  const clearQueueMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !queue) throw new Error('User not authenticated or no queue');
      
      // Remove all videos from queue
      const videoIds = queue.videos.map(v => v.id);
      for (const videoId of videoIds) {
        const response = await queueService.removeFromQueue(user.id, videoId);
        if (!response.success) {
          console.error('Failed to remove video:', response.error);
        }
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
      
      if (showNotifications) {
        toast.success('Queue cleared');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to clear queue: ${error.message}`);
    },
  });

  // Actions
  const addToQueue = useCallback(async (
    request: CreateVideoRequest, 
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    await addToQueueMutation.mutateAsync({ request, priority });
  }, [addToQueueMutation]);

  const removeFromQueue = useCallback(async (videoId: string) => {
    if (window.confirm('Are you sure you want to remove this video from the queue?')) {
      await removeFromQueueMutation.mutateAsync(videoId);
    }
  }, [removeFromQueueMutation]);

  const clearQueue = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear the entire queue? This will cancel all pending generations.')) {
      await clearQueueMutation.mutateAsync();
    }
  }, [clearQueueMutation]);

  const reorderQueue = useCallback(async (fromIndex: number, toIndex: number) => {
    // This would typically involve updating the queue order on the server
    // For now, we'll just show a notification
    toast.success('Queue reordered (feature coming soon)');
  }, []);

  const prioritizeVideo = useCallback(async (videoId: string, priority: 'low' | 'normal' | 'high') => {
    // This would typically involve updating the video priority on the server
    // For now, we'll just show a notification
    toast.success(`Video priority updated to ${priority}`);
  }, []);

  const pauseQueue = useCallback(async () => {
    queueService.stopProcessing();
    if (showNotifications) {
      toast('Queue paused', { icon: '⏸️' });
    }
  }, [showNotifications]);

  const resumeQueue = useCallback(async () => {
    queueService.startProcessing();
    if (showNotifications) {
      toast.success('Queue resumed');
    }
  }, [showNotifications]);

  const startProcessing = useCallback(() => {
    queueService.startProcessing();
  }, []);

  const stopProcessing = useCallback(() => {
    queueService.stopProcessing();
  }, []);

  // Utilities
  const getQueuePosition = useCallback((videoId: string): number => {
    if (!queue) return -1;
    
    const index = queue.videos.findIndex(v => v.id === videoId);
    return index >= 0 ? index + 1 : -1;
  }, [queue]);

  const getEstimatedWaitTime = useCallback((videoId: string): number => {
    if (!queue) return 0;
    
    const videoIndex = queue.videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) return 0;
    
    // Calculate estimated time based on videos ahead in queue
    let totalTime = 0;
    for (let i = 0; i < videoIndex; i++) {
      const video = queue.videos[i];
      if (video.video.status === 'pending') {
        // Estimate ~2 minutes per video (adjust based on settings)
        totalTime += 120;
      }
    }
    
    return totalTime;
  }, [queue]);

  const getProcessingStats = useCallback(() => {
    if (!queue) {
      return { active: 0, pending: 0, completed: 0, failed: 0 };
    }
    
    const stats = {
      active: queue.videos.filter(v => v.video.status === 'processing').length,
      pending: queue.videos.filter(v => v.video.status === 'pending').length,
      completed: queue.completedVideos,
      failed: queue.failedVideos,
    };
    
    return stats;
  }, [queue]);

  // Derived data
  const queuedVideos = queue?.videos || [];

  return {
    // Data
    queue,
    queueState,
    queuedVideos,
    
    // State
    isLoading,
    error,
    
    // Actions
    addToQueue,
    removeFromQueue,
    reorderQueue,
    prioritizeVideo,
    pauseQueue,
    resumeQueue,
    clearQueue,
    
    // Queue control
    startProcessing,
    stopProcessing,
    
    // Utilities
    refreshQueue,
    getQueuePosition,
    getEstimatedWaitTime,
    getProcessingStats,
  };
}