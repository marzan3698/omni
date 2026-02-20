import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { callApi, employeeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phone,
  Filter,
  X,
  Clock,
  User,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, isUpcomingSoon } from '@/hooks/useScheduleHelpers';
import { LiveCountdownBadge } from '@/components/LiveCountdownBadge';
import type { LeadCall } from '@/types';

export function CallSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await employeeApi.getAll(user.companyId);
      return (response.data.data as any[]) || [];
    },
    enabled: !!user?.companyId,
  });

  const { data: callsResponse, isLoading } = useQuery({
    queryKey: ['calls', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.assignedTo) params.assignedTo = parseInt(filters.assignedTo);
      const response = await callApi.getAll(params);
      return (response.data.data as LeadCall[]) || [];
    },
    refetchInterval: 60000,
  });

  const { data: allCallsForStats = [] } = useQuery({
    queryKey: ['calls-stats'],
    queryFn: async () => {
      const response = await callApi.getAll({});
      return (response.data.data as LeadCall[]) || [];
    },
    refetchInterval: 60000,
  });

  const calls = callsResponse || [];
  const upcomingCount = allCallsForStats.filter((c: any) => c.status === 'Scheduled').length;
  const upcomingSoonCount = allCallsForStats.filter(
    (c: any) => c.status === 'Scheduled' && isUpcomingSoon(c.callTime, 60)
  ).length;
  const completedCount = allCallsForStats.filter((c: any) => c.status === 'Completed').length;

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', assignedTo: '' });
  };
  const hasActiveFilters =
    filters.status !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.assignedTo !== '';

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <Phone className="h-8 w-8 text-amber-400" />
            Call Schedule
          </h1>
          <p className="text-amber-200/80 mt-1">View and manage all scheduled calls</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GameCard index={0} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Upcoming</p>
              <p className="text-2xl font-bold text-amber-100 mt-1">{upcomingCount}</p>
              <p className="text-xs text-amber-200/60 mt-0.5">scheduled</p>
            </div>
            <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10">
              <Phone className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={1} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Starting Soon
              </p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{upcomingSoonCount}</p>
              <p className="text-xs text-amber-200/60 mt-0.5">within 1 hour</p>
            </div>
            <div className="p-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 schedule-live-badge">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </GameCard>
        <GameCard index={2} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-200/70 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{completedCount}</p>
              <p className="text-xs text-amber-200/60 mt-0.5">calls</p>
            </div>
            <div className="p-3 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <User className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </GameCard>
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-amber-500/20">
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
              <div>
                <Label className="text-amber-200/90">Assigned To</Label>
                <select value={filters.assignedTo} onChange={(e) => handleFilterChange('assignedTo', e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-md ${inputDark}`}>
                  <option value="">All</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.email || emp.user?.name || `Employee ${emp.id}`}
                    </option>
                  ))}
                </select>
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
          <h2 className="text-lg font-semibold text-amber-100 mb-4">All Calls ({calls.length})</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-16 text-amber-200/70">
              <Phone className="w-16 h-16 mx-auto mb-4 text-amber-500/40" />
              <p>No calls found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calls.map((call: any, index: number) => (
                <CallGridCard
                  key={call.id}
                  call={call}
                  index={index}
                  getStatusStyle={getStatusStyle}
                  onNavigate={() => navigate(`/leads/${call.leadId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </GamePanel>
    </div>
  );
}

function CallGridCard({
  call,
  index,
  getStatusStyle,
  onNavigate,
}: {
  call: any;
  index: number;
  getStatusStyle: (s: string) => string;
  onNavigate: () => void;
}) {
  const isSoon = call.status === 'Scheduled' && isUpcomingSoon(call.callTime, 60);

  return (
    <GameCard index={index} className={cn(isSoon && 'schedule-card-upcoming border-emerald-500/40')}>
      <div className="p-4 cursor-pointer h-full flex flex-col" onClick={onNavigate}>
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
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-amber-200/80">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{formatDateTime(call.callTime)}</span>
          </div>
          {call.assignedEmployee && (
            <div className="flex items-center gap-2 text-amber-200/80">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs">{call.assignedEmployee.user?.email || call.assignedEmployee.user?.name}</span>
            </div>
          )}
          {call.lead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1"
            >
              {call.lead.title}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {call.phoneNumber && (
            <a
              href={`tel:${call.phoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {call.phoneNumber}
            </a>
          )}
        </div>
        <div className="mt-auto pt-3 border-t border-amber-500/10 flex items-center justify-between gap-2">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getStatusStyle(call.status))}>
            {call.status}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="text-xs h-6 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
          >
            <Phone className="w-3 h-3 mr-1" />View Lead
          </Button>
        </div>
      </div>
    </GameCard>
  );
}
