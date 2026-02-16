import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { X, Clock, MessageSquare, Activity, BarChart3, Mail, User, Monitor } from 'lucide-react';
import type { LiveUser } from './LiveUserCard';

export interface LiveUserDetail {
  user: LiveUser;
  workHistory: {
    sessions: { id: number; startTime: string; endTime: string | null; duration: number | null }[];
    totalDuration: number;
    dailyStats: { date: string; duration: number }[];
  };
  activityToday: {
    totalActiveMinutes: number;
    avgActivityScore: number;
    activityByBlock: { blockStart: string; score: number; label: string }[];
    screenshotCount: number;
  } | null;
}

interface LiveUserDetailModalProps {
  user: LiveUser | null;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function blockColor(score: number): string {
  if (score === 0) return 'bg-slate-600';
  if (score <= 20) return 'bg-red-500';
  if (score <= 50) return 'bg-amber-500';
  if (score <= 80) return 'bg-emerald-500';
  return 'bg-emerald-400';
}

export function LiveUserDetailModal({ user, onClose }: LiveUserDetailModalProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['live-user-detail', user?.id],
    queryFn: () => adminApi.getLiveUserDetail(user!.id),
    enabled: !!user?.id,
  });

  const detail = response?.data?.data as LiveUserDetail | undefined;
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-game-overlay-fade"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 animate-game-modal-bounce"
        style={{
          clipPath: 'polygon(0% 2%, 2% 0%, 98% 0%, 100% 2%, 100% 98%, 98% 100%, 2% 100%, 0% 98%)',
          background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 30%, #0c0a1a 70%, #1e1b4b 100%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 0 2px rgba(217,119,6,0.6), 0 0 40px -8px rgba(217,119,6,0.3), 0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Corner frame accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-amber-500/60 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-amber-500/60 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-amber-500/40 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-amber-500/40 rounded-br-lg" />
        {/* Golden accent line - shimmer */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-game-glow" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 p-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800 text-xl font-bold text-white animate-game-float"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-sm text-amber-200/90">{user.roleName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 animate-game-badge-pulse">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-xs font-bold text-white">LIVE</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-amber-200 hover:text-white hover:bg-amber-500/20 hover:scale-110 transition-all duration-200">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
              <span className="text-sm text-amber-200/70 animate-pulse">Loading player stats...</span>
            </div>
          ) : !detail ? (
            <div className="py-16 text-center text-amber-200/80">Failed to load details</div>
          ) : (
            <>
              {/* Quick Stats - FIFA style stat boxes - staggered reveal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Session',
                    value: formatDuration(Math.round(detail.user.sessionDurationHours * 3600)),
                    icon: Clock,
                    colorClass: 'text-amber-400',
                  },
                  {
                    label: 'Assigned',
                    value: detail.user.assignedConversationsCount,
                    icon: MessageSquare,
                    colorClass: 'text-emerald-400',
                  },
                  {
                    label: 'Total (7d)',
                    value: formatDuration(detail.workHistory.totalDuration),
                    icon: BarChart3,
                    colorClass: 'text-blue-400',
                  },
                  {
                    label: 'Activity',
                    value: detail.activityToday
                      ? `${detail.activityToday.avgActivityScore}%`
                      : 'N/A',
                    icon: Activity,
                    colorClass: 'text-indigo-400',
                  },
                ].map((stat, statIdx) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-4 backdrop-blur animate-game-stat-reveal hover:border-amber-500/40 transition-colors duration-300"
                      style={{ animationDelay: `${statIdx * 100}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Icon className="h-3.5 w-3.5" />
                        {stat.label}
                      </div>
                      <div className={`text-lg font-bold ${stat.colorClass}`}>
                        {String(stat.value)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Sessions list - when we have sessions */}
              {detail.workHistory.sessions.length > 0 && (
                <div
                  className="rounded-xl border border-amber-500/20 bg-slate-800/40 p-4 backdrop-blur animate-game-stat-reveal"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(217,119,6,0.1)', animationDelay: '350ms', animationFillMode: 'both' }}
                >
                  <h3 className="text-sm font-semibold text-amber-200/90 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Sessions
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {detail.workHistory.sessions
                      .slice(0, 5)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2 border border-slate-600/30"
                        >
                          <span className="text-xs text-slate-400">
                            {new Date(s.startTime).toLocaleDateString()} · {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs font-medium text-amber-300">
                            {s.duration != null ? formatDuration(s.duration) : 'Active'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Work History Chart - 7 days */}
              <div
                className="rounded-xl border border-amber-500/20 bg-slate-800/40 p-4 backdrop-blur animate-game-stat-reveal"
                style={{ boxShadow: 'inset 0 1px 0 rgba(217,119,6,0.1)', animationDelay: '400ms', animationFillMode: 'both' }}
              >
                <h3 className="text-sm font-semibold text-amber-200/90 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Work Hours (Last 7 Days)
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {detail.workHistory.dailyStats.length === 0 ? (
                    <div className="flex-1 text-slate-500 text-sm py-8 flex items-center justify-center rounded-lg bg-slate-900/30 border border-slate-600/20">
                      No daily stats yet
                    </div>
                  ) : (
                    [...detail.workHistory.dailyStats]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((day, barIdx) => {
                        const maxDur = Math.max(
                          ...detail.workHistory.dailyStats.map((d) => d.duration),
                          1
                        );
                        const pct = (day.duration / maxDur) * 100;
                        return (
                          <div
                            key={day.date}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div
                              className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-500 animate-game-bar-fill"
                              style={{
                                height: `${Math.max(8, pct)}%`,
                                minHeight: '20px',
                                animationDelay: `${500 + barIdx * 80}ms`,
                                animationFillMode: 'both',
                              }}
                            />
                            <div className="text-[10px] text-slate-500 truncate max-w-full">
                              {formatDate(day.date)}
                            </div>
                            <div className="text-xs font-medium text-amber-300">
                              {formatDuration(day.duration)}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Activity Today - chart or empty state */}
              <div
                className="rounded-xl border border-amber-500/20 bg-slate-800/40 p-4 backdrop-blur animate-game-stat-reveal"
                style={{ boxShadow: 'inset 0 1px 0 rgba(217,119,6,0.1)', animationDelay: '600ms', animationFillMode: 'both' }}
              >
                <h3 className="text-sm font-semibold text-amber-200/90 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Today
                </h3>
                {detail.activityToday && detail.activityToday.activityByBlock?.length > 0 ? (
                  (() => {
                    const blocks = detail.activityToday!.activityByBlock;
                    const hourlyData: { hour: number; score: number; label: string }[] = [];
                    for (let h = 0; h < 24; h++) {
                      const start = h * 6;
                      const slice = blocks.slice(start, start + 6);
                      const avgScore = slice.length > 0
                        ? Math.round(slice.reduce((s, b) => s + b.score, 0) / slice.length)
                        : 0;
                      hourlyData.push({ hour: h, score: avgScore, label: `${h}:00` });
                    }
                    const maxScore = Math.max(...hourlyData.map((b) => b.score), 1);
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">
                          {detail.activityToday!.totalActiveMinutes} min active
                        </p>
                        <div className="flex items-end gap-1 h-24 overflow-x-auto">
                          {hourlyData.map((block, i) => (
                            <div
                              key={i}
                              className="flex-1 min-w-[20px] flex flex-col items-center gap-1"
                              title={`${block.label}: ${block.score}`}
                            >
                              <div
                                className={`w-full rounded-t animate-game-bar-fill ${blockColor(block.score)}`}
                                style={{
                                  height: `${Math.max(4, (block.score / maxScore) * 100)}%`,
                                  minHeight: '12px',
                                  animationDelay: `${700 + i * 40}ms`,
                                  animationFillMode: 'both',
                                }}
                              />
                              <span className="text-[8px] text-slate-500">
                                {block.hour % 3 === 0 ? block.label : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center py-10 rounded-lg bg-slate-900/30 border border-slate-600/20">
                    <p className="text-sm text-slate-500">No activity data today</p>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div
                className="rounded-xl border border-amber-500/20 bg-slate-800/40 p-4 backdrop-blur grid grid-cols-1 sm:grid-cols-2 gap-4 animate-game-stat-reveal"
                style={{ boxShadow: 'inset 0 1px 0 rgba(217,119,6,0.1)', animationDelay: '800ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-500/80" />
                  <div>
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="text-sm text-white">{detail.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-amber-500/80" />
                  <div>
                    <div className="text-xs text-slate-500">Role</div>
                    <div className="text-sm text-white">{detail.user.roleName}</div>
                  </div>
                </div>
                {detail.user.sessionStartedAt && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Clock className="h-4 w-4 text-amber-500/80" />
                    <div>
                      <div className="text-xs text-slate-500">Session Started</div>
                      <div className="text-sm text-white">
                        {new Date(detail.user.sessionStartedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Screenshots count if available */}
              {detail.activityToday && detail.activityToday.screenshotCount > 0 && (
                <div
                  className="rounded-xl border border-amber-500/20 bg-slate-800/40 p-4 backdrop-blur flex items-center gap-3 animate-game-stat-reveal"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(217,119,6,0.1)', animationDelay: '900ms', animationFillMode: 'both' }}
                >
                  <Monitor className="h-5 w-5 text-amber-500/80" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      {detail.activityToday.screenshotCount} screenshots today
                    </div>
                    <div className="text-xs text-slate-500">
                      Activity monitor captures
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
