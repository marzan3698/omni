import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export const blogService = {
    async getPublicPosts(companyId, limit = 6) {
        const where = { status: 'Published' };
        if (companyId) {
            where.companyId = companyId;
        }
        return prisma.blogPost.findMany({
            where,
            orderBy: [
                { publishedAt: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true,
                publishedAt: true,
                tags: true,
            },
        });
    },
    async getPublicPostBySlug(slug) {
        const post = await prisma.blogPost.findUnique({
            where: { slug },
        });
        if (!post || post.status !== 'Published') {
            throw new AppError('Post not found', 404);
        }
        return post;
    },
    async list(companyId) {
        const where = {};
        if (companyId)
            where.companyId = companyId;
        return prisma.blogPost.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    },
    async create(data) {
        if (!data.title || !data.slug || !data.content) {
            throw new AppError('Title, slug, and content are required', 400);
        }
        return prisma.blogPost.create({
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: data.coverImage,
                tags: data.tags ?? undefined,
                status: data.status || 'Draft',
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
                companyId: data.companyId || null,
            },
        });
    },
    async update(id, data, companyId) {
        const existing = await prisma.blogPost.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError('Post not found', 404);
        }
        if (companyId && existing.companyId && existing.companyId !== companyId) {
            throw new AppError('Not allowed to update this post', 403);
        }
        return prisma.blogPost.update({
            where: { id },
            data: {
                title: data.title ?? existing.title,
                slug: data.slug ?? existing.slug,
                excerpt: data.excerpt ?? existing.excerpt,
                content: data.content ?? existing.content,
                coverImage: data.coverImage ?? existing.coverImage,
                tags: data.tags ?? existing.tags,
                status: data.status ?? existing.status,
                publishedAt: data.publishedAt === undefined
                    ? existing.publishedAt
                    : data.publishedAt
                        ? new Date(data.publishedAt)
                        : null,
            },
        });
    },
    async remove(id, companyId) {
        const existing = await prisma.blogPost.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError('Post not found', 404);
        }
        if (companyId && existing.companyId && existing.companyId !== companyId) {
            throw new AppError('Not allowed to delete this post', 403);
        }
        await prisma.blogPost.delete({ where: { id } });
        return { success: true };
    },
};
//# sourceMappingURL=blog.service.js.map