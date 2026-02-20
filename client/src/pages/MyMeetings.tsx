import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { meetingApi, leadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Filter,
  X,
  Clock,
  Eye,
  FileText,
  ExternalLink,
  Video,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, isUpcomingSoon } from '@/hooks/useScheduleHelpers';
import { LiveCountdownBadge } from '@/components/LiveCountdownBadge';
import type { LeadMeeting, LeadMeetingStatus } from '@/types';

export function MyMeetings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [editingDescription, setEditingDescription] = useState<{
    meetingId: number;
    description: string;
  } | null>(null);
  const [editingStatus, setEditingStatus] = useState<{
    meetingId: number;
    status: LeadMeetingStatus;
  } | null>(null);

  const { data: meetingsResponse, isLoading } = useQuery({
    queryKey: ['my-meetings', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await meetingApi.getAll(params);
      return (response.data.data as LeadMeeting[]) || [];
    },
    refetchInterval: 60000,
  });

  const meetings = meetingsResponse || [];

  const updateMeetingMutation = useMutation({
    mutationFn: async ({
      leadId,
      meetingId,
      data,
    }: {
      leadId: number;
      meetingId: number;
      data: { description?: string; status?: LeadMeetingStatus };
    }) => {
      if (!user?.companyId) throw new Error('Company ID is required');
      const response = await leadApi.updateMeeting(leadId, meetingId, data, user.companyId);
      return response.data.data as LeadMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-meetings', filters] });
      setEditingDescription(null);
      setEditingStatus(null);
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const clearFilters = () => setFilters({ status: '', startDate: '', endDate: '' });
  const hasActiveFilters =
    filters.status !== '' || filters.startDate !== '' || filters.endDate !== '';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
      case 'Canceled':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    }
  };

  const btnOutline =
    'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';
  const upcomingSoonCount = meetings.filter(
    (m: any) => m.status === 'Scheduled' && isUpcomingSoon(m.meetingTime, 60)
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <Video className="h-8 w-8 text-amber-400" />
            My Meetings
          </h1>
          <p className="text-amber-200/80 mt-1">View and manage your assigned meetings</p>
        </div>
      </div>

      {upcomingSoonCount > 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 schedule-live-badge">
          <Zap className="h-6 w-6 text-emerald-400" />
          <span className="text-emerald-200 font-medium">
            {upcomingSoonCount} meeting{upcomingSoonCount !== 1 ? 's' : ''} starting within 1 hour
          </span>
        </div>
      )}

      <GamePanel>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
              <Filter className="h-5 w-5 text-amber-400" />
              Filters
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={btnOutline}>
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-amber-500/20">
              <div>
                <Label className="text-amber-200/90">Status</Label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-md ${inputDark}`}>
                  <option value="">All</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div>
                <Label className="text-amber-200/90">Start Date</Label>
                <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className={inputDark} />
              </div>
              <div>
                <Label className="text-amber-200/90">End Date</Label>
                <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className={inputDark} />
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className={btnOutline}>
                    <X className="w-4 h-4 mr-2" />Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </GamePanel>

      <GamePanel>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-amber-100 mb-4">My Assigned Meetings ({meetings.length})</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse" />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-16 text-amber-200/70">
              <Video className="w-16 h-16 mx-auto mb-4 text-amber-500/40" />
              <p>No meetings assigned to you</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((meeting: any, index: number) => (
                <MyMeetingGridCard
                  key={meeting.id}
                  meeting={meeting}
                  index={index}
                  getStatusStyle={getStatusStyle}
                  editingDescription={editingDescription}
                  setEditingDescription={setEditingDescription}
                  editingStatus={editingStatus}
                  setEditingStatus={setEditingStatus}
                  updateMeeting={updateMeetingMutation.mutate}
                  isUpdating={updateMeetingMutation.isPending}
                  onNavigate={() => meeting.lead && navigate(`/leads/${meeting.lead.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </GamePanel>
    </div>
  );
}

function MyMeetingGridCard({
  meeting,
  index,
  getStatusStyle,
  editingDescription,
  setEditingDescription,
  editingStatus,
  setEditingStatus,
  updateMeeting,
  isUpdating,
  onNavigate,
}: {
  meeting: any;
  index: number;
  getStatusStyle: (s: string) => string;
  editingDescription: { meetingId: number; description: string } | null;
  setEditingDescription: (v: { meetingId: number; description: string } | null) => void;
  editingStatus: { meetingId: number; status: LeadMeetingStatus } | null;
  setEditingStatus: (v: { meetingId: number; status: LeadMeetingStatus } | null) => void;
  updateMeeting: (v: any) => void;
  isUpdating: boolean;
  onNavigate: () => void;
}) {
  const isSoon = meeting.status === 'Scheduled' && isUpcomingSoon(meeting.meetingTime, 60);
  const isEditingDesc = editingDescription?.meetingId === meeting.id;
  const isEditingStat = editingStatus?.meetingId === meeting.id;
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  return (
    <GameCard index={index} className={cn(isSoon && 'schedule-card-upcoming border-emerald-500/40')}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-amber-100 line-clamp-2 flex-1">{meeting.title || '-'}</h3>
          {isSoon && (
            <LiveCountdownBadge
              date={meeting.meetingTime}
              enabled
              showTimerWhenSoon
              className="shrink-0"
            />
          )}
        </div>
        <div className="space-y-2 text-sm mb-3">
          <div className="flex items-center gap-2 text-amber-200/80">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{formatDateTime(meeting.meetingTime)}</span>
          </div>
          <span className="text-amber-200/70">{meeting.durationMinutes} min</span>
          {meeting.lead && (
            <button onClick={onNavigate} className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1">
              {meeting.lead.title}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="mt-auto pt-3 border-t border-amber-500/10">
          {isEditingDesc ? (
            <div className="space-y-2">
              <Textarea
                value={editingDescription.description}
                onChange={(e) => setEditingDescription({ meetingId: meeting.id, description: e.target.value })}
                placeholder="Add meeting notes..."
                className={`text-sm min-h-[60px] ${inputDark}`}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (meeting.leadId) {
                      updateMeeting({
                        leadId: meeting.leadId,
                        meetingId: meeting.id,
                        data: { description: editingDescription.description },
                      });
                    } else setEditingDescription(null);
                  }}
                  disabled={isUpdating}
                  className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 text-xs"
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingDescription(null)} className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {meeting.description ? (
                <p className="text-sm text-amber-200/80 line-clamp-2">{meeting.description}</p>
              ) : (
                <span className="text-amber-200/50 text-sm">No notes</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDescription({ meetingId: meeting.id, description: meeting.description || '' })}
                className="text-xs h-6 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
              >
                <FileText className="w-3 h-3 mr-1" />
                {meeting.description ? 'Edit' : 'Add'} Note
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center justify-between gap-2 flex-wrap">
          {isEditingStat ? (
            <select
              value={editingStatus!.status}
              onChange={(e) => setEditingStatus({ meetingId: meeting.id, status: e.target.value as LeadMeetingStatus })}
              onBlur={() => {
                if (editingStatus!.status !== meeting.status && meeting.leadId) {
                  updateMeeting({
                    leadId: meeting.leadId,
                    meetingId: meeting.id,
                    data: { status: editingStatus!.status },
                  });
                } else setEditingStatus(null);
              }}
              className={`text-xs px-2 py-1 rounded ${inputDark} border-amber-500/30`}
              autoFocus
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
            </select>
          ) : (
            <button
              onClick={() => setEditingStatus({ meetingId: meeting.id, status: meeting.status })}
              className={cn('px-2 py-0.5 rounded text-xs font-medium border cursor-pointer', getStatusStyle(meeting.status))}
              title="Click to change"
            >
              {meeting.status}
            </button>
          )}
          <div className="flex gap-1">
            {meeting.meetingLink && meeting.status === 'Scheduled' && (
              <a
                href={meeting.platform.toLowerCase() === 'offline' ? undefined : meeting.meetingLink.startsWith('http') ? meeting.meetingLink : `https://${meeting.meetingLink}`}
                target={meeting.platform.toLowerCase() === 'offline' ? undefined : "_blank"}
                rel={meeting.platform.toLowerCase() === 'offline' ? undefined : "noopener noreferrer"}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded",
                  meeting.platform.toLowerCase() === 'offline' ? "text-amber-200/80 cursor-default" : "text-amber-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                )}
                title={meeting.meetingLink}
              >
                {meeting.platform.toLowerCase() === 'offline' ? <Eye className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                {meeting.platform.toLowerCase() === 'offline' ? 'Offline' : 'Join'}
              </a>
            )}
            {meeting.lead && (
              <Button variant="ghost" size="sm" onClick={onNavigate} className="text-xs h-6 px-2 text-amber-400 hover:text-amber-300">
                <Eye className="w-3 h-3 mr-1" />Lead
              </Button>
            )}
          </div>
        </div>
      </div>
    </GameCard>
  );
}
