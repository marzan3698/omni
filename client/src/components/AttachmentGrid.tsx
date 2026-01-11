import { ImageAttachment } from './ImageAttachment';
import { PDFAttachment } from './PDFAttachment';
import { VideoAttachment } from './VideoAttachment';
import { AudioAttachment } from './AudioAttachment';
import { LinkAttachment } from './LinkAttachment';
import type { AttachmentFileType, TaskAttachment } from '@/types';

interface AttachmentGridProps {
  attachments: TaskAttachment[];
  onDelete?: (attachmentId: number) => void;
  showDelete?: boolean;
  className?: string;
}

export function AttachmentGrid({
  attachments,
  onDelete,
  showDelete = false,
  className,
}: AttachmentGridProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">No attachments yet</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {attachments.map((attachment) => {
        const handleDelete = onDelete ? () => onDelete(attachment.id) : undefined;

        switch (attachment.fileType) {
          case 'image':
            return (
              <ImageAttachment
                key={attachment.id}
                url={attachment.fileUrl || ''}
                fileName={attachment.fileName || undefined}
                thumbnailUrl={attachment.thumbnailUrl || undefined}
                onDelete={handleDelete}
                showDelete={showDelete}
              />
            );

          case 'pdf':
            return (
              <PDFAttachment
                key={attachment.id}
                url={attachment.fileUrl || ''}
                fileName={attachment.fileName || undefined}
                onDelete={handleDelete}
                showDelete={showDelete}
              />
            );

          case 'video':
            return (
              <VideoAttachment
                key={attachment.id}
                url={attachment.fileUrl || ''}
                fileName={attachment.fileName || undefined}
                thumbnailUrl={attachment.thumbnailUrl || undefined}
                duration={attachment.duration || undefined}
                onDelete={handleDelete}
                showDelete={showDelete}
              />
            );

          case 'audio':
            return (
              <AudioAttachment
                key={attachment.id}
                url={attachment.fileUrl || ''}
                fileName={attachment.fileName || undefined}
                duration={attachment.duration || undefined}
                onDelete={handleDelete}
                showDelete={showDelete}
              />
            );

          case 'link':
            return (
              <LinkAttachment
                key={attachment.id}
                url={attachment.linkUrl || ''}
                title={attachment.linkTitle || undefined}
                description={attachment.linkDescription || undefined}
                thumbnailUrl={attachment.thumbnailUrl || undefined}
                onDelete={handleDelete}
                showDelete={showDelete}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

