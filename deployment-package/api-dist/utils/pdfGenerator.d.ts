interface ProjectData {
    id: number;
    title: string;
    description?: string | null;
    budget: number;
    time: string;
    createdAt: Date;
    clientId: string;
}
/**
 * Generate PDF document for project requirements
 */
export declare function generateProjectPDF(project: ProjectData): Promise<string>;
/**
 * Get PDF file path
 */
export declare function getProjectPDFPath(documentUrl: string): string;
export {};
//# sourceMappingURL=pdfGenerator.d.ts.map