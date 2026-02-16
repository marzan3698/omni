import { useState } from 'react';
import { Check, Circle, Clock, CheckCircle2, X, Play, ChevronDown, ChevronRight, Weight, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskAttachment } from '@/types';
import { AttachmentGrid } from './AttachmentGrid';
import { formatBangladeshiDateTime } from '@/lib/utils';

interface SubTaskItemProps {
  id: number;
  title: string;
  instructions?: string | null;
  weight: number;
  status: TaskStatus;
  order: number;
  startedAt?: string | null;
  completedAt?: string | null;
  attachments?: TaskAttachment[];
  onStatusChange?: (id: number, status: TaskStatus) => void;
  onDelete?: (id: number) => void;
  canEdit?: boolean;
  className?: string;
  /** Use dark theme for game-style layouts */
  theme?: 'light' | 'dark';
}

const statusConfigLight = {
  Pending: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Pending' },
  StartedWorking: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Started Working' },
  Complete: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Complete' },
  Cancel: { icon: X, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Cancel' },
};
const statusConfigDark = {
  Pending: { icon: Circle, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'Pending' },
  StartedWorking: { icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', label: 'Started Working' },
  Complete: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Complete' },
  Cancel: { icon: X, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', label: 'Cancel' },
};

export function SubTaskItem({
  id,
  title,
  instructions,
  weight,
  status,
  order,
  startedAt,
  completedAt,
  attachments = [],
  onStatusChange,
  onDelete,
  canEdit = false,
  className,
  theme = 'light',
}: SubTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const statusConfig = theme === 'dark' ? statusConfigDark : statusConfigLight;
  const StatusIcon = statusConfig[status].icon;
  const btnOutline = theme === 'dark' ? 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20' : '';

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!onStatusChange || isChangingStatus) return;

    setIsChangingStatus(true);
    try {
      await onStatusChange(id, newStatus);
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      'border rounded-lg transition-all',
      isDark ? 'border-amber-500/20 bg-slate-800/40' : 'border-gray-200 bg-white',
      className
    )}>
      <div className="p-4 flex items-start gap-3">
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2', statusConfig[status].bg, statusConfig[status].border)}>
          <StatusIcon className={cn('w-4 h-4', statusConfig[status].color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn('text-sm font-medium flex-1', isDark ? 'text-amber-100' : 'text-slate-900')}>
              {order + 1}. {title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border', isDark ? 'border-amber-500/30 text-amber-200' : 'border-gray-200')}>
                <Weight className="w-3 h-3" />
                {weight}x
              </span>
              <span className={cn('px-2 py-0.5 rounded text-xs border', statusConfig[status].border, isDark ? 'text-amber-200' : '')}>
                {statusConfig[status].label}
              </span>
            </div>
          </div>

          {status === 'StartedWorking' && startedAt && (
            <p className={cn('text-xs mb-2', isDark ? 'text-amber-200/70' : 'text-slate-500')}>
              Started at {formatBangladeshiDateTime(new Date(startedAt))}
            </p>
          )}
          {status === 'Complete' && completedAt && (
            <p className={cn('text-xs mb-2', isDark ? 'text-amber-200/70' : 'text-slate-500')}>
              Completed at {formatBangladeshiDateTime(new Date(completedAt))}
            </p>
          )}

          {instructions && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn('flex items-center gap-1 text-xs mb-2', isDark ? 'text-amber-400 hover:text-amber-300' : 'text-indigo-600 hover:text-indigo-700')}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>{isExpanded ? 'Hide' : 'Show'} Instructions</span>
            </button>
          )}

          {isExpanded && instructions && (
            <div className={cn('mt-2 p-3 rounded text-sm whitespace-pre-wrap', isDark ? 'bg-slate-800/60 text-amber-200/90 border border-amber-500/20' : 'bg-slate-50 text-slate-700')}>
              {instructions}
            </div>
          )}

          {attachments.length > 0 && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs', isDark ? 'text-amber-200/70' : 'text-slate-500')}>
              <Paperclip className="w-3 h-3" />
              <span>{attachments.length} attachment{attachments.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {canEdit && onStatusChange && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-medium self-center', isDark ? 'text-amber-200/80' : 'text-slate-600')}>Change Status:</span>
              {status === 'Pending' && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange('StartedWorking')} disabled={isChangingStatus} className={cn('h-7 text-xs', isDark && btnOutline)}>
                  <Play className="w-3 h-3 mr-1" />Start Working
                </Button>
              )}
              {status === 'StartedWorking' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('Complete')} disabled={isChangingStatus} className={cn('h-7 text-xs', isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200')}>
                    <Check className="w-3 h-3 mr-1" />Complete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('Cancel')} disabled={isChangingStatus} className={cn('h-7 text-xs', isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200')}>
                    <X className="w-3 h-3 mr-1" />Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {canEdit && onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(id)} className={cn('h-8 w-8 p-0 flex-shrink-0', isDark ? 'text-red-300 hover:text-red-200 hover:bg-red-500/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50')}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isExpanded && attachments.length > 0 && (
        <div className={cn('px-4 pb-4 pt-4', isDark ? 'border-t border-amber-500/20' : 'border-t border-gray-200')}>
          <h5 className={cn('text-xs font-medium mb-3', isDark ? 'text-amber-200/90' : 'text-slate-700')}>Attachments:</h5>
          <AttachmentGrid attachments={attachments} showDelete={canEdit} />
        </div>
      )}
    </div>
  );
}

