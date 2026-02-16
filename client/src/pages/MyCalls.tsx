import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { callApi, leadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phone,
  Filter,
  X,
  Clock,
  User,
  Eye,
  FileText,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, isUpcomingSoon } from '@/hooks/useScheduleHelpers';
import { LiveCountdownBadge } from '@/components/LiveCountdownBadge';
import type { LeadCall, LeadCallStatus } from '@/types';

export function MyCalls() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [editingCallNote, setEditingCallNote] = useState<{ callId: number; note: string } | null>(null);
  const [editingCallStatus, setEditingCallStatus] = useState<{ callId: number; status: LeadCallStatus } | null>(null);

  const { data: callsResponse, isLoading } = useQuery({
    queryKey: ['my-calls', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await callApi.getAll(params);
      return (response.data.data as LeadCall[]) || [];
    },
    refetchInterval: 60000,
  });

  const calls = callsResponse || [];

  const addCallNoteMutation = useMutation({
    mutationFn: async ({ callId, note, leadId }: { callId: number; note: string; leadId: number }) => {
      if (!user?.companyId) throw new Error('Company ID is required');
      const response = await leadApi.addCallNote(leadId, callId, note, user.companyId);
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calls', filters] });
      setEditingCallNote(null);
    },
  });

  const updateCallStatusMutation = useMutation({
    mutationFn: async ({ callId, status, leadId }: { callId: number; status: LeadCallStatus; leadId: number }) => {
      if (!user?.companyId) throw new Error('Company ID is required');
      const response = await leadApi.updateCall(leadId, callId, { status }, user.companyId);
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calls', filters] });
      setEditingCallStatus(null);
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
      case 'NoAnswer':
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40';
      case 'Busy':
        return 'bg-orange-500/20 text-orange-200 border-orange-500/40';
      case 'LeftVoicemail':
        return 'bg-purple-500/20 text-purple-200 border-purple-500/40';
      default:
        return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    }
  };

  const btnOutline =
    'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';
  const upcomingSoonCount = calls.filter(
    (c: any) => c.status === 'Scheduled' && isUpcomingSoon(c.callTime, 60)
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <Phone className="h-8 w-8 text-amber-400" />
            My Calls
          </h1>
          <p className="text-amber-200/80 mt-1">View and manage your assigned calls</p>
        </div>
      </div>

      {upcomingSoonCount > 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 schedule-live-badge">
          <Zap className="h-6 w-6 text-emerald-400" />
          <span className="text-emerald-200 font-medium">
            {upcomingSoonCount} call{upcomingSoonCount !== 1 ? 's' : ''} starting within 1 hour
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
                  <option value="NoAnswer">No Answer</option>
                  <option value="Busy">Busy</option>
                  <option value="LeftVoicemail">Left Voicemail</option>
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
          <h2 className="text-lg font-semibold text-amber-100 mb-4">My Assigned Calls ({calls.length})</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-16 text-amber-200/70">
              <Phone className="w-16 h-16 mx-auto mb-4 text-amber-500/40" />
              <p>No calls assigned to you</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calls.map((call: any, index: number) => (
                <MyCallGridCard
                  key={call.id}
                  call={call}
                  index={index}
                  getStatusStyle={getStatusStyle}
                  editingCallNote={editingCallNote}
                  setEditingCallNote={setEditingCallNote}
                  editingCallStatus={editingCallStatus}
                  setEditingCallStatus={setEditingCallStatus}
                  addCallNote={addCallNoteMutation.mutate}
                  updateCallStatus={updateCallStatusMutation.mutate}
                  isUpdating={addCallNoteMutation.isPending || updateCallStatusMutation.isPending}
                  onNavigate={() => call.lead && navigate(`/leads/${call.lead.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </GamePanel>
    </div>
  );
}

function MyCallGridCard({
  call,
  index,
  getStatusStyle,
  editingCallNote,
  setEditingCallNote,
  editingCallStatus,
  setEditingCallStatus,
  addCallNote,
  updateCallStatus,
  isUpdating,
  onNavigate,
}: {
  call: any;
  index: number;
  getStatusStyle: (s: string) => string;
  editingCallNote: { callId: number; note: string } | null;
  setEditingCallNote: (v: { callId: number; note: string } | null) => void;
  editingCallStatus: { callId: number; status: LeadCallStatus } | null;
  setEditingCallStatus: (v: { callId: number; status: LeadCallStatus } | null) => void;
  addCallNote: (v: any) => void;
  updateCallStatus: (v: any) => void;
  isUpdating: boolean;
  onNavigate: () => void;
}) {
  const isSoon = call.status === 'Scheduled' && isUpcomingSoon(call.callTime, 60);
  const isEditingDesc = editingCallNote?.callId === call.id;
  const isEditingStat = editingCallStatus?.callId === call.id;
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  return (
    <GameCard index={index} className={cn(isSoon && 'schedule-card-upcoming border-emerald-500/40')}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-amber-100 line-clamp-2 flex-1">{call.title || '-'}</h3>
          {isSoon && (
            <LiveCountdownBadge
              date={call.callTime}
              enabled
              showTimerWhenSoon
              className="shrink-0"
            />
          )}
        </div>
        <div className="space-y-2 text-sm mb-3">
          <div className="flex items-center gap-2 text-amber-200/80">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{formatDateTime(call.callTime)}</span>
          </div>
          {call.lead && (
            <button onClick={onNavigate} className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1">
              {call.lead.title}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {call.phoneNumber && (
            <a
              href={`tel:${call.phoneNumber}`}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {call.phoneNumber}
            </a>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-amber-500/10">
          {isEditingDesc ? (
            <div className="space-y-2">
              <Textarea
                value={editingCallNote!.note}
                onChange={(e) => setEditingCallNote({ callId: call.id, note: e.target.value })}
                placeholder="Add call notes..."
                className={`text-sm min-h-[60px] ${inputDark}`}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (editingCallNote!.note.trim() && call.leadId) {
                      addCallNote({
                        callId: call.id,
                        note: editingCallNote!.note,
                        leadId: call.leadId,
                      });
                    } else setEditingCallNote(null);
                  }}
                  disabled={isUpdating}
                  className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 text-xs"
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingCallNote(null)} className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {call.notes ? (
                <p className="text-sm text-amber-200/80 line-clamp-2">{call.notes}</p>
              ) : (
                <span className="text-amber-200/50 text-sm">No notes</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCallNote({ callId: call.id, note: call.notes || '' })}
                className="text-xs h-6 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
              >
                <FileText className="w-3 h-3 mr-1" />
                {call.notes ? 'Edit' : 'Add'} Note
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center justify-between gap-2 flex-wrap">
          {isEditingStat ? (
            <select
              value={editingCallStatus!.status}
              onChange={(e) => setEditingCallStatus({ callId: call.id, status: e.target.value as LeadCallStatus })}
              onBlur={() => {
                if (editingCallStatus!.status !== call.status && call.leadId) {
                  updateCallStatus({
                    callId: call.id,
                    status: editingCallStatus!.status,
                    leadId: call.leadId,
                  });
                } else setEditingCallStatus(null);
              }}
              className={`text-xs px-2 py-1 rounded ${inputDark} border-amber-500/30`}
              autoFocus
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
              <option value="NoAnswer">No Answer</option>
              <option value="Busy">Busy</option>
              <option value="LeftVoicemail">Left Voicemail</option>
            </select>
          ) : (
            <button
              onClick={() => setEditingCallStatus({ callId: call.id, status: call.status })}
              className={cn('px-2 py-0.5 rounded text-xs font-medium border cursor-pointer', getStatusStyle(call.status))}
              title="Click to change"
            >
              {call.status}
            </button>
          )}
          {call.lead && (
            <Button variant="ghost" size="sm" onClick={onNavigate} className="text-xs h-6 px-2 text-amber-400 hover:text-amber-300">
              <Eye className="w-3 h-3 mr-1" />Lead
            </Button>
          )}
        </div>
      </div>
    </GameCard>
  );
}
