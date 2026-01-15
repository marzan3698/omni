import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeadMeeting } from '@/types';

interface MeetingAlertProps {
  meeting: LeadMeeting & {
    lead?: {
      id: number;
      title: string;
      assignedEmployee?: {
        user?: {
          email: string;
        };
      };
      createdByUser?: {
        email: string;
      };
    };
  };
  onDismiss?: () => void;
}

export function MeetingAlert({ meeting, onDismiss }: MeetingAlertProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const meetingTime = new Date(meeting.meetingTime);
      const now = new Date();
      const diff = meetingTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [meeting.meetingTime]);

  if (isExpired || !timeRemaining) {
    return null;
  }

  const handleJoinMeeting = () => {
    window.open(meeting.googleMeetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm max-w-md">
      <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-indigo-900 mb-0.5">
          পরবর্তী মিটিং
        </div>
        <div className="text-xs text-indigo-700 truncate">
          {meeting.title}
          {meeting.lead && (
            <span className="text-indigo-600 ml-1">
              • {meeting.lead.title}
            </span>
          )}
        </div>
        <div className="text-xs text-indigo-600 mt-0.5 font-mono">
          {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
        </div>
      </div>
      <Button
        size="sm"
        onClick={handleJoinMeeting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 text-xs px-2 py-1 h-auto"
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        Join
      </Button>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-indigo-100 rounded transition-colors flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-3 h-3 text-indigo-600" />
        </button>
      )}
    </div>
  );
}
