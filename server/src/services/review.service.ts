import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

interface ReviewPayload {
  authorName: string;
  role?: string;
  rating: number;
  comment: string;
  isFeatured?: boolean;
  companyId?: number | null;
}

export const reviewService = {
  async getPublicReviews(companyId?: number | null, limit: number = 6) {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    return prisma.review.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });
  },

  async list(companyId?: number | null) {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: ReviewPayload) {
    if (!data.authorName || !data.comment) {
      throw new AppError('Author name and comment are required', 400);
    }

    if (!Number.isFinite(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    return prisma.review.create({
      data: {
        authorName: data.authorName,
        role: data.role,
        rating: Math.round(data.rating),
        comment: data.comment,
        isFeatured: Boolean(data.isFeatured),
        companyId: data.companyId || null,
      },
    });
  },

  async update(id: number, data: Partial<ReviewPayload>, companyId?: number | null) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (companyId && review.companyId && review.companyId !== companyId) {
      throw new AppError('Not allowed to update this review', 403);
    }

    return prisma.review.update({
      where: { id },
      data: {
        authorName: data.authorName ?? review.authorName,
        role: data.role ?? review.role,
        rating: data.rating ? Math.min(5, Math.max(1, Math.round(data.rating))) : review.rating,
        comment: data.comment ?? review.comment,
        isFeatured: typeof data.isFeatured === 'boolean' ? data.isFeatured : review.isFeatured,
      },
    });
  },

  async remove(id: number, companyId?: number | null) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (companyId && review.companyId && review.companyId !== companyId) {
      throw new AppError('Not allowed to delete this review', 403);
    }

    await prisma.review.delete({ where: { id } });
    return { success: true };
  },
};

