// Veo 3 Fast API Service via Gemini API for Kateriss AI Video Generator
// Handles all video generation requests through Google's Veo 3 Fast API

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { env } from '../config/env';
import {
  VeoGenerationRequest,
  VeoGenerationResponse,
  VideoStatus,
  VideoGenerationError,
  VideoErrorCode,
  VeoVideoMetadata,
  ApiResponse,
  VeoWebhookPayload,
  GenerationCost,
} from '../types/video';

// API Configuration
interface VeoAPIConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: VeoAPIConfig = {
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: env.gemini?.apiKey || '',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Rate limiting configuration
interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
}

const RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 10,
  requestsPerHour: 100,
  requestsPerDay: 1000,
  concurrentRequests: 3,
};

// Request tracking for rate limiting
interface RequestTracker {
  requests: number[];
  concurrent: number;
}

class VeoAPIService {
  private client: AxiosInstance;
  private config: VeoAPIConfig;
  private requestTracker: RequestTracker;

  constructor(config: Partial<VeoAPIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.requestTracker = {
      requests: [],
      concurrent: 0,
    };

    // Initialize Axios client
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'kateriss-ai-video-generator',
      },
    });

    // Setup request/response interceptors
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Check rate limits before making request
        await this.checkRateLimit();
        
        // Add API key to headers
        config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        
        // Add request tracking
        this.requestTracker.concurrent++;
        this.requestTracker.requests.push(Date.now());
        
        console.log(`🚀 Veo API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Veo API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.requestTracker.concurrent--;
        console.log(`✅ Veo API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        this.requestTracker.concurrent--;
        
        // Handle specific error cases
        if (error.response?.status === 429) {
          // Rate limit exceeded - implement exponential backoff
          const retryAfter = error.response.headers['retry-after'] || 60;
          console.warn(`⏳ Rate limit exceeded, retrying after ${retryAfter}s`);
          await this.delay(retryAfter * 1000);
          return this.client.request(error.config);
        }

        if (error.response?.status === 401) {
          console.error('🔒 API key invalid or expired');
          throw new Error('Invalid API key. Please check your Gemini API configuration.');
        }

        console.error('❌ Veo API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        return Promise.reject(error);
      }
    );
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    // Clean old requests
    this.requestTracker.requests = this.requestTracker.requests.filter(
      (timestamp) => now - timestamp < oneDay
    );

    // Check concurrent requests
    if (this.requestTracker.concurrent >= RATE_LIMITS.concurrentRequests) {
      console.warn('⏳ Concurrent request limit reached, waiting...');
      await this.delay(1000);
      return this.checkRateLimit();
    }

    // Check requests per minute
    const recentRequests = this.requestTracker.requests.filter(
      (timestamp) => now - timestamp < oneMinute
    );
    if (recentRequests.length >= RATE_LIMITS.requestsPerMinute) {
      const waitTime = oneMinute - (now - recentRequests[0]);
      console.warn(`⏳ Rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
      return this.checkRateLimit();
    }

    // Check requests per hour
    const hourlyRequests = this.requestTracker.requests.filter(
      (timestamp) => now - timestamp < oneHour
    );
    if (hourlyRequests.length >= RATE_LIMITS.requestsPerHour) {
      throw new Error('Hourly rate limit exceeded. Please try again later.');
    }

    // Check requests per day
    if (this.requestTracker.requests.length >= RATE_LIMITS.requestsPerDay) {
      throw new Error('Daily rate limit exceeded. Please try again tomorrow.');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempts: number = this.config.retryAttempts
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (attempts <= 0) {
        throw error;
      }

      // Check if error is retryable
      if (this.isRetryableError(error)) {
        const delay = this.config.retryDelay * (this.config.retryAttempts - attempts + 1);
        console.log(`🔄 Retrying in ${delay}ms (${attempts} attempts left)`);
        await this.delay(delay);
        return this.retryWithBackoff(operation, attempts - 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [429, 500, 502, 503, 504];
    const retryableMessages = ['timeout', 'network', 'connection'];
    
    return (
      retryableCodes.includes(error.response?.status) ||
      retryableMessages.some((msg) => error.message.toLowerCase().includes(msg))
    );
  }

  private mapAPIError(error: any): VideoGenerationError {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.error?.message || error.message;

    let code: VideoErrorCode;
    let suggestedAction: string | undefined;

    switch (status) {
      case 400:
        code = VideoErrorCode.INVALID_PROMPT;
        suggestedAction = 'Please check your prompt and generation settings';
        break;
      case 401:
        code = VideoErrorCode.API_ERROR;
        suggestedAction = 'Please check your API key configuration';
        break;
      case 403:
        code = VideoErrorCode.CONTENT_POLICY_VIOLATION;
        suggestedAction = 'Please modify your prompt to comply with content policies';
        break;
      case 429:
        code = VideoErrorCode.QUOTA_EXCEEDED;
        suggestedAction = 'Please wait before making more requests';
        break;
      case 408:
        code = VideoErrorCode.TIMEOUT;
        suggestedAction = 'Please try again with a shorter duration or lower quality';
        break;
      default:
        code = VideoErrorCode.API_ERROR;
        suggestedAction = 'Please try again later';
    }

    return {
      code,
      message,
      details: data,
      timestamp: new Date().toISOString(),
      retryable: this.isRetryableError(error),
      suggestedAction,
    };
  }

  // Calculate generation cost based on settings
  public calculateCost(request: VeoGenerationRequest): GenerationCost {
    const baseCredits = 10; // Base cost per video
    
    // Resolution multiplier
    const resolutionMultipliers = {
      '480p': 1.0,
      '720p': 1.5,
      '1080p': 2.0,
    };
    
    // Duration multiplier
    const durationMultipliers = {
      5: 1.0,
      10: 1.8,
      30: 4.0,
    };
    
    // Quality multiplier
    const qualityMultipliers = {
      'fast': 1.0,
      'balanced': 1.3,
      'high': 1.8,
    };

    const resolutionMultiplier = resolutionMultipliers[request.resolution];
    const durationMultiplier = durationMultipliers[request.duration];
    const qualityMultiplier = qualityMultipliers[request.quality];
    
    const totalCredits = Math.ceil(
      baseCredits * resolutionMultiplier * durationMultiplier * qualityMultiplier
    );

    return {
      baseCredits,
      resolutionMultiplier,
      durationMultiplier,
      qualityMultiplier,
      totalCredits,
      usdCost: totalCredits * 0.01, // $0.01 per credit
    };
  }

  // Enhance prompt using Gemini
  public async enhancePrompt(prompt: string): Promise<string> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return this.client.post('/models/gemini-pro:generateContent', {
          contents: [{
            parts: [{
              text: `Enhance this video generation prompt to be more detailed and visually descriptive while maintaining the original intent. Make it suitable for AI video generation. Original prompt: "${prompt}"`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          }
        });
      });

      const enhancedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      return enhancedText || prompt;
    } catch (error) {
      console.warn('Failed to enhance prompt:', error);
      return prompt; // Return original if enhancement fails
    }
  }

  // Start video generation
  public async generateVideo(request: VeoGenerationRequest): Promise<ApiResponse<VeoGenerationResponse>> {
    try {
      // Enhance prompt if requested
      let finalPrompt = request.prompt;
      if (request.enhancePrompt) {
        finalPrompt = await this.enhancePrompt(request.prompt);
      }

      const response = await this.retryWithBackoff(async () => {
        return this.client.post('/models/veo-3-fast:generateVideo', {
          prompt: finalPrompt,
          video_config: {
            duration_seconds: request.duration,
            resolution: request.resolution,
            quality: request.quality,
            aspect_ratio: request.aspectRatio || '16:9',
            fps: 30,
          },
          generation_config: {
            seed: request.seed,
            guidance_scale: request.guidanceScale || 7.5,
            negative_prompt: request.negativePrompt || '',
          },
          webhook_url: `${env.app.url}/api/webhooks/veo`,
        });
      });

      const jobId = response.data.job_id;
      const veoResponse: VeoGenerationResponse = {
        id: jobId,
        status: 'pending',
        progress: 0,
        estimatedTimeRemaining: this.estimateGenerationTime(request),
      };

      return {
        success: true,
        data: veoResponse,
        metadata: {
          requestId: response.headers['x-request-id'] || '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    } catch (error: any) {
      console.error('Failed to start video generation:', error);
      
      return {
        success: false,
        error: this.mapAPIError(error),
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    }
  }

  // Check generation status
  public async checkGenerationStatus(jobId: string): Promise<ApiResponse<VeoGenerationResponse>> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return this.client.get(`/models/veo-3-fast:getGenerationStatus/${jobId}`);
      });

      const data = response.data;
      const veoResponse: VeoGenerationResponse = {
        id: jobId,
        status: this.mapVeoStatus(data.status),
        progress: data.progress || 0,
        estimatedTimeRemaining: data.estimated_time_remaining,
        videoUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        metadata: data.metadata ? this.mapVideoMetadata(data.metadata) : undefined,
        error: data.error ? this.mapAPIError(data.error) : undefined,
      };

      return {
        success: true,
        data: veoResponse,
        metadata: {
          requestId: response.headers['x-request-id'] || '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    } catch (error: any) {
      console.error('Failed to check generation status:', error);
      
      return {
        success: false,
        error: this.mapAPIError(error),
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    }
  }

  // Cancel video generation
  public async cancelGeneration(jobId: string): Promise<ApiResponse<boolean>> {
    try {
      await this.retryWithBackoff(async () => {
        return this.client.delete(`/models/veo-3-fast:cancelGeneration/${jobId}`);
      });

      return {
        success: true,
        data: true,
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    } catch (error: any) {
      console.error('Failed to cancel generation:', error);
      
      return {
        success: false,
        error: this.mapAPIError(error),
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    }
  }

  // Get available models and capabilities
  public async getModelCapabilities(): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return this.client.get('/models/veo-3-fast');
      });

      return {
        success: true,
        data: response.data,
        metadata: {
          requestId: response.headers['x-request-id'] || '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    } catch (error: any) {
      console.error('Failed to get model capabilities:', error);
      
      return {
        success: false,
        error: this.mapAPIError(error),
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: 'veo-3-fast',
        },
      };
    }
  }

  // Utility methods
  private mapVeoStatus(veoStatus: string): VideoStatus {
    const statusMap: Record<string, VideoStatus> = {
      'queued': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
    };

    return statusMap[veoStatus] || 'pending';
  }

  private mapVideoMetadata(metadata: any): VeoVideoMetadata {
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      duration: metadata.duration || 0,
      fps: metadata.fps || 30,
      format: metadata.format || 'mp4',
      fileSize: metadata.file_size || 0,
      bitrate: metadata.bitrate || 0,
      codec: metadata.codec || 'h264',
      generatedAt: metadata.generated_at || new Date().toISOString(),
      processingTime: metadata.processing_time || 0,
    };
  }

  private estimateGenerationTime(request: VeoGenerationRequest): number {
    // Base time in seconds
    const baseTime = 60;
    
    // Adjust based on duration
    const durationMultiplier = request.duration / 10;
    
    // Adjust based on quality
    const qualityMultipliers = { 'fast': 1, 'balanced': 1.5, 'high': 2.5 };
    const qualityMultiplier = qualityMultipliers[request.quality];
    
    // Adjust based on resolution
    const resolutionMultipliers = { '480p': 1, '720p': 1.3, '1080p': 2 };
    const resolutionMultiplier = resolutionMultipliers[request.resolution];

    return Math.ceil(baseTime * durationMultiplier * qualityMultiplier * resolutionMultiplier);
  }

  // Process webhook payload
  public processWebhookPayload(payload: any): VeoWebhookPayload {
    return {
      jobId: payload.job_id,
      status: this.mapVeoStatus(payload.status),
      progress: payload.progress || 0,
      videoUrl: payload.video_url,
      thumbnailUrl: payload.thumbnail_url,
      metadata: payload.metadata ? this.mapVideoMetadata(payload.metadata) : undefined,
      error: payload.error ? this.mapAPIError(payload.error) : undefined,
      timestamp: payload.timestamp || new Date().toISOString(),
    };
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      console.error('Veo API health check failed:', error);
      return false;
    }
  }

  // Get current rate limit status
  public getRateLimitStatus() {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    const recentRequests = this.requestTracker.requests.filter(
      (timestamp) => now - timestamp < oneMinute
    );

    return {
      requestsInLastMinute: recentRequests.length,
      maxRequestsPerMinute: RATE_LIMITS.requestsPerMinute,
      currentConcurrent: this.requestTracker.concurrent,
      maxConcurrent: RATE_LIMITS.concurrentRequests,
      canMakeRequest: recentRequests.length < RATE_LIMITS.requestsPerMinute &&
                     this.requestTracker.concurrent < RATE_LIMITS.concurrentRequests,
    };
  }
}

// Export singleton instance
export const veoAPI = new VeoAPIService();

// Export class for testing
export { VeoAPIService };

// Export types
export type { VeoAPIConfig, RateLimitConfig };