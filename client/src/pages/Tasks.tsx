import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { taskApi, projectApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { TaskFormModal } from '@/components/TaskFormModal';
import { formatBangladeshiDateTime } from '@/lib/utils';
import { Plus, Circle, Clock, CheckCircle2, User, Users, FolderOpen, Edit, Trash2, X, Play, Check, Eye, Paperclip, MessageSquare, ListTodo } from 'lucide-react';
import { GameProgressBar } from '@/components/GameProgressBar';

export function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<number | ''>('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const isSuperAdmin = user?.roleName === 'SuperAdmin';
  const isHRManager = user?.roleName === 'HR Manager';
  const canCreateTask = isSuperAdmin || isHRManager;

  // Fetch tasks - use getUserTasks for non-SuperAdmin users, getAll for SuperAdmin
  const { data: tasksResponse, isLoading, refetch } = useQuery({
    queryKey: ['tasks', user?.id, user?.companyId, statusFilter, projectFilter],
    queryFn: async () => {
      if (!user?.companyId && !isSuperAdmin) return [];
      
      let tasks: any[] = [];
      
      if (isSuperAdmin) {
        // SuperAdmin can see all tasks
        const filters: any = {};
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        if (projectFilter) {
          filters.projectId = projectFilter;
        }
        const response = await taskApi.getAll(user?.companyId || 1, filters);
        tasks = response.data?.data || [];
      } else {
        // Regular users see only their assigned tasks (individual or group)
        if (!user?.id || !user?.companyId) return [];
        const response = await taskApi.getUserTasks(user.id, user.companyId);
        tasks = response.data.data || [];
      }
      
      // Apply client-side filters
      let filtered = tasks;
      if (statusFilter !== 'all') {
        filtered = filtered.filter((t: any) => t.status === statusFilter);
      }
      if (projectFilter) {
        filtered = filtered.filter((t: any) => t.projectId === projectFilter);
      }
      
      return filtered;
    },
    enabled: (isSuperAdmin && !!user?.id) || (!!user?.companyId && !!user?.id),
  });

  // Fetch projects for filter
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getAll();
      return response.data.data || [];
    },
  });

  const tasks = tasksResponse || [];
  const projects = projectsResponse || [];

  // Filter tasks client-side for assignment type
  const filteredTasks = tasks.filter((task: any) => {
    if (!task || !task.id) {
      console.error('Invalid task in filter:', task);
      return false;
    }
    if (assignmentTypeFilter === 'individual') {
      return task.assignedTo && !task.groupId;
    } else if (assignmentTypeFilter === 'group') {
      return task.groupId && !task.assignedTo;
    }
    return true;
  });

  console.log('Tasks data:', { 
    total: tasks.length, 
    filtered: filteredTasks.length, 
    tasks: tasks,
    filteredTasks: filteredTasks
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: 'Pending' | 'StartedWorking' | 'Complete' | 'Cancel' }) => {
      if (!user?.companyId) throw new Error('Company ID required');
      return await taskApi.update(taskId, { status }, user.companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id, user?.companyId] });
      setUpdatingStatus(null);
    },
    onError: (error: any) => {
      console.error('Failed to update task status:', error);
      alert(error.response?.data?.message || 'Failed to update task status');
      setUpdatingStatus(null);
    },
  });

  const handleStatusChange = async (taskId: number, newStatus: 'Pending' | 'StartedWorking' | 'Complete' | 'Cancel') => {
    setUpdatingStatus(taskId);
    statusUpdateMutation.mutate({ taskId, status: newStatus });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Circle className="w-4 h-4 text-yellow-500" />;
      case 'StartedWorking':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'Cancel':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Pending';
      case 'StartedWorking':
        return 'Started Working';
      case 'Complete':
        return 'Complete';
      case 'Cancel':
        return 'Cancel';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'StartedWorking':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/40';
      case 'Complete':
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
      case 'Cancel':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-700/60 text-amber-200/80 border-amber-500/20';
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    refetch();
  };

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64 text-amber-200/80 animate-pulse">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <ListTodo className="h-8 w-8 text-amber-400" />
            Tasks
          </h1>
          <p className="text-amber-200/80 mt-1">Manage your tasks</p>
        </div>
        {canCreateTask && (
          <Button onClick={handleCreateTask} className={`flex items-center gap-2 ${btnOutline}`}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <GamePanel>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-amber-200/90">Status:</span>
            {(['all', 'Pending', 'StartedWorking', 'Complete', 'Cancel'] as const).map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`min-h-[36px] py-2 px-3 ${statusFilter === status ? 'bg-amber-500/30 border-amber-500 text-amber-100' : btnOutline}`}
              >
                {status === 'all' ? 'All' : getStatusLabel(status)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-200/90">Project:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value ? parseInt(e.target.value) : '')}
                className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputDark}`}
              >
                <option value="">All Projects</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-200/90">Assignment:</span>
              <select
                value={assignmentTypeFilter}
                onChange={(e) => setAssignmentTypeFilter(e.target.value as 'all' | 'individual' | 'group')}
                className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${inputDark}`}
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>
        </div>
      </GamePanel>

      {/* Tasks List */}
      <GamePanel>
        <div className="p-6">
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task: any, index: number) => {
                if (!task || !task.id) return null;
                const progress = task.progress ? Number(task.progress) : 0;
                const subTaskCount = task._count?.subTasks || 0;
                const attachmentCount = task._count?.attachments || 0;
                const hasConversation = !!task.conversation?.id;
                const completedCount = task.subTasks?.filter((st: any) => st.status === 'Complete').length || 0;

                return (
                  <GameCard key={task.id} index={index} hover>
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-amber-100 hover:text-amber-200 transition-colors truncate">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-amber-200/70 mt-1 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                          <Button variant="outline" size="icon" onClick={() => navigate(`/tasks/${task.id}`)} className={`h-8 w-8 ${btnOutline}`} title="View Task Detail">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isSuperAdmin && (
                            <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className={`h-8 w-8 ${btnOutline}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {subTaskCount > 0 && (
                        <div className="mt-4">
                          <GameProgressBar
                            progress={progress}
                            showPercentage
                            showBreakdown
                            breakdown={{ completed: completedCount, total: subTaskCount, weighted: true }}
                            size="sm"
                            theme="dark"
                            showXpStyle
                            showSegments
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                        {task.priority && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'High' ? 'bg-red-500/20 text-red-200 border border-red-500/40' :
                            task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40' :
                            'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                        {task.project && (
                          <div className="flex items-center gap-1 text-amber-200/80">
                            <FolderOpen className="w-4 h-4 text-amber-400" />
                            <span>{task.project.title}</span>
                          </div>
                        )}
                        {task.groupId && task.group ? (
                          <div className="flex items-center gap-1 text-amber-200/80">
                            <Users className="w-4 h-4 text-amber-400" />
                            <span>Group: {task.group.name}</span>
                          </div>
                        ) : task.assignedTo && task.assignedEmployee ? (
                          <div className="flex items-center gap-1 text-amber-200/80">
                            <User className="w-4 h-4 text-amber-400" />
                            <span>{task.assignedEmployee.user?.email || 'Unknown'}</span>
                          </div>
                        ) : null}
                        {task.dueDate && (
                          <div className="text-amber-200/70">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                        )}
                      </div>

                      {(subTaskCount > 0 || attachmentCount > 0 || hasConversation) && (
                        <div className="flex items-center gap-3 text-xs text-amber-200/60 mt-2" onClick={(e) => e.stopPropagation()}>
                          {subTaskCount > 0 && (
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{subTaskCount} sub-task{subTaskCount > 1 ? 's' : ''}</span>
                          )}
                          {attachmentCount > 0 && (
                            <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" />{attachmentCount} attachment{attachmentCount > 1 ? 's' : ''}</span>
                          )}
                          {hasConversation && (
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />Conversation</span>
                          )}
                        </div>
                      )}

                      {task.status === 'StartedWorking' && task.startedAt && (
                        <div className="text-sm text-amber-200/70 mt-3 pb-3 border-b border-amber-500/10">
                          Started at {formatBangladeshiDateTime(task.startedAt)}
                        </div>
                      )}

                      {!isSuperAdmin && (
                        <div className="flex gap-2 pt-3 border-t border-amber-500/10 mt-3" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-medium text-amber-200/80 self-center mr-2">Change Status:</span>
                          {task.status === 'Pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, 'StartedWorking')} disabled={updatingStatus === task.id} className={`h-7 text-xs ${btnOutline}`}>
                              <Play className="w-3 h-3 mr-1" />Start Working
                            </Button>
                          )}
                          {task.status === 'StartedWorking' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, 'Complete')} disabled={updatingStatus === task.id} className="h-7 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40">
                                <Check className="w-3 h-3 mr-1" />Complete
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, 'Cancel')} disabled={updatingStatus === task.id} className="h-7 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40">
                                <X className="w-3 h-3 mr-1" />Cancel
                              </Button>
                            </>
                          )}
                          {updatingStatus === task.id && <span className="text-xs text-amber-200/60 self-center ml-2">Updating...</span>}
                        </div>
                      )}
                    </div>
                  </GameCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-amber-200/70">
              <ListTodo className="w-14 h-14 mx-auto mb-4 text-amber-500/40" />
              No tasks found
            </div>
          )}
        </div>
      </GamePanel>

      <TaskFormModal isOpen={isModalOpen} onClose={handleCloseModal} task={editingTask} />
    </div>
  );
}

