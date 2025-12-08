import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export const blogController = {
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
      const posts = await blogService.getPublicPosts(companyId, limit);
      sendSuccess(res, posts, 'Blog posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const post = await blogService.getPublicPostBySlug(slug);
      sendSuccess(res, post, 'Blog post retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req as any).user?.companyId;
      const posts = await blogService.list(companyId);
      sendSuccess(res, posts, 'Blog posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req as any).user?.companyId;
      const post = await blogService.create({ ...req.body, companyId });
      sendSuccess(res, post, 'Blog post created successfully', 201);
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const companyId = (req as any).user?.companyId;
      if (isNaN(id)) {
        return sendError(res, 'Invalid post ID', 400);
      }
      const post = await blogService.update(id, req.body, companyId);
      sendSuccess(res, post, 'Blog post updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const companyId = (req as any).user?.companyId;
      if (isNaN(id)) {
        return sendError(res, 'Invalid post ID', 400);
      }
      await blogService.remove(id, companyId);
      sendSuccess(res, null, 'Blog post deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error.message, error.statusCode);
      }
      next(error);
    }
  },
};

