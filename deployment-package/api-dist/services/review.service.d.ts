interface ReviewPayload {
    authorName: string;
    role?: string;
    rating: number;
    comment: string;
    isFeatured?: boolean;
    companyId?: number | null;
}
export declare const reviewService: {
    getPublicReviews(companyId?: number | null, limit?: number): Promise<{
        role: string | null;
        id: number;
        createdAt: Date;
        companyId: number | null;
        authorName: string;
        rating: number;
        comment: string;
        isFeatured: boolean;
    }[]>;
    list(companyId?: number | null): Promise<{
        role: string | null;
        id: number;
        createdAt: Date;
        companyId: number | null;
        authorName: string;
        rating: number;
        comment: string;
        isFeatured: boolean;
    }[]>;
    create(data: ReviewPayload): Promise<{
        role: string | null;
        id: number;
        createdAt: Date;
        companyId: number | null;
        authorName: string;
        rating: number;
        comment: string;
        isFeatured: boolean;
    }>;
    update(id: number, data: Partial<ReviewPayload>, companyId?: number | null): Promise<{
        role: string | null;
        id: number;
        createdAt: Date;
        companyId: number | null;
        authorName: string;
        rating: number;
        comment: string;
        isFeatured: boolean;
    }>;
    remove(id: number, companyId?: number | null): Promise<{
        success: boolean;
    }>;
};
export {};
//# sourceMappingURL=review.service.d.ts.map