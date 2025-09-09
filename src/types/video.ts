// Video Generation Type Definitions for Kateriss AI Video Generator
// Comprehensive types for Veo 3 Fast API integration and video management

// Base video generation types
export type VideoResolution = '480p' | '720p' | '1080p';
export type VideoDuration = 5 | 10 | 30;
export type VideoQuality = 'fast' | 'balanced' | 'high';
export type VideoFormat = 'mp4' | 'webm';
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type GenerationStage = 'queued' | 'initializing' | 'generating' | 'processing' | 'finalizing' | 'uploading';

// Veo 3 Fast API request types
export interface VeoGenerationRequest {
  prompt: string;
  duration: VideoDuration;
  resolution: VideoResolution;
  quality: VideoQuality;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  seed?: number;
  guidanceScale?: number;
  negativePrompt?: string;
  enhancePrompt?: boolean;
}

// Veo 3 Fast API response types
export interface VeoGenerationResponse {
  id: string;
  status: VideoStatus;
  progress: number;
  estimatedTimeRemaining?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  metadata?: VeoVideoMetadata;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface VeoVideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  format: VideoFormat;
  fileSize: number;
  bitrate: number;
  codec: string;
  generatedAt: string;
  processingTime: number;
}

// Video generation settings
export interface VideoGenerationSettings {
  resolution: VideoResolution;
  duration: VideoDuration;
  quality: VideoQuality;
  format: VideoFormat;
  aspectRatio: '16:9' | '9:16' | '1:1';
  enhancePrompt: boolean;
  seed?: number;
  guidanceScale: number;
  negativePrompt: string;
  enableUpscaling: boolean;
  enableStabilization: boolean;
}

// Default settings
export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  resolution: '720p',
  duration: 10,
  quality: 'balanced',
  format: 'mp4',
  aspectRatio: '16:9',
  enhancePrompt: true,
  guidanceScale: 7.5,
  negativePrompt: '',
  enableUpscaling: false,
  enableStabilization: true,
};

// Video entity types
export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  prompt: string;
  enhancedPrompt?: string;
  settings: VideoGenerationSettings;
  status: VideoStatus;
  stage: GenerationStage;
  progress: number;
  estimatedTimeRemaining?: number;
  
  // File URLs
  videoUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  
  // Metadata
  metadata?: VeoVideoMetadata;
  
  // Generation info
  veoJobId?: string;
  costCredits: number;
  generationTime?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Error handling
  error?: VideoGenerationError;
  retryCount: number;
  maxRetries: number;
  
  // User interaction
  isFavorite: boolean;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  
  // Tags and categorization
  tags: string[];
  category?: string;
}

// Video generation error types
export interface VideoGenerationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  retryable: boolean;
  suggestedAction?: string;
}

// Common error codes
export enum VideoErrorCode {
  INVALID_PROMPT = 'INVALID_PROMPT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  TIMEOUT = 'TIMEOUT',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
}

// Queue management types
export interface GenerationQueue {
  id: string;
  userId: string;
  videos: QueuedVideo[];
  status: 'idle' | 'processing' | 'paused';
  currentVideoId?: string;
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  estimatedTimeRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedVideo {
  id: string;
  position: number;
  priority: 'low' | 'normal' | 'high';
  addedAt: string;
  startedAt?: string;
  video: Omit<Video, 'id'> & { tempId: string };
}

// Generation statistics
export interface GenerationStats {
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  processingVideos: number;
  queuedVideos: number;
  totalCreditsUsed: number;
  averageGenerationTime: number;
  successRate: number;
  mostUsedSettings: Partial<VideoGenerationSettings>;
  dailyUsage: Array<{
    date: string;
    videosGenerated: number;
    creditsUsed: number;
  }>;
}

// Video library and filtering
export interface VideoFilter {
  status?: VideoStatus[];
  resolution?: VideoResolution[];
  duration?: VideoDuration[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  isFavorite?: boolean;
  isPublic?: boolean;
  searchQuery?: string;
}

export interface VideoSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'viewCount' | 'downloadCount' | 'generationTime';
  direction: 'asc' | 'desc';
}

export interface VideoPaginationOptions {
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface VideoLibraryResponse {
  videos: Video[];
  pagination: VideoPaginationOptions;
  stats: GenerationStats;
}

// Thumbnail generation
export interface VideoThumbnail {
  id: string;
  videoId: string;
  url: string;
  timestamp: number; // seconds
  width: number;
  height: number;
  format: 'jpg' | 'png' | 'webp';
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
}

// Download and export options
export interface VideoDownloadOptions {
  format: VideoFormat;
  quality: VideoQuality;
  includeMetadata: boolean;
  includeThumbnails: boolean;
  compressionLevel?: number;
}

export interface VideoExportJob {
  id: string;
  videoId: string;
  options: VideoDownloadOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Prompt enhancement
export interface PromptSuggestion {
  id: string;
  text: string;
  category: 'style' | 'mood' | 'technical' | 'content' | 'quality';
  description: string;
  example?: string;
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  improvements: Array<{
    type: string;
    description: string;
    added: string;
  }>;
  confidence: number;
}

// Usage tracking and limits
export interface UserUsage {
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  credits: {
    total: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  limits: {
    videosPerDay: number;
    videosPerMonth: number;
    maxDuration: VideoDuration;
    maxResolution: VideoResolution;
    concurrentGenerations: number;
  };
  usage: {
    today: number;
    thisMonth: number;
    totalGenerated: number;
  };
}

// Webhook types for async processing
export interface VeoWebhookPayload {
  jobId: string;
  status: VideoStatus;
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  metadata?: VeoVideoMetadata;
  error?: VideoGenerationError;
  timestamp: string;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Real-time update types
export interface VideoUpdateEvent {
  type: 'status_update' | 'progress_update' | 'completed' | 'failed';
  videoId: string;
  data: Partial<Video>;
  timestamp: string;
}

// Storage types
export interface StorageConfig {
  bucket: string;
  region: string;
  cdnUrl: string;
  maxFileSize: number;
  allowedFormats: string[];
  retentionDays: number;
}

export interface StorageUploadOptions {
  folder: string;
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  isPublic?: boolean;
}

// Cost calculation
export interface GenerationCost {
  baseCredits: number;
  resolutionMultiplier: number;
  durationMultiplier: number;
  qualityMultiplier: number;
  totalCredits: number;
  usdCost: number;
}

// Batch operations
export interface BatchOperation {
  id: string;
  type: 'generate' | 'delete' | 'export' | 'update';
  videoIds: string[];
  options?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  results: Array<{
    videoId: string;
    success: boolean;
    error?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Type guards
export const isVideoProcessing = (status: VideoStatus): boolean => {
  return ['pending', 'processing'].includes(status);
};

export const isVideoCompleted = (status: VideoStatus): boolean => {
  return status === 'completed';
};

export const isVideoFailed = (status: VideoStatus): boolean => {
  return ['failed', 'cancelled'].includes(status);
};

export const canRetryGeneration = (video: Video): boolean => {
  return isVideoFailed(video.status) && 
         video.retryCount < video.maxRetries && 
         (!video.error || video.error.retryable);
};

// Utility types
export type VideoWithoutId = Omit<Video, 'id'>;
export type VideoUpdate = Partial<Pick<Video, 
  | 'title' 
  | 'description' 
  | 'tags' 
  | 'category' 
  | 'isFavorite' 
  | 'isPublic'
>>;

export type CreateVideoRequest = Pick<Video,
  | 'title'
  | 'description'
  | 'prompt'
  | 'settings'
> & {
  tags?: string[];
  category?: string;
};