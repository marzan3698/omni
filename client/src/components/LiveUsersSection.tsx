import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { LiveUserCard, type LiveUser } from '@/components/LiveUserCard';
import { LiveUserDetailModal } from '@/components/LiveUserDetailModal';
import { Users, Loader2 } from 'lucide-react';

export function LiveUsersSection() {
  const [selectedUser, setSelectedUser] = useState<LiveUser | null>(null);
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['live-users'],
    queryFn: () => adminApi.getLiveUsers(),
    refetchInterval: 10000,
  });

  const liveUsers: LiveUser[] = response?.data?.data ?? [];

  if (isError) return null;
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-amber-500/20 bg-slate-800/20 animate-game-overlay-fade">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          </div>
          <span className="text-sm text-amber-200/80 animate-pulse">Loading live users...</span>
        </div>
      </div>
    );
  }

  if (liveUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500 p-4 rounded-xl border-2 border-amber-500/25 bg-slate-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/30 p-2.5 border border-amber-500/40 animate-game-glow">
            <Users className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-amber-50">
            Live Users <span className="text-amber-300 font-bold">({liveUsers.length})</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {liveUsers.map((user, index) => (
            <LiveUserCard
              key={user.id}
              user={user}
              index={index}
              onClick={() => setSelectedUser(user)}
            />
          ))}
        </div>
      </div>
      {selectedUser && (
        <LiveUserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
