import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { activityApi, type EmployeeSummary } from '@/lib/activityApi';
import { GamePanel } from '@/components/GamePanel';
import { Monitor, Circle } from 'lucide-react';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function ActivityScoreBar({ score }: { score: number }) {
  const color =
    score <= 20 ? 'bg-red-500' : score <= 50 ? 'bg-amber-500' : score <= 80 ? 'bg-green-500' : 'bg-green-600';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className="text-xs text-amber-200/80 tabular-nums">{score}</span>
    </div>
  );
}

export default function ActivityMonitor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activity-employees', date],
    queryFn: async () => activityApi.getEmployeeSummaries(date),
    enabled: !!user,
  });

  const employees = (response?.data?.data ?? []) as EmployeeSummary[];

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div className="flex items-center gap-2">
          <Monitor className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-semibold text-amber-100">Activity Monitor</h1>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="activity-date" className="text-sm text-amber-200/80">Date</label>
          <input
            id="activity-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-amber-500/20 bg-slate-800/60 px-3 py-2 text-sm text-amber-100 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
        </div>
      </div>

      <GamePanel>
        <div className="p-6">
          <h2 className="text-base font-semibold text-amber-100">Employees</h2>
          <p className="text-sm text-amber-200/70 pt-2">Total active time, average activity score, and screenshot count for the selected date.</p>
          {isLoading ? (
            <div className="py-8 text-center text-amber-200/80">Loading...</div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-500/20 text-left text-amber-200/90">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Role</th>
                    <th className="pb-2 pr-4 font-medium">Active Time</th>
                    <th className="pb-2 pr-4 font-medium">Avg Score</th>
                    <th className="pb-2 pr-4 font-medium">Screenshots</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.userId}
                      onClick={() => navigate(`/activity-monitor/${emp.userId}?date=${date}`)}
                      className="border-b border-amber-500/10 hover:bg-amber-500/10 cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium text-amber-100">{emp.name ?? '—'}</td>
                      <td className="py-3 pr-4 text-amber-200/80">{emp.email}</td>
                      <td className="py-3 pr-4 text-amber-200/80">{emp.roleName}</td>
                      <td className="py-3 pr-4 text-amber-200/80 tabular-nums">
                        {formatMinutes(emp.totalActiveMinutes)}
                      </td>
                      <td className="py-3 pr-4">
                        <ActivityScoreBar score={emp.avgActivityScore} />
                      </td>
                      <td className="py-3 pr-4 text-amber-200/80 tabular-nums">{emp.screenshotCount}</td>
                      <td className="py-3">
                        <span className={cn('inline-flex items-center gap-1', emp.isOnline ? 'text-green-400' : 'text-amber-200/50')}>
                          <Circle
                            className={cn('w-2 h-2', emp.isOnline && 'fill-current')}
                          />
                          {emp.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employees.length === 0 && (
                <div className="py-8 text-center text-amber-200/70">No employees found for this date.</div>
              )}
            </div>
          )}
        </div>
      </GamePanel>
    </div>
  );
}
