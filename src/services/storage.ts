// Supabase Storage Service for Kateriss AI Video Generator
// Handles file uploads, downloads, and storage management for videos and thumbnails

import { supabase } from '../config/supabase';
import { 
  StorageConfig, 
  StorageUploadOptions, 
  ApiResponse,
  VideoFormat,
} from '../types/video';

// Storage configuration
const STORAGE_CONFIG: StorageConfig = {
  bucket: 'kateriss-videos',
  region: 'us-east-1',
  cdnUrl: 'https://cdn.kateriss.ai',
  maxFileSize: 200 * 1024 * 1024, // 200MB
  allowedFormats: ['mp4', 'webm', 'jpg', 'jpeg', 'png', 'webp'],
  retentionDays: 365, // 1 year
};

// Upload result interface
interface UploadResult {
  id: string;
  path: string;
  publicUrl: string;
  fullPath: string;
  metadata: {
    size: number;
    contentType: string;
    lastModified: string;
    etag: string;
  };
}

// File metadata interface
interface FileMetadata {
  name: string;
  size: number;
  contentType: string;
  lastModified: string;
  path: string;
  publicUrl: string;
  metadata?: Record<string, string>;
}

// Storage statistics
interface StorageStats {
  totalFiles: number;
  totalSize: number;
  videoFiles: number;
  videoSize: number;
  thumbnailFiles: number;
  thumbnailSize: number;
  usageByFormat: Record<string, { count: number; size: number }>;
}

class StorageService {
  private config: StorageConfig;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...STORAGE_CONFIG, ...config };
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists and create if necessary
      const { data, error } = await supabase.storage.getBucket(this.config.bucket);
      
      if (error && error.message.includes('not found')) {
        console.log(`📦 Creating storage bucket: ${this.config.bucket}`);
        
        const { error: createError } = await supabase.storage.createBucket(this.config.bucket, {
          public: true,
          allowedMimeTypes: this.getAllowedMimeTypes(),
          fileSizeLimit: this.config.maxFileSize,
        });

        if (createError) {
          console.error('Failed to create storage bucket:', createError);
        } else {
          console.log('✅ Storage bucket created successfully');
        }
      } else if (data) {
        console.log('📦 Storage bucket already exists');
      } else if (error) {
        console.error('Error checking storage bucket:', error);
      }
    } catch (error) {
      console.error('Failed to initialize storage bucket:', error);
    }
  }

  private getAllowedMimeTypes(): string[] {
    const mimeTypes: string[] = [];
    
    this.config.allowedFormats.forEach(format => {
      switch (format) {
        case 'mp4':
          mimeTypes.push('video/mp4');
          break;
        case 'webm':
          mimeTypes.push('video/webm');
          break;
        case 'jpg':
        case 'jpeg':
          mimeTypes.push('image/jpeg');
          break;
        case 'png':
          mimeTypes.push('image/png');
          break;
        case 'webp':
          mimeTypes.push('image/webp');
          break;
      }
    });

    return mimeTypes;
  }

  private validateFile(file: File | Blob, fileName: string): void {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      throw new Error(
        `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size ${this.formatFileSize(this.config.maxFileSize)}`
      );
    }

    // Check file format
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !this.config.allowedFormats.includes(extension)) {
      throw new Error(`File format .${extension} is not allowed. Supported formats: ${this.config.allowedFormats.join(', ')}`);
    }

    // Additional validation for specific file types
    if (file.type) {
      const allowedMimeTypes = this.getAllowedMimeTypes();
      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error(`MIME type ${file.type} is not allowed`);
      }
    }
  }

  private generateFileName(originalName: string, options: StorageUploadOptions): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 8);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
    
    // Sanitize filename
    const sanitizedBaseName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50); // Limit length

    return `${options.folder}/${sanitizedBaseName}_${timestamp}_${randomSuffix}.${extension}`;
  }

  // Upload file to storage
  public async uploadFile(
    file: File | Blob,
    fileName: string,
    contentType: string,
    options: StorageUploadOptions
  ): Promise<ApiResponse<UploadResult>> {
    try {
      console.log(`📤 Uploading file: ${fileName} (${this.formatFileSize(file.size)})`);

      // Create File object if Blob is provided
      const fileToUpload = file instanceof File ? file : new File([file], fileName, { type: contentType });

      // Validate file
      this.validateFile(fileToUpload, fileName);

      // Generate unique file path
      const filePath = this.generateFileName(fileName, options);

      // Prepare upload options
      const uploadOptions = {
        cacheControl: options.cacheControl || '3600', // 1 hour
        upsert: false,
        duplex: 'half' as RequestDuplex,
      };

      // Add metadata if provided
      if (options.metadata) {
        Object.assign(uploadOptions, {
          metadata: options.metadata,
        });
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.config.bucket)
        .upload(filePath, fileToUpload, uploadOptions);

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload completed but no data returned');
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.config.bucket)
        .getPublicUrl(filePath);

      const result: UploadResult = {
        id: data.id || filePath,
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
        fullPath: data.fullPath,
        metadata: {
          size: fileToUpload.size,
          contentType,
          lastModified: new Date().toISOString(),
          etag: data.id || '',
        },
      };

      console.log(`✅ File uploaded successfully: ${filePath}`);

      return {
        success: true,
        data: result,
        metadata: {
          requestId: data.id || '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('File upload failed:', error);

      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message,
          details: { fileName, fileSize: file.size, contentType },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Upload video file
  public async uploadVideo(
    file: File,
    videoId: string,
    format: VideoFormat,
    options: Partial<StorageUploadOptions> = {}
  ): Promise<ApiResponse<UploadResult>> {
    const fileName = `${videoId}.${format}`;
    const contentType = format === 'mp4' ? 'video/mp4' : 'video/webm';
    
    const uploadOptions: StorageUploadOptions = {
      folder: 'videos',
      fileName,
      contentType,
      isPublic: true,
      cacheControl: '86400', // 24 hours
      metadata: {
        videoId,
        format,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
      ...options,
    };

    return this.uploadFile(file, fileName, contentType, uploadOptions);
  }

  // Upload thumbnail file
  public async uploadThumbnail(
    file: File | Blob,
    videoId: string,
    timestamp: number,
    format: 'jpg' | 'png' | 'webp' = 'jpg',
    options: Partial<StorageUploadOptions> = {}
  ): Promise<ApiResponse<UploadResult>> {
    const fileName = `${videoId}_thumb_${timestamp}.${format}`;
    const contentType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    
    const uploadOptions: StorageUploadOptions = {
      folder: 'thumbnails',
      fileName,
      contentType,
      isPublic: true,
      cacheControl: '604800', // 1 week
      metadata: {
        videoId,
        timestamp: timestamp.toString(),
        format,
        uploadedAt: new Date().toISOString(),
      },
      ...options,
    };

    return this.uploadFile(file, fileName, contentType, uploadOptions);
  }

  // Download file
  public async downloadFile(filePath: string): Promise<ApiResponse<Blob>> {
    try {
      console.log(`📥 Downloading file: ${filePath}`);

      const { data, error } = await supabase.storage
        .from(this.config.bucket)
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Download completed but no data returned');
      }

      console.log(`✅ File downloaded successfully: ${filePath}`);

      return {
        success: true,
        data,
        metadata: {
          requestId: filePath,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('File download failed:', error);

      return {
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: error.message,
          details: { filePath },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Delete file
  public async deleteFile(filePath: string): Promise<ApiResponse<boolean>> {
    try {
      console.log(`🗑️ Deleting file: ${filePath}`);

      const { data, error } = await supabase.storage
        .from(this.config.bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      console.log(`✅ File deleted successfully: ${filePath}`);

      return {
        success: true,
        data: true,
        metadata: {
          requestId: filePath,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('File deletion failed:', error);

      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error.message,
          details: { filePath },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Delete multiple files
  public async deleteFiles(filePaths: string[]): Promise<ApiResponse<string[]>> {
    try {
      console.log(`🗑️ Deleting ${filePaths.length} files`);

      const { data, error } = await supabase.storage
        .from(this.config.bucket)
        .remove(filePaths);

      if (error) {
        throw new Error(`Bulk delete failed: ${error.message}`);
      }

      const deletedFiles = data?.map(item => item.name) || [];
      console.log(`✅ Deleted ${deletedFiles.length} files successfully`);

      return {
        success: true,
        data: deletedFiles,
        metadata: {
          requestId: 'bulk-delete',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Bulk file deletion failed:', error);

      return {
        success: false,
        error: {
          code: 'BULK_DELETE_FAILED',
          message: error.message,
          details: { filePaths },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // List files in a folder
  public async listFiles(
    folder: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    } = {}
  ): Promise<ApiResponse<FileMetadata[]>> {
    try {
      console.log(`📂 Listing files in folder: ${folder}`);

      const { data, error } = await supabase.storage
        .from(this.config.bucket)
        .list(folder, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw new Error(`List files failed: ${error.message}`);
      }

      const files: FileMetadata[] = (data || []).map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        contentType: file.metadata?.contentType || 'application/octet-stream',
        lastModified: file.updated_at || file.created_at || '',
        path: `${folder}/${file.name}`,
        publicUrl: supabase.storage
          .from(this.config.bucket)
          .getPublicUrl(`${folder}/${file.name}`).data.publicUrl,
        metadata: file.metadata,
      }));

      console.log(`✅ Listed ${files.length} files in ${folder}`);

      return {
        success: true,
        data: files,
        metadata: {
          requestId: folder,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('List files failed:', error);

      return {
        success: false,
        error: {
          code: 'LIST_FILES_FAILED',
          message: error.message,
          details: { folder, options },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Get file metadata
  public async getFileInfo(filePath: string): Promise<ApiResponse<FileMetadata>> {
    try {
      const folder = filePath.split('/').slice(0, -1).join('/');
      const fileName = filePath.split('/').pop() || '';

      const { data, error } = await supabase.storage
        .from(this.config.bucket)
        .list(folder, {
          limit: 1,
          search: fileName,
        });

      if (error) {
        throw new Error(`Get file info failed: ${error.message}`);
      }

      const file = data?.[0];
      if (!file) {
        throw new Error('File not found');
      }

      const fileInfo: FileMetadata = {
        name: file.name,
        size: file.metadata?.size || 0,
        contentType: file.metadata?.contentType || 'application/octet-stream',
        lastModified: file.updated_at || file.created_at || '',
        path: filePath,
        publicUrl: supabase.storage
          .from(this.config.bucket)
          .getPublicUrl(filePath).data.publicUrl,
        metadata: file.metadata,
      };

      return {
        success: true,
        data: fileInfo,
        metadata: {
          requestId: filePath,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Get file info failed:', error);

      return {
        success: false,
        error: {
          code: 'GET_FILE_INFO_FAILED',
          message: error.message,
          details: { filePath },
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Get storage statistics
  public async getStorageStats(): Promise<ApiResponse<StorageStats>> {
    try {
      const [videosResponse, thumbnailsResponse] = await Promise.all([
        this.listFiles('videos', { limit: 1000 }),
        this.listFiles('thumbnails', { limit: 1000 }),
      ]);

      if (!videosResponse.success || !thumbnailsResponse.success) {
        throw new Error('Failed to fetch storage data');
      }

      const videos = videosResponse.data || [];
      const thumbnails = thumbnailsResponse.data || [];
      const allFiles = [...videos, ...thumbnails];

      const stats: StorageStats = {
        totalFiles: allFiles.length,
        totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
        videoFiles: videos.length,
        videoSize: videos.reduce((sum, file) => sum + file.size, 0),
        thumbnailFiles: thumbnails.length,
        thumbnailSize: thumbnails.reduce((sum, file) => sum + file.size, 0),
        usageByFormat: {},
      };

      // Calculate usage by format
      allFiles.forEach(file => {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        if (!stats.usageByFormat[extension]) {
          stats.usageByFormat[extension] = { count: 0, size: 0 };
        }
        stats.usageByFormat[extension].count++;
        stats.usageByFormat[extension].size += file.size;
      });

      return {
        success: true,
        data: stats,
        metadata: {
          requestId: 'storage-stats',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Get storage stats failed:', error);

      return {
        success: false,
        error: {
          code: 'GET_STORAGE_STATS_FAILED',
          message: error.message,
          details: {},
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Cleanup expired files
  public async cleanupExpiredFiles(): Promise<ApiResponse<number>> {
    try {
      console.log('🧹 Starting storage cleanup...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      // Get all files (this is simplified - in reality, you'd have better filtering)
      const [videosResponse, thumbnailsResponse] = await Promise.all([
        this.listFiles('videos', { limit: 1000 }),
        this.listFiles('thumbnails', { limit: 1000 }),
      ]);

      if (!videosResponse.success || !thumbnailsResponse.success) {
        throw new Error('Failed to fetch files for cleanup');
      }

      const allFiles = [...(videosResponse.data || []), ...(thumbnailsResponse.data || [])];
      const expiredFiles = allFiles.filter(file => {
        const fileDate = new Date(file.lastModified);
        return fileDate < cutoffDate;
      });

      if (expiredFiles.length === 0) {
        console.log('✅ No expired files to clean up');
        return {
          success: true,
          data: 0,
          metadata: {
            requestId: 'cleanup',
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        };
      }

      // Delete expired files
      const filePaths = expiredFiles.map(file => file.path);
      const deleteResult = await this.deleteFiles(filePaths);

      if (!deleteResult.success) {
        throw new Error('Failed to delete expired files');
      }

      const deletedCount = deleteResult.data?.length || 0;
      console.log(`✅ Cleaned up ${deletedCount} expired files`);

      return {
        success: true,
        data: deletedCount,
        metadata: {
          requestId: 'cleanup',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

    } catch (error: any) {
      console.error('Storage cleanup failed:', error);

      return {
        success: false,
        error: {
          code: 'CLEANUP_FAILED',
          message: error.message,
          details: {},
        },
        metadata: {
          requestId: '',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };
    }
  }

  // Utility methods
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  public getPublicUrl(filePath: string): string {
    return supabase.storage
      .from(this.config.bucket)
      .getPublicUrl(filePath).data.publicUrl;
  }

  public getConfig(): StorageConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export class for testing
export { StorageService };

// Export types
export type { StorageConfig, StorageUploadOptions, UploadResult, FileMetadata, StorageStats };