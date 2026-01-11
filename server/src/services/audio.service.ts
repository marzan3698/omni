import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface UploadAudioData {
  taskId?: number;
  subTaskId?: number;
  companyId: number;
  audioBlob: Buffer;
  mimeType: string;
  duration?: number;
  createdBy: string;
}

/**
 * Audio service for handling audio recordings
 * Supports instant recording from MediaRecorder API
 * Optionally converts audio to MP3 format using FFmpeg (if available)
 */
export const audioService = {
  /**
   * Upload audio recording
   * Accepts audio blob from MediaRecorder API
   * Stores audio file and optionally converts to MP3
   */
  async uploadAudio(data: UploadAudioData): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    // Validate that either taskId or subTaskId is provided, but not both
    if (!data.taskId && !data.subTaskId) {
      throw new AppError('Either taskId or subTaskId must be provided', 400);
    }
    if (data.taskId && data.subTaskId) {
      throw new AppError('Cannot attach to both task and sub-task. Please choose one.', 400);
    }

    // Verify task or sub-task exists and belongs to company
    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: data.taskId,
          companyId: data.companyId,
        },
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }
    }

    if (data.subTaskId) {
      const subTask = await prisma.subTask.findFirst({
        where: {
          id: data.subTaskId,
          companyId: data.companyId,
        },
      });

      if (!subTask) {
        throw new AppError('Sub-task not found', 404);
      }
    }

    // Determine upload directory
    const taskOrSubTaskId = data.taskId || data.subTaskId;
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'tasks',
      data.taskId ? `task-${data.taskId}` : `subtask-${data.subTaskId}`,
      'audio'
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const originalExtension = this.getExtensionFromMimeType(data.mimeType);
    const originalFileName = `audio-${timestamp}-${randomSuffix}${originalExtension}`;
    const originalFilePath = path.join(uploadDir, originalFileName);

    // Save original audio file
    fs.writeFileSync(originalFilePath, data.audioBlob);

    let finalFileName = originalFileName;
    let finalFilePath = originalFilePath;
    let finalMimeType = data.mimeType;
    let fileSize = data.audioBlob.length;

    // Try to convert to MP3 using FFmpeg (optional - if FFmpeg is available)
    try {
      const mp3FileName = `audio-${timestamp}-${randomSuffix}.mp3`;
      const mp3FilePath = path.join(uploadDir, mp3FileName);

      // Check if FFmpeg is available
      try {
        await execAsync('ffmpeg -version');
        
        // Convert to MP3
        await execAsync(
          `ffmpeg -i "${originalFilePath}" -codec:a libmp3lame -b:a 128k "${mp3FilePath}" -y`
        );

        // Check if MP3 file was created successfully
        if (fs.existsSync(mp3FilePath)) {
          const mp3Stats = fs.statSync(mp3FilePath);
          if (mp3Stats.size > 0) {
            // Use MP3 file instead of original
            finalFileName = mp3FileName;
            finalFilePath = mp3FilePath;
            finalMimeType = 'audio/mpeg';
            fileSize = mp3Stats.size;

            // Delete original file
            try {
              fs.unlinkSync(originalFilePath);
            } catch (error) {
              console.warn('Failed to delete original audio file:', error);
            }
          }
        }
      } catch (ffmpegError: any) {
        // FFmpeg not available or conversion failed - use original file
        console.log('FFmpeg not available or conversion failed, using original audio file:', ffmpegError.message);
      }
    } catch (error: any) {
      console.error('Error processing audio file:', error);
      // Continue with original file if conversion fails
    }

    // Generate relative URL path
    const relativePath = data.taskId
      ? `tasks/task-${data.taskId}/audio/${finalFileName}`
      : `tasks/subtask-${data.subTaskId}/audio/${finalFileName}`;
    const fileUrl = `/uploads/${relativePath}`;

    return {
      fileUrl,
      fileName: finalFileName,
      fileSize,
    };
  },

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/vnd.wave': '.wav',
      'audio/aac': '.aac',
      'audio/flac': '.flac',
    };

    return mimeToExt[mimeType.toLowerCase()] || '.webm'; // Default to .webm (most common from MediaRecorder)
  },

  /**
   * Delete audio file from disk
   */
  async deleteAudioFile(fileUrl: string): Promise<void> {
    try {
      // Remove /uploads prefix from URL
      const relativePath = fileUrl.replace(/^\/uploads\//, '');
      const filePath = path.join(process.cwd(), 'uploads', relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Try to delete directory if empty
      const dirPath = path.dirname(filePath);
      try {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          fs.rmdirSync(dirPath);
        }
      } catch (error) {
        // Directory not empty or other error - ignore
      }
    } catch (error: any) {
      console.error('Error deleting audio file:', error);
      // Don't throw error - file might already be deleted
    }
  },
};

