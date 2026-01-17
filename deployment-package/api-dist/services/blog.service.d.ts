interface BlogPayload {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    tags?: any;
    status?: 'Draft' | 'Published' | 'Archived';
    publishedAt?: Date | string | null;
    companyId?: number | null;
}
export declare const blogService: {
    getPublicPosts(companyId?: number | null, limit?: number): Promise<{
        id: number;
        title: string;
        tags: import("@prisma/client/runtime/library.js").JsonValue;
        slug: string;
        excerpt: string | null;
        coverImage: string | null;
        publishedAt: Date | null;
    }[]>;
    getPublicPostBySlug(slug: string): Promise<{
        status: import(".prisma/client").$Enums.BlogStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number | null;
        title: string;
        content: string;
        tags: import("@prisma/client/runtime/library.js").JsonValue | null;
        slug: string;
        excerpt: string | null;
        coverImage: string | null;
        publishedAt: Date | null;
    }>;
    list(companyId?: number | null): Promise<{
        status: import(".prisma/client").$Enums.BlogStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number | null;
        title: string;
        content: string;
        tags: import("@prisma/client/runtime/library.js").JsonValue | null;
        slug: string;
        excerpt: string | null;
        coverImage: string | null;
        publishedAt: Date | null;
    }[]>;
    create(data: BlogPayload): Promise<{
        status: import(".prisma/client").$Enums.BlogStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number | null;
        title: string;
        content: string;
        tags: import("@prisma/client/runtime/library.js").JsonValue | null;
        slug: string;
        excerpt: string | null;
        coverImage: string | null;
        publishedAt: Date | null;
    }>;
    update(id: number, data: Partial<BlogPayload>, companyId?: number | null): Promise<{
        status: import(".prisma/client").$Enums.BlogStatus;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        companyId: number | null;
        title: string;
        content: string;
        tags: import("@prisma/client/runtime/library.js").JsonValue | null;
        slug: string;
        excerpt: string | null;
        coverImage: string | null;
        publishedAt: Date | null;
    }>;
    remove(id: number, companyId?: number | null): Promise<{
        success: boolean;
    }>;
};
export {};
//# sourceMappingURL=blog.service.d.ts.map