import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { employeeGroupApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { X, Users, Calendar, User as UserIcon, Mail } from 'lucide-react';
import { GamePanel } from '@/components/GamePanel';

interface EmployeeGroupViewModalProps {
  groupId: number;
  onClose: () => void;
}

export function EmployeeGroupViewModal({ groupId, onClose }: EmployeeGroupViewModalProps) {
  const { user } = useAuth();

  const { data: group, isLoading, error } = useQuery({
    queryKey: ['employee-group-view', groupId, user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return null;
      const response = await employeeGroupApi.getById(groupId, user.companyId);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch employee group');
      }
      return response.data.data;
    },
    enabled: !!groupId && !!user?.companyId,
  });

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="game-panel rounded-xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col border border-amber-500/30">
        <div className="px-6 py-4 flex items-center justify-between border-b border-amber-500/20 bg-slate-900/95 shrink-0">
          <h2 className="text-xl font-semibold text-amber-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Group Details
          </h2>
          <button onClick={onClose} className="text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/20 rounded p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12 text-amber-200/80 animate-pulse">
              Loading group details...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
              <p className="font-medium">Error loading group</p>
              <p className="text-sm mt-1 opacity-90">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : group ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-amber-100 flex items-center gap-2">
                   {group.name}
                </h3>
                <p className="text-amber-200/80 text-sm bg-slate-800/40 p-3 rounded-lg border border-amber-500/10">
                  {group.description}
                </p>
              </div>

              {/* Meta Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-xl border border-amber-500/20">
                  <UserIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-200/60 uppercase tracking-wider font-semibold mb-1">Created By</p>
                    <p className="text-sm text-amber-100 font-medium">{group.creator?.name || 'Unknown'}</p>
                    <p className="text-xs text-amber-200/80">{group.creator?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-xl border border-amber-500/20">
                  <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-200/60 uppercase tracking-wider font-semibold mb-1">Created At</p>
                    <p className="text-sm text-amber-100 font-medium">
                      {new Date(group.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h4 className="text-lg font-semibold text-amber-100">
                    Members ({group.members?.length || 0})
                  </h4>
                </div>
                
                {group.members && group.members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.members.map((member: any) => (
                      <div key={member.employee.id} className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg border border-amber-500/10">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                           <UserIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-amber-100 truncate">
                            {member.employee.user.name || 'Unnamed Employee'}
                          </p>
                          <p className="text-xs text-amber-200/70 truncate">
                            {member.employee.user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-amber-200/60 bg-slate-800/30 rounded-lg border border-amber-500/10 border-dashed">
                    No members assigned to this group.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="px-6 py-4 border-t border-amber-500/20 bg-slate-900/95 flex justify-end shrink-0">
          <Button onClick={onClose} className={btnOutline}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
