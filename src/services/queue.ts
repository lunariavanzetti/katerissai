// Generation Queue Management Service for Kateriss AI Video Generator
// Handles video generation queue, priority management, and concurrent processing

import { 
  GenerationQueue, 
  QueuedVideo, 
  Video, 
  VideoStatus,
  CreateVideoRequest,
  ApiResponse,
  VideoGenerationError,
  VideoErrorCode,
} from '../types/video';
import { veoAPI } from './veoAPI';
import { storageService } from './storage';

// Queue configuration
interface QueueConfig {
  maxConcurrentGenerations: number;
  maxQueueSize: number;
  retryAttempts: number;
  retryDelay: number;
  priorityWeights: Record<'low' | 'normal' | 'high', number>;
  autoStart: boolean;
  processInterval: number; // ms
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrentGenerations: 3,
  maxQueueSize: 50,
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
  priorityWeights: {
    'low': 1,
    'normal': 5,
    'high': 10,
  },
  autoStart: true,
  processInterval: 2000, // 2 seconds
};

// Queue events
type QueueEvent = 
  | 'video_added'
  | 'video_started' 
  | 'video_progress'
  | 'video_completed'
  | 'video_failed'
  | 'video_cancelled'
  | 'queue_started'
  | 'queue_paused'
  | 'queue_empty';

interface QueueEventData {
  event: QueueEvent;
  videoId?: string;
  queueId?: string;
  data?: any;
  timestamp: string;
}

type QueueEventListener = (eventData: QueueEventData) => void;

// Processing state
interface ProcessingState {
  isProcessing: boolean;
  currentJobs: Map<string, { videoId: string; startedAt: Date; progress: number }>;
  lastProcessedAt?: Date;
  intervalId?: NodeJS.Timeout;
}

class QueueService {
  private config: QueueConfig;
  private queues: Map<string, GenerationQueue>;
  private processingState: ProcessingState;
  private eventListeners: Map<QueueEvent, QueueEventListener[]>;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queues = new Map();
    this.processingState = {
      isProcessing: false,
      currentJobs: new Map(),
    };
    this.eventListeners = new Map();

    if (this.config.autoStart) {
      this.startProcessing();
    }
  }

  // Event management
  public addEventListener(event: QueueEvent, listener: QueueEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public removeEventListener(event: QueueEvent, listener: QueueEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: QueueEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const eventData: QueueEventData = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };
      
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Error in queue event listener for ${event}:`, error);
        }
      });
    }
  }

  // Create or get user queue
  public async getUserQueue(userId: string): Promise<GenerationQueue> {
    let queue = this.queues.get(userId);
    
    if (!queue) {
      queue = {
        id: `queue_${userId}`,
        userId,
        videos: [],
        status: 'idle',
        totalVideos: 0,
        completedVideos: 0,
        failedVideos: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.queues.set(userId, queue);
      console.log(`📋 Created new queue for user ${userId}`);
    }
    
    return queue;
  }

  // Add video to queue
  public async addToQueue(
    userId: string,
    videoRequest: CreateVideoRequest,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<ApiResponse<QueuedVideo>> {
    try {
      const queue = await this.getUserQueue(userId);
      
      // Check queue size limit
      if (queue.videos.length >= this.config.maxQueueSize) {
        throw new Error(`Queue is full. Maximum ${this.config.maxQueueSize} videos allowed.`);
      }

      // Calculate cost
      const cost = veoAPI.calculateCost({
        prompt: videoRequest.prompt,
        duration: videoRequest.settings.duration,
        resolution: videoRequest.settings.resolution,
        quality: videoRequest.settings.quality,
      });

      // Create queued video
      const queuedVideo: QueuedVideo = {
        id: this.generateVideoId(),
        position: queue.videos.length,
        priority,
        addedAt: new Date().toISOString(),
        video: {
          tempId: this.generateTempId(),
          userId,
          title: videoRequest.title,
          description: videoRequest.description,
          prompt: videoRequest.prompt,
          settings: videoRequest.settings,
          status: 'pending' as VideoStatus,
          stage: 'queued',
          progress: 0,
          costCredits: cost.totalCredits,
          retryCount: 0,
          maxRetries: this.config.retryAttempts,
          isFavorite: false,
          isPublic: false,
          downloadCount: 0,
          viewCount: 0,
          tags: videoRequest.tags || [],
          category: videoRequest.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      // Add to queue
      queue.videos.push(queuedVideo);
      queue.totalVideos++;
      queue.updatedAt = new Date().toISOString();

      // Sort queue by priority
      this.sortQueue(queue);

      console.log(`➕ Added video "${videoRequest.title}" to queue (priority: ${priority})`);
      this.emitEvent('video_added', { videoId: queuedVideo.id, priority });

      return {
        success: true,
        data: queuedVideo,
        metadata: {
          requestId: queuedVideo.id,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Failed to add video to queue:', error);

      return {
        success: false,
        error: {
          code: 'QUEUE_ADD_FAILED',
          message: error.message,
          details: { userId, videoRequest, priority },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Remove video from queue
  public async removeFromQueue(userId: string, videoId: string): Promise<ApiResponse<boolean>> {
    try {
      const queue = await this.getUserQueue(userId);
      const videoIndex = queue.videos.findIndex(v => v.id === videoId);
      
      if (videoIndex === -1) {
        throw new Error('Video not found in queue');
      }

      const queuedVideo = queue.videos[videoIndex];
      
      // Check if video is currently processing
      if (this.processingState.currentJobs.has(videoId)) {
        // Cancel the generation if possible
        if (queuedVideo.video.veoJobId) {
          await veoAPI.cancelGeneration(queuedVideo.video.veoJobId);
        }
        this.processingState.currentJobs.delete(videoId);
      }

      // Remove from queue
      queue.videos.splice(videoIndex, 1);
      queue.updatedAt = new Date().toISOString();

      // Update positions
      this.updatePositions(queue);

      console.log(`➖ Removed video ${videoId} from queue`);
      this.emitEvent('video_cancelled', { videoId });

      return {
        success: true,
        data: true,
        metadata: {
          requestId: videoId,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Failed to remove video from queue:', error);

      return {
        success: false,
        error: {
          code: 'QUEUE_REMOVE_FAILED',
          message: error.message,
          details: { userId, videoId },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Get queue status
  public async getQueueStatus(userId: string): Promise<ApiResponse<GenerationQueue>> {
    try {
      const queue = await this.getUserQueue(userId);
      
      // Update estimated time remaining
      queue.estimatedTimeRemaining = this.calculateEstimatedTime(queue);
      
      return {
        success: true,
        data: { ...queue }, // Return copy to prevent mutations
        metadata: {
          requestId: queue.id,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Failed to get queue status:', error);

      return {
        success: false,
        error: {
          code: 'QUEUE_STATUS_FAILED',
          message: error.message,
          details: { userId },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Start queue processing
  public startProcessing(): void {
    if (this.processingState.isProcessing) {
      console.warn('Queue processing is already running');
      return;
    }

    this.processingState.isProcessing = true;
    this.processingState.intervalId = setInterval(
      () => this.processQueues(),
      this.config.processInterval
    );

    console.log('🚀 Started queue processing');
    this.emitEvent('queue_started');
  }

  // Stop queue processing
  public stopProcessing(): void {
    if (!this.processingState.isProcessing) {
      return;
    }

    this.processingState.isProcessing = false;
    
    if (this.processingState.intervalId) {
      clearInterval(this.processingState.intervalId);
      this.processingState.intervalId = undefined;
    }

    console.log('⏹️ Stopped queue processing');
    this.emitEvent('queue_paused');
  }

  // Process all queues
  private async processQueues(): Promise<void> {
    if (this.processingState.currentJobs.size >= this.config.maxConcurrentGenerations) {
      return; // At capacity
    }

    // Check for completed jobs
    await this.checkCompletedJobs();

    // Find next video to process
    const nextVideo = this.getNextVideoToProcess();
    if (!nextVideo) {
      return; // No videos to process
    }

    // Start processing the video
    await this.startVideoGeneration(nextVideo);
  }

  // Get next video to process based on priority
  private getNextVideoToProcess(): QueuedVideo | null {
    let bestVideo: QueuedVideo | null = null;
    let bestScore = -1;

    for (const queue of this.queues.values()) {
      for (const queuedVideo of queue.videos) {
        if (queuedVideo.video.status === 'pending' && 
            !this.processingState.currentJobs.has(queuedVideo.id)) {
          
          const score = this.calculatePriorityScore(queuedVideo);
          if (score > bestScore) {
            bestScore = score;
            bestVideo = queuedVideo;
          }
        }
      }
    }

    return bestVideo;
  }

  // Calculate priority score for video
  private calculatePriorityScore(queuedVideo: QueuedVideo): number {
    const priorityWeight = this.config.priorityWeights[queuedVideo.priority];
    const timeWeight = Math.max(0, 100 - queuedVideo.position); // Earlier = higher score
    const ageWeight = (Date.now() - new Date(queuedVideo.addedAt).getTime()) / 1000 / 60; // Minutes
    
    return priorityWeight * 100 + timeWeight + ageWeight;
  }

  // Start video generation
  private async startVideoGeneration(queuedVideo: QueuedVideo): Promise<void> {
    try {
      console.log(`🎬 Starting generation for video: ${queuedVideo.video.title}`);

      // Update video status
      queuedVideo.video.status = 'processing';
      queuedVideo.video.stage = 'initializing';
      queuedVideo.video.updatedAt = new Date().toISOString();
      queuedVideo.startedAt = new Date().toISOString();

      // Add to current jobs
      this.processingState.currentJobs.set(queuedVideo.id, {
        videoId: queuedVideo.id,
        startedAt: new Date(),
        progress: 0,
      });

      // Start generation via Veo API
      const generationRequest = {
        prompt: queuedVideo.video.prompt,
        duration: queuedVideo.video.settings.duration,
        resolution: queuedVideo.video.settings.resolution,
        quality: queuedVideo.video.settings.quality,
        aspectRatio: queuedVideo.video.settings.aspectRatio,
        enhancePrompt: queuedVideo.video.settings.enhancePrompt,
        seed: queuedVideo.video.settings.seed,
        guidanceScale: queuedVideo.video.settings.guidanceScale,
        negativePrompt: queuedVideo.video.settings.negativePrompt,
      };

      const response = await veoAPI.generateVideo(generationRequest);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to start generation');
      }

      // Update video with job ID
      queuedVideo.video.veoJobId = response.data.id;
      queuedVideo.video.stage = 'generating';
      queuedVideo.video.estimatedTimeRemaining = response.data.estimatedTimeRemaining;
      queuedVideo.video.updatedAt = new Date().toISOString();

      this.emitEvent('video_started', { videoId: queuedVideo.id });

    } catch (error: any) {
      console.error(`Failed to start generation for ${queuedVideo.id}:`, error);
      
      // Update video with error
      queuedVideo.video.status = 'failed';
      queuedVideo.video.error = {
        code: VideoErrorCode.API_ERROR,
        message: error.message,
        timestamp: new Date().toISOString(),
        retryable: true,
      };

      // Remove from current jobs
      this.processingState.currentJobs.delete(queuedVideo.id);
      
      // Check if we should retry
      if (queuedVideo.video.retryCount < queuedVideo.video.maxRetries) {
        setTimeout(() => this.retryVideoGeneration(queuedVideo), this.config.retryDelay);
      } else {
        this.moveToCompleted(queuedVideo, false);
        this.emitEvent('video_failed', { videoId: queuedVideo.id, error });
      }
    }
  }

  // Check completed jobs
  private async checkCompletedJobs(): Promise<void> {
    for (const [videoId, job] of this.processingState.currentJobs.entries()) {
      const queuedVideo = this.findQueuedVideo(videoId);
      if (!queuedVideo || !queuedVideo.video.veoJobId) continue;

      try {
        // Check status with Veo API
        const statusResponse = await veoAPI.checkGenerationStatus(queuedVideo.video.veoJobId);
        
        if (!statusResponse.success || !statusResponse.data) {
          continue; // Skip this check
        }

        const status = statusResponse.data;
        
        // Update progress
        if (status.progress !== undefined) {
          queuedVideo.video.progress = status.progress;
          job.progress = status.progress;
          this.emitEvent('video_progress', { 
            videoId, 
            progress: status.progress 
          });
        }

        // Update estimated time
        if (status.estimatedTimeRemaining) {
          queuedVideo.video.estimatedTimeRemaining = status.estimatedTimeRemaining;
        }

        // Check if completed
        if (status.status === 'completed') {
          await this.handleVideoCompleted(queuedVideo, status);
        } else if (status.status === 'failed') {
          await this.handleVideoFailed(queuedVideo, status.error);
        }

      } catch (error) {
        console.error(`Error checking status for video ${videoId}:`, error);
      }
    }
  }

  // Handle video completion
  private async handleVideoCompleted(queuedVideo: QueuedVideo, status: any): Promise<void> {
    try {
      console.log(`✅ Video generation completed: ${queuedVideo.video.title}`);

      // Update video data
      queuedVideo.video.status = 'completed';
      queuedVideo.video.progress = 100;
      queuedVideo.video.videoUrl = status.videoUrl;
      queuedVideo.video.thumbnailUrl = status.thumbnailUrl;
      queuedVideo.video.metadata = status.metadata;
      queuedVideo.video.completedAt = new Date().toISOString();
      queuedVideo.video.updatedAt = new Date().toISOString();

      // Remove from current jobs
      this.processingState.currentJobs.delete(queuedVideo.id);

      // Move to completed
      this.moveToCompleted(queuedVideo, true);

      this.emitEvent('video_completed', { videoId: queuedVideo.id });

    } catch (error) {
      console.error('Error handling video completion:', error);
    }
  }

  // Handle video failure
  private async handleVideoFailed(queuedVideo: QueuedVideo, error?: any): Promise<void> {
    console.log(`❌ Video generation failed: ${queuedVideo.video.title}`);

    queuedVideo.video.status = 'failed';
    queuedVideo.video.error = error || {
      code: VideoErrorCode.PROCESSING_FAILED,
      message: 'Video generation failed',
      timestamp: new Date().toISOString(),
      retryable: true,
    };

    // Remove from current jobs
    this.processingState.currentJobs.delete(queuedVideo.id);

    // Check if we should retry
    if (queuedVideo.video.retryCount < queuedVideo.video.maxRetries && 
        queuedVideo.video.error.retryable) {
      setTimeout(() => this.retryVideoGeneration(queuedVideo), this.config.retryDelay);
    } else {
      this.moveToCompleted(queuedVideo, false);
      this.emitEvent('video_failed', { videoId: queuedVideo.id, error });
    }
  }

  // Retry video generation
  private async retryVideoGeneration(queuedVideo: QueuedVideo): Promise<void> {
    queuedVideo.video.retryCount++;
    queuedVideo.video.status = 'pending';
    queuedVideo.video.stage = 'queued';
    queuedVideo.video.progress = 0;
    queuedVideo.video.error = undefined;
    queuedVideo.video.updatedAt = new Date().toISOString();

    console.log(`🔄 Retrying video generation: ${queuedVideo.video.title} (attempt ${queuedVideo.video.retryCount})`);
  }

  // Move video to completed
  private moveToCompleted(queuedVideo: QueuedVideo, success: boolean): void {
    const queue = this.queues.get(queuedVideo.video.userId);
    if (!queue) return;

    // Remove from active videos
    const index = queue.videos.findIndex(v => v.id === queuedVideo.id);
    if (index > -1) {
      queue.videos.splice(index, 1);
    }

    // Update counters
    if (success) {
      queue.completedVideos++;
    } else {
      queue.failedVideos++;
    }

    queue.updatedAt = new Date().toISOString();

    // Update positions
    this.updatePositions(queue);
  }

  // Utility methods
  private sortQueue(queue: GenerationQueue): void {
    queue.videos.sort((a, b) => {
      // Sort by priority first, then by added time
      const priorityDiff = this.config.priorityWeights[b.priority] - this.config.priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });

    this.updatePositions(queue);
  }

  private updatePositions(queue: GenerationQueue): void {
    queue.videos.forEach((video, index) => {
      video.position = index;
    });
  }

  private calculateEstimatedTime(queue: GenerationQueue): number {
    let totalTime = 0;
    
    for (const queuedVideo of queue.videos) {
      if (queuedVideo.video.status === 'pending') {
        // Estimate based on settings
        const baseTime = 120; // 2 minutes base
        const durationMultiplier = queuedVideo.video.settings.duration / 10;
        const qualityMultiplier = queuedVideo.video.settings.quality === 'high' ? 1.5 : 1;
        
        totalTime += baseTime * durationMultiplier * qualityMultiplier;
      }
    }

    return Math.ceil(totalTime);
  }

  private findQueuedVideo(videoId: string): QueuedVideo | null {
    for (const queue of this.queues.values()) {
      for (const video of queue.videos) {
        if (video.id === videoId) {
          return video;
        }
      }
    }
    return null;
  }

  private generateVideoId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters
  public getProcessingStats() {
    return {
      isProcessing: this.processingState.isProcessing,
      currentJobs: this.processingState.currentJobs.size,
      maxConcurrent: this.config.maxConcurrentGenerations,
      totalQueues: this.queues.size,
      totalVideos: Array.from(this.queues.values()).reduce((sum, q) => sum + q.videos.length, 0),
    };
  }

  public getConfig(): QueueConfig {
    return { ...this.config };
  }

  // Cleanup
  public destroy(): void {
    this.stopProcessing();
    this.queues.clear();
    this.processingState.currentJobs.clear();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const queueService = new QueueService();

// Export class for testing
export { QueueService };

// Export types
export type { QueueConfig, QueueEvent, QueueEventData, QueueEventListener };