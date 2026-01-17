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
export declare const audioService: {
    /**
     * Upload audio recording
     * Accepts audio blob from MediaRecorder API
     * Stores audio file and optionally converts to MP3
     */
    uploadAudio(data: UploadAudioData): Promise<{
        fileUrl: string;
        fileName: string;
        fileSize: number;
    }>;
    /**
     * Get file extension from MIME type
     */
    getExtensionFromMimeType(mimeType: string): string;
    /**
     * Delete audio file from disk
     */
    deleteAudioFile(fileUrl: string): Promise<void>;
};
export {};
//# sourceMappingURL=audio.service.d.ts.map