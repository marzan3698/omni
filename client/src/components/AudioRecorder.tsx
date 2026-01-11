import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Upload, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, mimeType: string, duration: number) => void;
  onCancel?: () => void;
  className?: string;
}

export function AudioRecorder({
  onRecordingComplete,
  onCancel,
  className,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
      let selectedMimeType = 'audio/webm';

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        setRecordedBlob(blob);
        
        // Create audio URL for playback
        if (audioRef.current) {
          const audioUrl = URL.createObjectURL(blob);
          audioRef.current.src = audioUrl;
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start duration counter
      intervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);

      if (intervalRef.current) {
        if (isPaused) {
          intervalRef.current = window.setInterval(() => {
            setDuration((prev) => prev + 1);
          }, 1000);
        } else {
          clearInterval(intervalRef.current);
        }
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && recordedBlob) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      } else {
        audioRef.current.play();
        setIsPlaying(true);

        // Update playback time
        playbackIntervalRef.current = window.setInterval(() => {
          if (audioRef.current) {
            setPlaybackTime(audioRef.current.currentTime);
            if (audioRef.current.ended) {
              setIsPlaying(false);
              setPlaybackTime(0);
              if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
              }
            }
          }
        }, 100);

        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlaybackTime(0);
        });
      }
    }
  };

  const handleUpload = () => {
    if (recordedBlob && mediaRecorderRef.current) {
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      onRecordingComplete?.(recordedBlob, mimeType, duration);
      
      // Reset
      setRecordedBlob(null);
      setDuration(0);
      setPlaybackTime(0);
      audioChunksRef.current = [];
    }
  };

  const handleCancel = () => {
    // Stop recording if in progress
    if (isRecording && mediaRecorderRef.current) {
      stopRecording();
    }

    // Cleanup
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Reset state
    setRecordedBlob(null);
    setDuration(0);
    setPlaybackTime(0);
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);

    onCancel?.();
  };

  return (
    <div className={cn('border border-gray-200 rounded-lg p-4 bg-white', className)}>
      {!recordedBlob ? (
        // Recording interface
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                  )} />
                  <span className="text-sm font-medium text-slate-700">
                    {isPaused ? 'Paused' : 'Recording'} - {formatTime(duration)}
                  </span>
                </div>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="sm"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  size="sm"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Waveform visualization while recording */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-16">
              {Array.from({ length: 30 }).map((_, i) => {
                const delay = i * 0.1;
                const height = Math.random() * 40 + 20;
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-2 bg-indigo-500 rounded-full transition-all',
                      isPaused && 'opacity-50'
                    )}
                    style={{
                      height: `${isPaused ? 20 : height}%`,
                      animation: isPaused ? 'none' : `pulse 0.5s ease-in-out infinite`,
                      animationDelay: `${delay}s`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Playback interface
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={playRecording}
                variant="outline"
                size="sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <span className="text-sm text-slate-600">
                {formatTime(playbackTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Playback progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-100"
              style={{ width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%` }}
            />
          </div>

          <audio ref={audioRef} />
        </div>
      )}

      {/* Cancel button when not recording or when no recording */}
      {!isRecording && !recordedBlob && onCancel && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            className="w-full text-slate-600 hover:text-slate-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

