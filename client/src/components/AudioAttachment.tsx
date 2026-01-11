import { useState, useRef, useEffect } from 'react';
import { Volume2, Download, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface AudioAttachmentProps {
  url: string;
  fileName?: string;
  duration?: number;
  onDelete?: () => void;
  showDelete?: boolean;
  className?: string;
}

export function AudioAttachment({
  url,
  fileName,
  duration,
  onDelete,
  showDelete = false,
  className,
}: AudioAttachmentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fullUrl = getStaticFileUrl(url);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && audioDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * audioDuration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'audio';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      {/* Audio player */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlay}
          className="flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* Waveform/Progress bar */}
        <div className="flex-1">
          <div
            className="relative h-10 bg-gray-100 rounded cursor-pointer"
            onClick={handleSeek}
          >
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full bg-indigo-500 rounded transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Waveform visualization (simple bars) */}
            <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
              {Array.from({ length: 30 }).map((_, i) => {
                const barHeight = Math.random() * 60 + 20; // Random height for waveform effect
                const isActive = (i / 30) * 100 < progressPercentage;
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-1 rounded-full transition-colors',
                      isActive ? 'bg-indigo-600' : 'bg-gray-300'
                    )}
                    style={{ height: `${barHeight}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Time and duration */}
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Icon and actions */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
          {showDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* File name */}
      {fileName && (
        <p className="text-xs text-slate-600 mt-2 truncate" title={fileName}>
          {fileName}
        </p>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} src={fullUrl} preload="metadata" />
    </div>
  );
}

