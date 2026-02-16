import { GamePanel } from '@/components/GamePanel';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ListChecks, Info } from 'lucide-react';

// Task priorities (enum - fixed)
const taskPriorities = ['Low', 'Medium', 'High'];

// Task statuses (enum - fixed)
const taskStatuses = ['Todo', 'InProgress', 'Done'];

export default function TaskConfig() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-100">
          <ListChecks className="h-8 w-8 text-amber-400" />
          Task Configuration
        </h1>
        <p className="text-amber-200/80 mt-1">View task categories and statuses (read-only)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Priorities */}
        <GamePanel>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-amber-100">Task Priorities</h2>
            <p className="text-sm text-amber-200/70 mt-1">Available priority levels for tasks</p>
            <div className="space-y-2 mt-4">
              {taskPriorities.map((priority) => (
                <div
                  key={priority}
                  className="flex items-center justify-between p-3 border border-amber-500/20 rounded-md bg-slate-800/40"
                >
                  <span className="font-medium text-amber-100">{priority}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${
                      priority === 'High'
                        ? 'bg-red-500/25 text-red-300 border-red-500/30'
                        : priority === 'Medium'
                        ? 'bg-amber-500/25 text-amber-200 border-amber-500/30'
                        : 'bg-slate-700/60 text-amber-200/80 border-amber-500/20'
                    }`}
                  >
                    {priority === 'High' ? 'Urgent' : priority === 'Medium' ? 'Normal' : 'Low Priority'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-slate-800/60 border border-amber-500/20 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200/80">
                  Task priorities are system-defined and cannot be modified. These are enum values in the database.
                </p>
              </div>
            </div>
          </div>
        </GamePanel>

        {/* Task Statuses */}
        <GamePanel>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-amber-100">Task Statuses</h2>
            <p className="text-sm text-amber-200/70 mt-1">Available status options for tasks</p>
            <div className="space-y-2 mt-4">
              {taskStatuses.map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-3 border border-amber-500/20 rounded-md bg-slate-800/40"
                >
                  <span className="font-medium text-amber-100">{status}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${
                      status === 'Done'
                        ? 'bg-green-500/25 text-green-300 border-green-500/30'
                        : status === 'InProgress'
                        ? 'bg-amber-500/25 text-amber-200 border-amber-500/30'
                        : 'bg-slate-700/60 text-amber-200/80 border-amber-500/20'
                    }`}
                  >
                    {status === 'Done' ? 'Completed' : status === 'InProgress' ? 'Active' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-slate-800/60 border border-amber-500/20 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200/80">
                  Task statuses are system-defined and cannot be modified. These are enum values in the database.
                </p>
              </div>
            </div>
          </div>
        </GamePanel>
      </div>

      {/* Additional Info */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-amber-100">About Task Configuration</h2>
          <div className="space-y-2 text-sm text-amber-200/80 mt-4">
            <p>
              Task priorities and statuses are defined as enums in the database schema. This ensures consistency
              across the system and prevents invalid values.
            </p>
            <p>
              <strong className="text-amber-100">Priorities:</strong> Used to indicate the urgency of a task. High priority tasks should be
              addressed first.
            </p>
            <p>
              <strong className="text-amber-100">Statuses:</strong> Track the progress of tasks through their lifecycle from creation to
              completion.
            </p>
            <p className="text-xs text-amber-200/60 mt-4">
              Note: Only SuperAdmin can view this configuration page. To modify these values, database schema
              changes would be required.
            </p>
          </div>
        </div>
      </GamePanel>
    </div>
  );
}

