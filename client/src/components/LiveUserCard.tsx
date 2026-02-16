import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

export interface LiveUser {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  roleName: string;
  sessionDurationHours: number;
  sessionStartedAt: string | null;
  assignedConversationsCount: number;
  lastOnlineAt: string | null;
}

function formatSessionHours(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getRoleAbbrev(role: string): string {
  const map: Record<string, string> = {
    SuperAdmin: 'SAD',
    Admin: 'ADM',
    Manager: 'MGR',
    Employee: 'EMP',
    Client: 'CLI',
  };
  return map[role] || role.slice(0, 3).toUpperCase();
}

interface LiveUserCardProps {
  user: LiveUser;
  index: number;
  onClick?: () => void;
}

export function LiveUserCard({ user, index, onClick }: LiveUserCardProps) {
  const displayName = user.name || user.email.split('@')[0];
  const initials = displayName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // FIFA-style "Overall" score: 70-99 based on session + activity
  const ovrScore = Math.min(99, Math.max(70, 70 + Math.floor(user.sessionDurationHours * 3) + Math.min(20, user.assignedConversationsCount)));
  const roleAbbrev = getRoleAbbrev(user.roleName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full max-w-[200px] overflow-visible text-left cursor-pointer',
        'transition-all duration-300 hover:scale-[1.05] hover:rotate-[-0.5deg] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
      )}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Shield-shaped card - FIFA style */}
      <div
        className={cn(
          'relative overflow-hidden',
          'animate-in fade-in slide-in-from-bottom-4 duration-500',
          'group-hover:shadow-[0_0_24px_rgba(217,119,6,0.35),0_0_0_2px_rgba(217,119,6,0.7)] transition-shadow duration-300',
        )}
        style={{
          clipPath: 'polygon(0% 8%, 5% 0%, 95% 0%, 100% 8%, 100% 92%, 95% 100%, 5% 100%, 0% 92%)',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 35%, #0c0a1a 70%, #1e1b4b 100%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 0 2px rgba(217,119,6,0.6), 0 0 20px -2px rgba(217,119,6,0.25), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.3)',
        }}
      >
        {/* Corner accents - game card frame */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-amber-500/60 rounded-tl" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-amber-500/60 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-amber-500/40 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-amber-500/40 rounded-br" />
        {/* Golden border glow - shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: 'polygon(0% 8%, 5% 0%, 95% 0%, 100% 8%, 100% 92%, 95% 100%, 5% 100%, 0% 92%)',
            background: 'linear-gradient(90deg, transparent 0%, rgba(217,119,6,0.1) 20%, rgba(217,119,6,0.4) 50%, rgba(217,119,6,0.1) 80%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'game-shimmer 4s ease-in-out infinite',
          }}
        />

        {/* Top-left: OVR Score (97 style) - pop-in */}
        <div className="absolute left-2 top-1.5 z-10" style={{ animation: 'game-score-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', animationDelay: `${index * 80 + 200}ms`, animationFillMode: 'both' }}>
          <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-game-glow">
            {ovrScore}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
            {roleAbbrev}
          </div>
        </div>

        {/* Top-right: LIVE crest/badge - pulse */}
        <div className="absolute right-2 top-1.5 z-10 flex items-center gap-1 rounded bg-emerald-600/90 px-1.5 py-0.5 animate-game-badge-pulse">
          <span className="relative flex h-1 w-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-white" />
          </span>
          <span className="text-[9px] font-bold text-white">LIVE</span>
        </div>

        {/* Background effects - trophy/gem glow like FIFA */}
        <div
          className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-blue-500/30 blur-xl"
          style={{ animation: 'pulse 2.5s ease-in-out infinite 0.5s' }}
        />
        <div className="absolute left-1/2 top-12 h-20 w-20 -translate-x-1/2 rounded-full border border-amber-500/20 bg-amber-500/5" />
        <div className="absolute left-1/2 top-14 h-16 w-16 -translate-x-1/2 rounded-full border border-amber-500/10" />

        {/* Avatar - centered, overlaps frame - subtle float */}
        <div className="relative flex justify-center pt-6 pb-2 animate-game-float" style={{ animationDelay: `${index * 80 + 300}ms` }}>
          <div className="relative group-hover:scale-110 transition-transform duration-300">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={displayName}
                className="h-20 w-20 rounded-full border-2 border-amber-500/50 object-cover shadow-lg ring-2 ring-amber-400/20"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800 text-2xl font-bold text-white shadow-lg ring-2 ring-amber-400/20">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Player name - subtle fade */}
        <div className="px-2 pb-2 text-center animate-game-stat-reveal" style={{ animationDelay: `${index * 80 + 350}ms`, animationFillMode: 'both' }}>
          <h3 className="truncate text-sm font-bold text-white drop-shadow-sm">
            {displayName}
          </h3>
        </div>

        {/* Stats section - 6 stats like FIFA - staggered reveal */}
        <div className="grid grid-cols-3 gap-x-1 gap-y-1 px-2 pb-2">
          {[
            { label: 'Session', val: Math.min(99, Math.round(user.sessionDurationHours * 10)), color: 'text-white' },
            { label: 'Messages', val: user.assignedConversationsCount, color: 'text-white' },
            { label: 'Hours', val: Math.min(99, Math.floor(user.sessionDurationHours)), color: 'text-white' },
            { label: 'Activity', val: ovrScore, color: 'text-amber-400' },
            { label: 'Inbox', val: user.assignedConversationsCount, color: 'text-white' },
            { label: 'Online', val: '99', color: 'text-emerald-400' },
          ].map((s, i) => (
          <div
            key={s.label}
            className="text-center animate-game-stat-reveal"
            style={{ animationDelay: `${index * 80 + 400 + i * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="text-[9px] font-medium text-amber-300/95 leading-tight truncate" title={s.label}>{s.label}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
          </div>
          ))}
        </div>

        {/* Bottom accent - like nationality flag area */}
        <div className="flex justify-center border-t border-amber-500/25 px-2 py-1">
          <div className="flex items-center gap-1 rounded bg-amber-500/25 px-2 py-0.5 transition-all duration-300 group-hover:bg-amber-500/35 group-hover:scale-105">
            <Clock className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-[11px] font-semibold text-amber-100">
              {formatSessionHours(user.sessionDurationHours)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
