// Video Generation Hook for Kateriss AI Video Generator
// Manages video generation state, progress, and user interactions

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Video,
  VideoStatus,
  CreateVideoRequest,
  VideoGenerationSettings,
  DEFAULT_VIDEO_SETTINGS,
  GenerationCost,
  EnhancedPrompt,
  VideoGenerationError,
  VideoErrorCode,
  canRetryGeneration,
} from '../types/video';
import { veoAPI } from '../services/veoAPI';
import { queueService } from '../services/queue';
import { videoProcessor } from '../services/videoProcessor';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

// Hook configuration
interface UseVideoGenerationConfig {
  autoStartGeneration?: boolean;
  enableRealTimeUpdates?: boolean;
  maxRetries?: number;
  pollingInterval?: number;
}

// Generation state
interface GenerationState {
  isGenerating: boolean;
  currentVideo: Video | null;
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
  error?: VideoGenerationError;
  canCancel: boolean;
}

// Hook return type
interface UseVideoGenerationReturn {
  // State
  generationState: GenerationState;
  settings: VideoGenerationSettings;
  isSettingsValid: boolean;
  
  // Actions
  updateSettings: (settings: Partial<VideoGenerationSettings>) => void;
  resetSettings: () => void;
  generateVideo: (request: CreateVideoRequest) => Promise<void>;
  cancelGeneration: () => Promise<void>;
  retryGeneration: () => Promise<void>;
  
  // Utilities
  calculateCost: (settings?: Partial<VideoGenerationSettings>) => GenerationCost;
  enhancePrompt: (prompt: string) => Promise<string>;
  validateSettings: (settings: VideoGenerationSettings) => string[];
  
  // Real-time updates
  refreshStatus: () => void;
  isLoading: boolean;
  error: Error | null;
}

export function useVideoGeneration(config: UseVideoGenerationConfig = {}): UseVideoGenerationReturn {
  const { user } = useAuth();
  const { subscription, hasActiveSubscription, canGenerateVideo } = useSubscription();
  const queryClient = useQueryClient();
  
  // Configuration
  const {
    autoStartGeneration = false,
    enableRealTimeUpdates = true,
    maxRetries = 3,
    pollingInterval = 3000, // 3 seconds
  } = config;

  // State
  const [settings, setSettings] = useState<VideoGenerationSettings>(DEFAULT_VIDEO_SETTINGS);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    currentVideo: null,
    progress: 0,
    stage: 'idle',
    canCancel: false,
  });

  // Refs for cleanup
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  // Query for current generation status
  const {
    data: currentGeneration,
    isLoading,
    error,
    refetch: refreshStatus,
  } = useQuery({
    queryKey: ['videoGeneration', user?.id],
    queryFn: async () => {
      if (!user?.id || !generationState.currentVideo?.veoJobId) {
        return null;
      }
      
      const response = await veoAPI.checkGenerationStatus(generationState.currentVideo.veoJobId);
      return response.success ? response.data : null;
    },
    enabled: !!user?.id && !!generationState.currentVideo?.veoJobId && generationState.isGenerating,
    refetchInterval: enableRealTimeUpdates ? pollingInterval : false,
    refetchIntervalInBackground: false,
  });

  // Update generation state when query data changes
  useEffect(() => {
    if (!currentGeneration || !generationState.currentVideo) return;

    const updatedState: Partial<GenerationState> = {
      progress: currentGeneration.progress || 0,
      estimatedTimeRemaining: currentGeneration.estimatedTimeRemaining,
    };

    // Handle status changes
    switch (currentGeneration.status) {
      case 'completed':
        updatedState.isGenerating = false;
        updatedState.stage = 'completed';
        updatedState.canCancel = false;
        
        // Update video with results
        if (generationState.currentVideo) {
          generationState.currentVideo.status = 'completed';
          generationState.currentVideo.videoUrl = currentGeneration.videoUrl;
          generationState.currentVideo.thumbnailUrl = currentGeneration.thumbnailUrl;
          generationState.currentVideo.metadata = currentGeneration.metadata;
          generationState.currentVideo.completedAt = new Date().toISOString();
        }
        
        toast.success('Video generation completed! 🎉');
        break;

      case 'failed':
        updatedState.isGenerating = false;
        updatedState.stage = 'failed';
        updatedState.error = currentGeneration.error;
        updatedState.canCancel = false;
        
        if (generationState.currentVideo) {
          generationState.currentVideo.status = 'failed';
          generationState.currentVideo.error = currentGeneration.error;
        }
        
        toast.error('Video generation failed');
        break;

      case 'processing':
        updatedState.stage = 'processing';
        updatedState.canCancel = true;
        break;

      default:
        updatedState.stage = currentGeneration.status || 'processing';
        updatedState.canCancel = true;
    }

    setGenerationState(prev => ({ ...prev, ...updatedState }));
  }, [currentGeneration, generationState.currentVideo]);

  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (request: CreateVideoRequest) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check subscription status
      if (!hasActiveSubscription && !canGenerateVideo) {
        throw new Error('Active subscription required. Please upgrade your plan to generate videos.');
      }

      // Validate settings
      const validationErrors = validateSettings(request.settings);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid settings: ${validationErrors.join(', ')}`);
      }

      // Calculate cost
      const cost = calculateCost(request.settings);
      
      // Create video object
      const video: Omit<Video, 'id'> = {
        userId: user.id,
        title: request.title,
        description: request.description,
        prompt: request.prompt,
        settings: request.settings,
        status: 'pending',
        stage: 'queued',
        progress: 0,
        costCredits: cost.totalCredits,
        retryCount: 0,
        maxRetries,
        isFavorite: false,
        isPublic: false,
        downloadCount: 0,
        viewCount: 0,
        tags: request.tags || [],
        category: request.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to queue
      const queueResult = await queueService.addToQueue(user.id, request, 'normal');
      if (!queueResult.success || !queueResult.data) {
        throw new Error(queueResult.error?.message || 'Failed to add to queue');
      }

      return queueResult.data.video;
    },
    onMutate: (request) => {
      // Optimistic update
      const tempVideo: Video = {
        id: `temp_${Date.now()}`,
        userId: user?.id || '',
        title: request.title,
        description: request.description,
        prompt: request.prompt,
        settings: request.settings,
        status: 'pending',
        stage: 'initializing',
        progress: 0,
        costCredits: calculateCost(request.settings).totalCredits,
        retryCount: 0,
        maxRetries,
        isFavorite: false,
        isPublic: false,
        downloadCount: 0,
        viewCount: 0,
        tags: request.tags || [],
        category: request.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setGenerationState({
        isGenerating: true,
        currentVideo: tempVideo,
        progress: 0,
        stage: 'initializing',
        canCancel: false,
      });

      toast.loading('Starting video generation...', { id: 'generation-start' });
    },
    onSuccess: (video) => {
      setGenerationState(prev => ({
        ...prev,
        currentVideo: video as Video,
        stage: 'queued',
        canCancel: true,
      }));
      
      toast.success('Video added to generation queue', { id: 'generation-start' });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['videoGeneration'] });
      queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['generationQueue'] });
    },
    onError: (error: Error) => {
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        error: {
          code: VideoErrorCode.API_ERROR,
          message: error.message,
          timestamp: new Date().toISOString(),
          retryable: true,
        },
      }));
      
      toast.error(`Generation failed: ${error.message}`, { id: 'generation-start' });
    },
  });

  // Cancel generation mutation
  const cancelGenerationMutation = useMutation({
    mutationFn: async () => {
      if (!generationState.currentVideo?.veoJobId || !user?.id) {
        throw new Error('No active generation to cancel');
      }

      const response = await veoAPI.cancelGeneration(generationState.currentVideo.veoJobId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to cancel generation');
      }

      // Remove from queue
      await queueService.removeFromQueue(user.id, generationState.currentVideo.id);
    },
    onMutate: () => {
      toast.loading('Cancelling generation...', { id: 'generation-cancel' });
    },
    onSuccess: () => {
      setGenerationState({
        isGenerating: false,
        currentVideo: null,
        progress: 0,
        stage: 'cancelled',
        canCancel: false,
      });
      
      toast.success('Generation cancelled', { id: 'generation-cancel' });
      queryClient.invalidateQueries({ queryKey: ['videoGeneration'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel: ${error.message}`, { id: 'generation-cancel' });
    },
  });

  // Enhance prompt mutation
  const enhancePromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await veoAPI.enhancePrompt(prompt);
      return response;
    },
  });

  // Actions
  const updateSettings = useCallback((newSettings: Partial<VideoGenerationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_VIDEO_SETTINGS);
  }, []);

  const generateVideo = useCallback(async (request: CreateVideoRequest) => {
    if (generationState.isGenerating) {
      toast.error('Generation already in progress');
      return;
    }

    await generateVideoMutation.mutateAsync(request);
  }, [generateVideoMutation, generationState.isGenerating]);

  const cancelGeneration = useCallback(async () => {
    if (!generationState.canCancel) {
      toast.error('Cannot cancel generation at this time');
      return;
    }

    await cancelGenerationMutation.mutateAsync();
  }, [cancelGenerationMutation, generationState.canCancel]);

  const retryGeneration = useCallback(async () => {
    if (!generationState.currentVideo || !canRetryGeneration(generationState.currentVideo)) {
      toast.error('Cannot retry this generation');
      return;
    }

    const request: CreateVideoRequest = {
      title: generationState.currentVideo.title,
      description: generationState.currentVideo.description,
      prompt: generationState.currentVideo.prompt,
      settings: generationState.currentVideo.settings,
      tags: generationState.currentVideo.tags,
      category: generationState.currentVideo.category,
    };

    await generateVideo(request);
  }, [generationState.currentVideo, generateVideo]);

  // Utilities
  const calculateCost = useCallback((settingsOverride?: Partial<VideoGenerationSettings>): GenerationCost => {
    const finalSettings = { ...settings, ...settingsOverride };
    
    return veoAPI.calculateCost({
      prompt: '', // Not needed for cost calculation
      duration: finalSettings.duration,
      resolution: finalSettings.resolution,
      quality: finalSettings.quality,
    });
  }, [settings]);

  const enhancePrompt = useCallback(async (prompt: string): Promise<string> => {
    try {
      const enhanced = await enhancePromptMutation.mutateAsync(prompt);
      return enhanced;
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
      return prompt; // Return original on failure
    }
  }, [enhancePromptMutation]);

  const validateSettings = useCallback((settingsToValidate: VideoGenerationSettings): string[] => {
    const errors: string[] = [];

    if (!settingsToValidate.resolution) {
      errors.push('Resolution is required');
    }

    if (!settingsToValidate.duration || settingsToValidate.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (settingsToValidate.duration > 30) {
      errors.push('Duration cannot exceed 30 seconds');
    }

    if (!settingsToValidate.quality) {
      errors.push('Quality is required');
    }

    if (settingsToValidate.guidanceScale < 1 || settingsToValidate.guidanceScale > 20) {
      errors.push('Guidance scale must be between 1 and 20');
    }

    return errors;
  }, []);

  const isSettingsValid = validateSettings(settings).length === 0;

  return {
    // State
    generationState,
    settings,
    isSettingsValid,
    
    // Actions
    updateSettings,
    resetSettings,
    generateVideo,
    cancelGeneration,
    retryGeneration,
    
    // Utilities
    calculateCost,
    enhancePrompt,
    validateSettings,
    
    // Query state
    refreshStatus,
    isLoading,
    error,
  };
}