import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { workSessionApi, type WorkSession } from '@/lib/workSession';
import { Clock, Calendar } from 'lucide-react';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function WorkTimeline() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['work-session-history'],
    queryFn: () => workSessionApi.getWorkHistory(7),
    refetchInterval: 60000,
  });

  const { data: current } = useQuery({
    queryKey: ['work-session-status'],
    queryFn: () => workSessionApi.getCurrentSession(),
    refetchInterval: 60000,
  });

  if (isLoading || !history) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Work Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayStats = history.dailyStats.find((d) => d.date === todayKey);
  const todayTotal = todayStats?.duration ?? 0;
  const currentSession = current?.session;

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Work Timeline
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          When you were active and how long you worked
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Today:</span>
            <strong>{formatDuration(todayTotal)}</strong>
          </div>
          {currentSession && current?.isOnline && (
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live now</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Recent sessions</h4>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {history.sessions.length === 0 ? (
              <li className="text-sm text-slate-500">No sessions in the last 7 days</li>
            ) : (
              history.sessions.map((s: WorkSession) => (
                <li
                  key={s.id}
                  className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">{formatDateTime(s.startTime)}</span>
                    {s.duration != null ? (
                      <span className="font-medium">{formatDuration(s.duration)}</span>
                    ) : (
                      <span className="text-green-600 text-xs">In progress</span>
                    )}
                  </div>
                  {s.endTime && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Ended {formatDateTime(s.endTime)}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>

        {history.dailyStats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">By day</h4>
            <ul className="space-y-1 text-sm">
              {history.dailyStats
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 7)
                .map((d) => (
                  <li key={d.date} className="flex justify-between">
                    <span className="text-slate-600">{formatDate(d.date)}</span>
                    <span className="font-medium">{formatDuration(d.duration)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
