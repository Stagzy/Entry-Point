/**
 * secureStorageService.js - Secure File Storage with AV Scanning
 * 
 * PURPOSE:
 * Manage secure file uploads with virus scanning and signed URLs.
 * Implements proper security for user-generated content.
 * 
 * FEATURES:
 * - Signed URL generation for secure uploads
 * - Virus scanning before public availability
 * - File type validation and size limits
 * - Automatic cleanup of malicious files
 * - CDN integration for performance
 */

import { supabase } from '../config/supabase';
import observabilityService from './observabilityService';

class SecureStorageService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];
    
    this.allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt'
    ];

    // Bucket configuration
    this.buckets = {
      temp: 'temp-uploads',        // Temporary storage for scanning
      public: 'public-content',    // Public content after scanning
      private: 'private-content',  // Private user content
      avatars: 'avatars'          // User profile images
    };
  }

  /**
   * Generate signed URL for secure upload
   */
  async generateUploadURL(fileName, fileType, bucket = 'temp', expiresIn = 300) {
    try {
      // Validate file type
      if (!this.isAllowedFileType(fileName, fileType)) {
        return {
          data: null,
          error: { message: 'File type not allowed' }
        };
      }

      // Generate unique file path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const sanitizedName = this.sanitizeFileName(fileName);
      const filePath = `${timestamp}-${randomId}-${sanitizedName}`;

      // Generate signed URL
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath, {
          expiresIn,
          upsert: false
        });

      if (error) {
        observabilityService.trackError(error, {
          action: 'generate_upload_url',
          fileName,
          fileType,
          bucket
        });
        return { data: null, error };
      }

      // Log upload URL generation
      observabilityService.trackSecurity('upload_url_generated', {
        fileName: sanitizedName,
        fileType,
        bucket,
        filePath,
        expiresIn
      });

      return {
        data: {
          uploadUrl: data.signedUrl,
          filePath: filePath,
          bucket: bucket,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        },
        error: null
      };

    } catch (error) {
      console.error('Upload URL generation failed:', error);
      observabilityService.trackError(error, { action: 'generate_upload_url' });
      return { data: null, error };
    }
  }

  /**
   * Scan uploaded file for viruses/malware
   */
  async scanFile(filePath, bucket = 'temp') {
    try {
      // Get file URL for scanning
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60); // 1 minute for scanning

      if (!urlData?.signedUrl) {
        return {
          clean: false,
          error: 'Failed to get file URL for scanning'
        };
      }

      // Mock virus scanning - replace with actual AV service
      const scanResult = await this.mockVirusScanning(urlData.signedUrl, filePath);

      // Log scan result
      observabilityService.trackSecurity('file_scanned', {
        filePath,
        bucket,
        scanResult: scanResult.clean ? 'clean' : 'infected',
        threats: scanResult.threats || []
      });

      if (!scanResult.clean) {
        // Delete infected file immediately
        await this.deleteFile(filePath, bucket);
        
        observabilityService.trackSecurity('malicious_file_deleted', {
          filePath,
          bucket,
          threats: scanResult.threats
        });
      }

      return scanResult;

    } catch (error) {
      console.error('File scanning failed:', error);
      observabilityService.trackError(error, {
        action: 'scan_file',
        filePath,
        bucket
      });
      return {
        clean: false,
        error: error.message
      };
    }
  }

  /**
   * Mock virus scanning - replace with real AV service
   */
  async mockVirusScanning(fileUrl, filePath) {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock scan results based on filename patterns
    const suspicious = [
      'virus', 'malware', 'trojan', 'worm', 'exploit',
      '.exe', '.bat', '.cmd', '.scr', '.vbs'
    ];

    const fileName = filePath.toLowerCase();
    const isInfected = suspicious.some(pattern => fileName.includes(pattern));

    if (isInfected) {
      return {
        clean: false,
        threats: ['MOCK_VIRUS_DETECTED'],
        scanTime: 2000,
        scanner: 'MockAV'
      };
    }

    // Simulate 1% false positive rate for testing
    const randomInfection = Math.random() < 0.01;
    
    return {
      clean: !randomInfection,
      threats: randomInfection ? ['RANDOM_THREAT'] : [],
      scanTime: 2000,
      scanner: 'MockAV'
    };
  }

  /**
   * Move file from temp to public bucket after scanning
   */
  async promoteToPublic(tempFilePath, publicPath = null) {
    try {
      // Generate public path if not provided
      if (!publicPath) {
        const fileName = tempFilePath.split('-').slice(2).join('-');
        publicPath = `verified/${Date.now()}-${fileName}`;
      }

      // Download from temp bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.buckets.temp)
        .download(tempFilePath);

      if (downloadError) {
        return { data: null, error: downloadError };
      }

      // Upload to public bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.buckets.public)
        .upload(publicPath, fileData, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Delete from temp bucket
      await this.deleteFile(tempFilePath, this.buckets.temp);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.buckets.public)
        .getPublicUrl(publicPath);

      observabilityService.trackSecurity('file_promoted_to_public', {
        tempFilePath,
        publicPath,
        publicUrl: publicUrlData.publicUrl
      });

      return {
        data: {
          publicPath,
          publicUrl: publicUrlData.publicUrl,
          size: fileData.size
        },
        error: null
      };

    } catch (error) {
      console.error('File promotion failed:', error);
      observabilityService.trackError(error, {
        action: 'promote_to_public',
        tempFilePath,
        publicPath
      });
      return { data: null, error };
    }
  }

  /**
   * Complete secure upload process
   */
  async processUpload(tempFilePath, targetBucket = 'public', metadata = {}) {
    try {
      // Step 1: Scan file for viruses
      const scanResult = await this.scanFile(tempFilePath);
      
      if (!scanResult.clean) {
        return {
          success: false,
          error: 'File failed security scan',
          threats: scanResult.threats
        };
      }

      // Step 2: Move to target bucket
      let finalPath, finalUrl;
      
      if (targetBucket === 'public') {
        const promoteResult = await this.promoteToPublic(tempFilePath);
        if (promoteResult.error) {
          return {
            success: false,
            error: 'Failed to move file to public storage'
          };
        }
        finalPath = promoteResult.data.publicPath;
        finalUrl = promoteResult.data.publicUrl;
      } else {
        // Handle private bucket moves here
        finalPath = tempFilePath;
        finalUrl = await this.getSignedUrl(finalPath, targetBucket, 3600);
      }

      // Step 3: Record successful upload
      observabilityService.trackSecurity('secure_upload_completed', {
        originalPath: tempFilePath,
        finalPath,
        targetBucket,
        scanResult: 'clean',
        metadata
      });

      return {
        success: true,
        filePath: finalPath,
        fileUrl: finalUrl,
        scanResult
      };

    } catch (error) {
      console.error('Secure upload processing failed:', error);
      observabilityService.trackError(error, {
        action: 'process_upload',
        tempFilePath,
        targetBucket
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate signed URL for private file access
   */
  async getSignedUrl(filePath, bucket, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        observabilityService.trackError(error, {
          action: 'get_signed_url',
          filePath,
          bucket
        });
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL generation failed:', error);
      return null;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath, bucket) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('File deletion failed:', error);
        return { success: false, error };
      }

      observabilityService.trackSecurity('file_deleted', {
        filePath,
        bucket
      });

      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      return { success: false, error };
    }
  }

  /**
   * Validate file type and extension
   */
  isAllowedFileType(fileName, mimeType) {
    // Check MIME type
    if (!this.allowedTypes.includes(mimeType)) {
      return false;
    }

    // Check file extension
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (!this.allowedExtensions.includes(extension)) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize file name for safe storage
   */
  sanitizeFileName(fileName) {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace special chars with underscore
      .replace(/_{2,}/g, '_')           // Replace multiple underscores with single
      .substring(0, 100);               // Limit length
  }

  /**
   * Get file metadata
   */
  async getFileInfo(filePath, bucket) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          search: filePath.split('/').pop()
        });

      if (error || !data?.length) {
        return { data: null, error: error || 'File not found' };
      }

      return { data: data[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Cleanup old temporary files
   */
  async cleanupTempFiles() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // List files in temp bucket
      const { data: files, error } = await supabase.storage
        .from(this.buckets.temp)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error || !files) {
        console.error('Failed to list temp files:', error);
        return;
      }

      // Filter old files
      const oldFiles = files.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < oneDayAgo;
      });

      if (oldFiles.length === 0) {
        console.log('No old temp files to cleanup');
        return;
      }

      // Delete old files
      const filePaths = oldFiles.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from(this.buckets.temp)
        .remove(filePaths);

      if (deleteError) {
        console.error('Temp file cleanup failed:', deleteError);
      } else {
        console.log(`✅ Cleaned up ${oldFiles.length} old temp files`);
        observabilityService.trackKPI('temp_files_cleaned', oldFiles.length);
      }

    } catch (error) {
      console.error('Temp file cleanup error:', error);
    }
  }
}

export default new SecureStorageService();
