// Video Library Hook for Kateriss AI Video Generator
// Manages user's video library, filtering, sorting, and bulk operations

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Video,
  VideoFilter,
  VideoSortOptions,
  VideoPaginationOptions,
  VideoLibraryResponse,
  GenerationStats,
  VideoUpdate,
  BatchOperation,
} from '../types/video';
import { supabase } from '../config/supabase';
import { storageService } from '../services/storage';
import { videoProcessor } from '../services/videoProcessor';
import { useAuthContext } from '../contexts/AuthContext';

// Hook configuration
interface UseVideoLibraryConfig {
  pageSize?: number;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTimeUpdates?: boolean;
}

// Library state
interface LibraryState {
  selectedVideos: Set<string>;
  isSelectionMode: boolean;
  viewMode: 'grid' | 'list';
  filter: VideoFilter;
  sort: VideoSortOptions;
  pagination: VideoPaginationOptions;
}

// Hook return type
interface UseVideoLibraryReturn {
  // Data
  videos: Video[];
  stats: GenerationStats | null;
  filteredVideos: Video[];
  
  // State
  libraryState: LibraryState;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refreshLibrary: () => void;
  updateVideo: (videoId: string, updates: VideoUpdate) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
  deleteVideos: (videoIds: string[]) => Promise<void>;
  toggleFavorite: (videoId: string) => Promise<void>;
  
  // Selection
  selectVideo: (videoId: string) => void;
  deselectVideo: (videoId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelection: (videoId: string) => void;
  setSelectionMode: (enabled: boolean) => void;
  
  // Filtering and sorting
  updateFilter: (filter: Partial<VideoFilter>) => void;
  updateSort: (sort: VideoSortOptions) => void;
  clearFilters: () => void;
  
  // Pagination
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // View modes
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Bulk operations
  exportSelected: () => Promise<void>;
  downloadSelected: () => Promise<void>;
  
  // Search
  searchVideos: (query: string) => void;
}

const DEFAULT_FILTER: VideoFilter = {};

const DEFAULT_SORT: VideoSortOptions = {
  field: 'createdAt',
  direction: 'desc',
};

const DEFAULT_PAGINATION: VideoPaginationOptions = {
  page: 1,
  pageSize: 12,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useVideoLibrary(config: UseVideoLibraryConfig = {}): UseVideoLibraryReturn {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Configuration
  const {
    pageSize = 12,
    enableAutoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableRealTimeUpdates = true,
  } = config;

  // State
  const [libraryState, setLibraryState] = useState<LibraryState>({
    selectedVideos: new Set(),
    isSelectionMode: false,
    viewMode: 'grid',
    filter: DEFAULT_FILTER,
    sort: DEFAULT_SORT,
    pagination: { ...DEFAULT_PAGINATION, pageSize },
  });

  // Fetch videos query
  const {
    data: libraryResponse,
    isLoading,
    error,
    refetch: refreshLibrary,
  } = useQuery({
    queryKey: [
      'videoLibrary',
      user?.id,
      libraryState.filter,
      libraryState.sort,
      libraryState.pagination.page,
      libraryState.pagination.pageSize,
    ],
    queryFn: async (): Promise<VideoLibraryResponse> => {
      if (!user?.id) throw new Error('User not authenticated');

      // In a real implementation, this would call your API
      // For now, we'll simulate the response
      return {
        videos: await fetchUserVideos(user.id, libraryState),
        pagination: {
          ...libraryState.pagination,
          totalCount: await getTotalVideoCount(user.id, libraryState.filter),
          hasNextPage: false, // Calculate based on totalCount
          hasPreviousPage: libraryState.pagination.page > 1,
        },
        stats: await getGenerationStats(user.id),
      };
    },
    enabled: !!user?.id,
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time updates subscription
  useCallback(() => {
    if (!enableRealTimeUpdates || !user?.id) return;

    const subscription = supabase
      .channel('video_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time video update:', payload);
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
          
          // Show toast notification for updates
          switch (payload.eventType) {
            case 'UPDATE':
              if (payload.new.status === 'completed') {
                toast.success('Video generation completed!');
              }
              break;
            case 'DELETE':
              toast.success('Video deleted');
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, enableRealTimeUpdates, queryClient]);

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, updates }: { videoId: string; updates: VideoUpdate }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update video in database
      const { data, error } = await supabase
        .from('videos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ videoId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['videoLibrary'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['videoLibrary']) as VideoLibraryResponse;

      // Optimistically update the cache
      if (previousData) {
        const updatedVideos = previousData.videos.map(video =>
          video.id === videoId 
            ? { ...video, ...updates, updatedAt: new Date().toISOString() }
            : video
        );

        queryClient.setQueryData(['videoLibrary'], {
          ...previousData,
          videos: updatedVideos,
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['videoLibrary'], context.previousData);
      }
      toast.error(`Failed to update video: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Video updated successfully');
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get video data first to clean up files
      const { data: video } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', user.id)
        .single();

      if (video) {
        // Delete associated files
        const filesToDelete: string[] = [];
        if (video.video_url) {
          const videoPath = new URL(video.video_url).pathname.substring(1);
          filesToDelete.push(videoPath);
        }
        if (video.thumbnail_url) {
          const thumbnailPath = new URL(video.thumbnail_url).pathname.substring(1);
          filesToDelete.push(thumbnailPath);
        }

        if (filesToDelete.length > 0) {
          await storageService.deleteFiles(filesToDelete);
        }
      }

      // Delete video record
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async (videoId) => {
      await queryClient.cancelQueries({ queryKey: ['videoLibrary'] });

      const previousData = queryClient.getQueryData(['videoLibrary']) as VideoLibraryResponse;

      if (previousData) {
        const updatedVideos = previousData.videos.filter(video => video.id !== videoId);
        queryClient.setQueryData(['videoLibrary'], {
          ...previousData,
          videos: updatedVideos,
        });
      }

      // Remove from selection
      setLibraryState(prev => ({
        ...prev,
        selectedVideos: new Set([...prev.selectedVideos].filter(id => id !== videoId)),
      }));

      return { previousData };
    },
    onError: (error, videoId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['videoLibrary'], context.previousData);
      }
      toast.error(`Failed to delete video: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Video deleted successfully');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (videoIds: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete videos one by one (in a real app, you'd batch this)
      for (const videoId of videoIds) {
        await deleteVideoMutation.mutateAsync(videoId);
      }
    },
    onSuccess: (_, videoIds) => {
      toast.success(`Deleted ${videoIds.length} videos`);
      setLibraryState(prev => ({
        ...prev,
        selectedVideos: new Set(),
        isSelectionMode: false,
      }));
    },
    onError: (error) => {
      toast.error(`Failed to delete videos: ${error.message}`);
    },
  });

  // Derived data
  const videos = libraryResponse?.videos || [];
  const stats = libraryResponse?.stats || null;
  
  const filteredVideos = useMemo(() => {
    let filtered = [...videos];
    
    // Apply filters
    if (libraryState.filter.status?.length) {
      filtered = filtered.filter(video => 
        libraryState.filter.status!.includes(video.status)
      );
    }
    
    if (libraryState.filter.searchQuery) {
      const query = libraryState.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query) ||
        video.prompt.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (libraryState.filter.tags?.length) {
      filtered = filtered.filter(video =>
        libraryState.filter.tags!.some(tag => video.tags.includes(tag))
      );
    }
    
    if (libraryState.filter.isFavorite !== undefined) {
      filtered = filtered.filter(video => video.isFavorite === libraryState.filter.isFavorite);
    }
    
    if (libraryState.filter.dateRange) {
      const start = new Date(libraryState.filter.dateRange.start);
      const end = new Date(libraryState.filter.dateRange.end);
      filtered = filtered.filter(video => {
        const videoDate = new Date(video.createdAt);
        return videoDate >= start && videoDate <= end;
      });
    }
    
    return filtered;
  }, [videos, libraryState.filter]);

  // Actions
  const updateVideo = useCallback(async (videoId: string, updates: VideoUpdate) => {
    await updateVideoMutation.mutateAsync({ videoId, updates });
  }, [updateVideoMutation]);

  const deleteVideo = useCallback(async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      await deleteVideoMutation.mutateAsync(videoId);
    }
  }, [deleteVideoMutation]);

  const deleteVideos = useCallback(async (videoIds: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${videoIds.length} videos? This action cannot be undone.`)) {
      await bulkDeleteMutation.mutateAsync(videoIds);
    }
  }, [bulkDeleteMutation]);

  const toggleFavorite = useCallback(async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      await updateVideo(videoId, { isFavorite: !video.isFavorite });
    }
  }, [videos, updateVideo]);

  // Selection actions
  const selectVideo = useCallback((videoId: string) => {
    setLibraryState(prev => ({
      ...prev,
      selectedVideos: new Set([...prev.selectedVideos, videoId]),
    }));
  }, []);

  const deselectVideo = useCallback((videoId: string) => {
    setLibraryState(prev => {
      const newSelection = new Set(prev.selectedVideos);
      newSelection.delete(videoId);
      return {
        ...prev,
        selectedVideos: newSelection,
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setLibraryState(prev => ({
      ...prev,
      selectedVideos: new Set(filteredVideos.map(v => v.id)),
    }));
  }, [filteredVideos]);

  const deselectAll = useCallback(() => {
    setLibraryState(prev => ({
      ...prev,
      selectedVideos: new Set(),
    }));
  }, []);

  const toggleSelection = useCallback((videoId: string) => {
    setLibraryState(prev => {
      const newSelection = new Set(prev.selectedVideos);
      if (newSelection.has(videoId)) {
        newSelection.delete(videoId);
      } else {
        newSelection.add(videoId);
      }
      return {
        ...prev,
        selectedVideos: newSelection,
      };
    });
  }, []);

  const setSelectionMode = useCallback((enabled: boolean) => {
    setLibraryState(prev => ({
      ...prev,
      isSelectionMode: enabled,
      selectedVideos: enabled ? prev.selectedVideos : new Set(),
    }));
  }, []);

  // Filtering and sorting actions
  const updateFilter = useCallback((filter: Partial<VideoFilter>) => {
    setLibraryState(prev => ({
      ...prev,
      filter: { ...prev.filter, ...filter },
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }));
  }, []);

  const updateSort = useCallback((sort: VideoSortOptions) => {
    setLibraryState(prev => ({
      ...prev,
      sort,
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setLibraryState(prev => ({
      ...prev,
      filter: DEFAULT_FILTER,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  // Pagination actions
  const goToPage = useCallback((page: number) => {
    setLibraryState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  }, []);

  const nextPage = useCallback(() => {
    if (libraryResponse?.pagination.hasNextPage) {
      goToPage(libraryState.pagination.page + 1);
    }
  }, [libraryResponse?.pagination.hasNextPage, libraryState.pagination.page, goToPage]);

  const previousPage = useCallback(() => {
    if (libraryResponse?.pagination.hasPreviousPage) {
      goToPage(libraryState.pagination.page - 1);
    }
  }, [libraryResponse?.pagination.hasPreviousPage, libraryState.pagination.page, goToPage]);

  // View mode
  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setLibraryState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  // Search
  const searchVideos = useCallback((query: string) => {
    updateFilter({ searchQuery: query });
  }, [updateFilter]);

  // Bulk operations
  const exportSelected = useCallback(async () => {
    const selectedIds = Array.from(libraryState.selectedVideos);
    if (selectedIds.length === 0) {
      toast.error('No videos selected');
      return;
    }

    toast.loading('Preparing export...', { id: 'bulk-export' });
    
    try {
      // In a real implementation, this would create export jobs
      for (const videoId of selectedIds) {
        await videoProcessor.createExportJob(videoId, {
          format: 'mp4',
          quality: 'high',
          includeMetadata: true,
          includeThumbnails: false,
        });
      }
      
      toast.success(`Export started for ${selectedIds.length} videos`, { id: 'bulk-export' });
    } catch (error) {
      toast.error('Failed to start export', { id: 'bulk-export' });
    }
  }, [libraryState.selectedVideos]);

  const downloadSelected = useCallback(async () => {
    const selectedIds = Array.from(libraryState.selectedVideos);
    if (selectedIds.length === 0) {
      toast.error('No videos selected');
      return;
    }

    toast.success(`Starting download for ${selectedIds.length} videos`);
    
    // Download each video
    for (const videoId of selectedIds) {
      const video = videos.find(v => v.id === videoId);
      if (video?.videoUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = video.videoUrl;
        link.download = `${video.title}.mp4`;
        link.click();
      }
    }
  }, [libraryState.selectedVideos, videos]);

  return {
    // Data
    videos,
    stats,
    filteredVideos,
    
    // State
    libraryState,
    isLoading,
    error,
    
    // Actions
    refreshLibrary,
    updateVideo,
    deleteVideo,
    deleteVideos,
    toggleFavorite,
    
    // Selection
    selectVideo,
    deselectVideo,
    selectAll,
    deselectAll,
    toggleSelection,
    setSelectionMode,
    
    // Filtering and sorting
    updateFilter,
    updateSort,
    clearFilters,
    
    // Pagination
    goToPage,
    nextPage,
    previousPage,
    
    // View modes
    setViewMode,
    
    // Bulk operations
    exportSelected,
    downloadSelected,
    
    // Search
    searchVideos,
  };
}

// Helper functions (these would be actual API calls in a real implementation)
async function fetchUserVideos(userId: string, state: LibraryState): Promise<Video[]> {
  // Mock implementation - replace with actual API call
  return [];
}

async function getTotalVideoCount(userId: string, filter: VideoFilter): Promise<number> {
  // Mock implementation - replace with actual API call
  return 0;
}

async function getGenerationStats(userId: string): Promise<GenerationStats> {
  // Mock implementation - replace with actual API call
  return {
    totalVideos: 0,
    completedVideos: 0,
    failedVideos: 0,
    processingVideos: 0,
    queuedVideos: 0,
    totalCreditsUsed: 0,
    averageGenerationTime: 0,
    successRate: 0,
    mostUsedSettings: {},
    dailyUsage: [],
  };
}