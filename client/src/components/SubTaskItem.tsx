import { useState } from 'react';
import { Check, Circle, Clock, CheckCircle2, X, Play, ChevronDown, ChevronRight, Weight, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

const statusConfig = {
  Pending: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Pending' },
  StartedWorking: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Started Working' },
  Complete: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Complete' },
  Cancel: { icon: X, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Cancel' },
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
}: SubTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const StatusIcon = statusConfig[status].icon;

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

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white transition-all', className)}>
      {/* Sub-task header */}
      <div className="p-4 flex items-start gap-3">
        {/* Status icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
          statusConfig[status].bg,
          statusConfig[status].border
        )}>
          <StatusIcon className={cn('w-4 h-4', statusConfig[status].color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-900 flex-1">
              {order + 1}. {title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Weight indicator */}
              <Badge variant="outline" className="text-xs">
                <Weight className="w-3 h-3 mr-1" />
                {weight}x
              </Badge>
              
              {/* Status badge */}
              <Badge
                variant="outline"
                className={cn('text-xs', statusConfig[status].border)}
              >
                {statusConfig[status].label}
              </Badge>
            </div>
          </div>

          {/* Started/Completed timestamps */}
          {status === 'StartedWorking' && startedAt && (
            <p className="text-xs text-slate-500 mb-2">
              Started working at {formatBangladeshiDateTime(new Date(startedAt))}
            </p>
          )}
          {status === 'Complete' && completedAt && (
            <p className="text-xs text-slate-500 mb-2">
              Completed at {formatBangladeshiDateTime(new Date(completedAt))}
            </p>
          )}

          {/* Expand/Collapse instructions */}
          {instructions && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mb-2"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>{isExpanded ? 'Hide' : 'Show'} Instructions</span>
            </button>
          )}

          {/* Instructions (expanded) */}
          {isExpanded && instructions && (
            <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-700 whitespace-pre-wrap">
              {instructions}
            </div>
          )}

          {/* Attachments count */}
          {attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <Paperclip className="w-3 h-3" />
              <span>{attachments.length} attachment{attachments.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Status change buttons */}
          {canEdit && onStatusChange && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-600 self-center">Change Status:</span>
              
              {/* Pending tasks: Show only "Start Working" button */}
              {status === 'Pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('StartedWorking')}
                  disabled={isChangingStatus}
                  className="h-7 text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start Working
                </Button>
              )}

              {/* StartedWorking tasks: Show "Complete" and "Cancel" buttons */}
              {status === 'StartedWorking' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('Complete')}
                    disabled={isChangingStatus}
                    className="h-7 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('Cancel')}
                    disabled={isChangingStatus}
                    className="h-7 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Delete button (if can edit) */}
        {canEdit && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Attachments (expanded) */}
      {isExpanded && attachments.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <h5 className="text-xs font-medium text-slate-700 mb-3">Attachments:</h5>
          <AttachmentGrid
            attachments={attachments}
            showDelete={canEdit}
          />
        </div>
      )}
    </div>
  );
}

