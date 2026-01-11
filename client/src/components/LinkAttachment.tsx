import { ExternalLink, Download, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface LinkAttachmentProps {
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  onDelete?: () => void;
  showDelete?: boolean;
  className?: string;
}

export function LinkAttachment({
  url,
  title,
  description,
  thumbnailUrl,
  onDelete,
  showDelete = false,
  className,
}: LinkAttachmentProps) {
  const handleOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow', className)}>
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-gray-100">
            <img
              src={getStaticFileUrl(thumbnailUrl)}
              alt={title || 'Link preview'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {!thumbnailUrl && (
          <div className="flex-shrink-0 w-24 h-24 rounded bg-indigo-100 flex items-center justify-center">
            <Globe className="w-8 h-8 text-indigo-500" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">
              {title || 'Link'}
            </h4>
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {description && (
            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
              {description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 truncate">
              {getDomain(url)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="text-xs h-6 px-2 flex-shrink-0"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

