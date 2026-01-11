import { useState } from 'react';
import { X, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface ImageAttachmentProps {
  url: string;
  fileName?: string;
  thumbnailUrl?: string;
  onDelete?: () => void;
  showDelete?: boolean;
  className?: string;
}

export function ImageAttachment({
  url,
  fileName,
  thumbnailUrl,
  onDelete,
  showDelete = false,
  className,
}: ImageAttachmentProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = thumbnailUrl || url;
  const fullUrl = getStaticFileUrl(url);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={cn('relative group rounded-lg overflow-hidden border border-gray-200 bg-white', className)}>
        {/* Image thumbnail */}
        <div
          className="relative w-full h-48 bg-gray-100 cursor-pointer"
          onClick={() => setShowLightbox(true)}
        >
          {!imageError ? (
            <img
              src={getStaticFileUrl(imageUrl)}
              alt={fileName || 'Attachment'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <span className="text-sm">Failed to load image</span>
            </div>
          )}

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(true);
              }}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="text-white hover:text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
            </Button>
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-white hover:text-white hover:bg-red-500/80"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* File name */}
        {fileName && (
          <div className="p-2 border-t border-gray-200">
            <p className="text-xs text-slate-600 truncate" title={fileName}>
              {fileName}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={fullUrl}
              alt={fileName || 'Image'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute top-4 right-16 text-white hover:text-white hover:bg-white/20"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

