import { useState, useRef } from 'react';
import { Video, Download, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface VideoAttachmentProps {
  url: string;
  fileName?: string;
  thumbnailUrl?: string;
  duration?: number;
  onDelete?: () => void;
  showDelete?: boolean;
  className?: string;
}

export function VideoAttachment({
  url,
  fileName,
  thumbnailUrl,
  duration,
  onDelete,
  showDelete = false,
  className,
}: VideoAttachmentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fullUrl = getStaticFileUrl(url);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'video';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <div className={cn('relative group rounded-lg overflow-hidden border border-gray-200 bg-black', className)}>
        {/* Video thumbnail/preview */}
        <div
          className="relative w-full h-48 bg-gray-900 cursor-pointer"
          onClick={() => setShowPlayer(true)}
        >
          {thumbnailUrl ? (
            <img
              src={getStaticFileUrl(thumbnailUrl)}
              alt={fileName || 'Video'}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-white/50" />
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-4 group-hover:bg-black/70 transition-all">
              <Play className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(duration)}
            </div>
          )}

          {/* Actions overlay */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-white hover:text-white hover:bg-red-500/80 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* File name */}
        {fileName && (
          <div className="p-2 border-t border-gray-700 bg-black">
            <p className="text-xs text-white truncate" title={fileName}>
              {fileName}
            </p>
          </div>
        )}
      </div>

      {/* Video player modal */}
      {showPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => {
            setShowPlayer(false);
            setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }}
        >
          <div className="relative w-full max-w-6xl">
            <video
              ref={videoRef}
              src={fullUrl}
              controls
              className="w-full max-h-[85vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="text-white hover:text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
                <Download className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPlayer(false);
                  setIsPlaying(false);
                  if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                  }
                }}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

