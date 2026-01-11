import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AttachmentFileType } from '@prisma/client';
import axios from 'axios';
import { load } from 'cheerio';

interface CreateFileAttachmentData {
  taskId?: number;
  subTaskId?: number;
  companyId: number;
  fileType: AttachmentFileType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
  createdBy: string;
}

interface CreateLinkAttachmentData {
  taskId?: number;
  subTaskId?: number;
  companyId: number;
  linkUrl: string;
  linkTitle?: string;
  linkDescription?: string;
  thumbnailUrl?: string;
  createdBy: string;
}

interface LinkPreview {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}

export const taskAttachmentService = {
  /**
   * Create file attachment (image, PDF, video, audio)
   */
  async createAttachment(data: CreateFileAttachmentData) {
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

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: data.taskId || null,
        subTaskId: data.subTaskId || null,
        companyId: data.companyId,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        createdBy: data.createdBy,
      },
    });

    // Serialize BigInt to number for JSON response
    return {
      ...attachment,
      fileSize: attachment.fileSize ? Number(attachment.fileSize) : attachment.fileSize,
    };
  },

  /**
   * Create link attachment
   */
  async createLinkAttachment(data: CreateLinkAttachmentData) {
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

    // Try to fetch link preview if not provided
    let linkPreview: LinkPreview = {
      title: data.linkTitle,
      description: data.linkDescription,
      thumbnailUrl: data.thumbnailUrl,
    };

    if (!data.linkTitle || !data.linkDescription) {
      try {
        linkPreview = await this.getLinkPreview(data.linkUrl);
      } catch (error) {
        console.error('Error fetching link preview:', error);
        // Continue without preview if fetch fails
      }
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: data.taskId || null,
        subTaskId: data.subTaskId || null,
        companyId: data.companyId,
        fileType: 'link',
        linkUrl: data.linkUrl,
        linkTitle: linkPreview.title || data.linkUrl,
        linkDescription: linkPreview.description,
        thumbnailUrl: linkPreview.thumbnailUrl || data.thumbnailUrl,
        createdBy: data.createdBy,
      },
    });

    // Serialize BigInt to number for JSON response
    return {
      ...attachment,
      fileSize: attachment.fileSize ? Number(attachment.fileSize) : attachment.fileSize,
    };
  },

  /**
   * Delete attachment
   */
  async deleteAttachment(id: number, companyId: number) {
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    // TODO: Delete physical file from server if it exists
    // For now, just delete the database record
    // File cleanup can be handled by a scheduled job

    await prisma.taskAttachment.delete({
      where: { id },
    });

    return { success: true };
  },

  /**
   * Get all attachments for a task
   */
  async getAttachmentsByTaskId(taskId: number, companyId: number) {
    // Verify task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        companyId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const attachments = await prisma.taskAttachment.findMany({
      where: {
        taskId,
        companyId,
        subTaskId: null, // Only main task attachments, not sub-task attachments
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize BigInt to number for JSON response
    return attachments.map((att) => ({
      ...att,
      fileSize: att.fileSize ? Number(att.fileSize) : att.fileSize,
    }));
  },

  /**
   * Get all attachments for a sub-task
   */
  async getAttachmentsBySubTaskId(subTaskId: number, companyId: number) {
    // Verify sub-task exists and belongs to company
    const subTask = await prisma.subTask.findFirst({
      where: {
        id: subTaskId,
        companyId,
      },
    });

    if (!subTask) {
      throw new AppError('Sub-task not found', 404);
    }

    const attachments = await prisma.taskAttachment.findMany({
      where: {
        subTaskId,
        companyId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize BigInt to number for JSON response
    return attachments.map((att) => ({
      ...att,
      fileSize: att.fileSize ? Number(att.fileSize) : att.fileSize,
    }));
  },

  /**
   * Fetch link preview metadata (Open Graph tags, meta tags)
   */
  async getLinkPreview(url: string): Promise<LinkPreview> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 5000, // 5 second timeout
        maxRedirects: 5,
      });

      const $ = load(response.data);

      // Try Open Graph tags first
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');

      // Fall back to standard meta tags
      const metaTitle = ogTitle || $('title').text() || $('meta[name="title"]').attr('content');
      const metaDescription =
        ogDescription ||
        $('meta[name="description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content');
      const metaImage =
        ogImage ||
        $('meta[name="image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content');

      // Try to get first image from page if no meta image
      let thumbnailUrl = metaImage;
      if (!thumbnailUrl) {
        const firstImage = $('img').first().attr('src');
        if (firstImage) {
          // Convert relative URL to absolute
          try {
            const baseUrl = new URL(url);
            thumbnailUrl = new URL(firstImage, baseUrl).toString();
          } catch {
            thumbnailUrl = firstImage;
          }
        }
      }

      return {
        title: metaTitle?.trim(),
        description: metaDescription?.trim(),
        thumbnailUrl: thumbnailUrl?.trim(),
      };
    } catch (error: any) {
      console.error('Error fetching link preview:', error.message);
      // Return empty preview if fetch fails
      return {
        title: url,
        description: undefined,
        thumbnailUrl: undefined,
      };
    }
  },
};

