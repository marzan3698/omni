import apiClient from './api';
import type { ApiResponse } from '@/types';

export interface Review {
  id: number;
  authorName: string;
  role?: string | null;
  rating: number;
  comment: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: string | null;
  tags?: any;
}

export const contentApi = {
  async getPublicReviews(limit = 6) {
    const response = await apiClient.get<ApiResponse<Review[]>>(`/reviews/public`, {
      params: { limit },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch reviews');
  },

  async getPublicPosts(limit = 6) {
    const response = await apiClient.get<ApiResponse<BlogPost[]>>(`/blog/posts/public`, {
      params: { limit },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch posts');
  },
};

