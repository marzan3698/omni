import { useState } from 'react';
import { FileText, Download, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface PDFAttachmentProps {
  url: string;
  fileName?: string;
  onDelete?: () => void;
  showDelete?: boolean;
  className?: string;
}

export function PDFAttachment({
  url,
  fileName,
  onDelete,
  showDelete = false,
  className,
}: PDFAttachmentProps) {
  const [showViewer, setShowViewer] = useState(false);

  const fullUrl = getStaticFileUrl(url);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fullUrl, '_blank');
  };

  return (
    <>
      <div className={cn('relative group rounded-lg overflow-hidden border border-gray-200 bg-white', className)}>
        {/* PDF preview card */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px] bg-red-50">
          <FileText className="w-16 h-16 text-red-500 mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1 truncate w-full text-center" title={fileName}>
            {fileName || 'PDF Document'}
          </p>
          <p className="text-xs text-slate-500 mb-4">PDF Document</p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewer(true)}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            {showDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer modal (opens in iframe) */}
      {showViewer && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowViewer(false)}
        >
          <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewTab}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewer(false)}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <iframe
              src={`${fullUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={fileName || 'PDF Viewer'}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

