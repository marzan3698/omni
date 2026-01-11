import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { taskApi, projectApi, employeeGroupApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { TaskFormModal } from '@/components/TaskFormModal';
import { formatBangladeshiDateTime } from '@/lib/utils';
import { Plus, Circle, Clock, CheckCircle2, User, Users, FolderOpen, Edit, Trash2, X, Play, Check, Eye, Paperclip, MessageSquare } from 'lucide-react';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';

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
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'StartedWorking':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Complete':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancel':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600 mt-1">Manage your tasks</p>
        </div>
        {canCreateTask && (
          <Button onClick={handleCreateTask} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-slate-700 self-center">Status:</span>
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>
          All
        </Button>
          <Button variant={statusFilter === 'Pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('Pending')}>
            Pending
          </Button>
          <Button variant={statusFilter === 'StartedWorking' ? 'default' : 'outline'} onClick={() => setStatusFilter('StartedWorking')}>
            Started Working
        </Button>
          <Button variant={statusFilter === 'Complete' ? 'default' : 'outline'} onClick={() => setStatusFilter('Complete')}>
            Complete
        </Button>
          <Button variant={statusFilter === 'Cancel' ? 'default' : 'outline'} onClick={() => setStatusFilter('Cancel')}>
            Cancel
        </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Project:</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Projects</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Assignment:</span>
            <select
              value={assignmentTypeFilter}
              onChange={(e) => setAssignmentTypeFilter(e.target.value as 'all' | 'individual' | 'group')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="group">Group</option>
            </select>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          {(() => {
            console.log('Rendering tasks section. filteredTasks.length:', filteredTasks.length);
            console.log('filteredTasks array:', JSON.stringify(filteredTasks, null, 2));
            return filteredTasks.length > 0 ? (
          <div className="space-y-4">
                {filteredTasks.map((task: any) => {
                  if (!task || !task.id) {
                    console.error('Invalid task:', task);
                    return null;
                  }
                  console.log('Rendering task:', task.id, task.title);
                  const progress = task.progress ? Number(task.progress) : 0;
                  const subTaskCount = task._count?.subTasks || 0;
                  const attachmentCount = task._count?.attachments || 0;
                  const hasConversation = !!task.conversation?.id;
                  
                  return (
              <Card 
                key={task.id} 
                className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <CardTitle className="text-lg hover:text-indigo-600 transition-colors">{task.title}</CardTitle>
                        {task.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      {/* Status Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="h-8 w-8"
                        title="View Task Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  {subTaskCount > 0 && (
                    <div className="mb-4">
                      <AnimatedProgressBar
                        progress={progress}
                        showPercentage={true}
                        showBreakdown={true}
                        breakdown={{
                          completed: task.subTasks?.filter((st: any) => st.status === 'Complete').length || 0,
                          total: subTaskCount,
                          weighted: true,
                        }}
                        size="sm"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    {/* Priority Badge */}
                      {task.priority && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}

                    {/* Project */}
                    {task.project && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <FolderOpen className="w-4 h-4" />
                        <span>{task.project.title}</span>
                      </div>
                    )}

                    {/* Assignment Type and Info */}
                    {task.groupId && task.group ? (
                      <div className="flex items-center gap-1 text-indigo-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Group:</span>
                        <span>{task.group.name}</span>
                      </div>
                    ) : task.assignedTo && task.assignedEmployee ? (
                      <div className="flex items-center gap-1 text-slate-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium">Employee:</span>
                        <span>{task.assignedEmployee.user?.email || 'Unknown'}</span>
                      </div>
                    ) : null}

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className="text-slate-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Badges for sub-tasks, attachments, conversation */}
                  {(subTaskCount > 0 || attachmentCount > 0 || hasConversation) && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3" onClick={(e) => e.stopPropagation()}>
                      {subTaskCount > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{subTaskCount} sub-task{subTaskCount > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {attachmentCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span>{attachmentCount} attachment{attachmentCount > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {hasConversation && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>Conversation</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {progress > 0 && subTaskCount > 0 && (
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                      <AnimatedProgressBar
                        progress={progress}
                        showPercentage={true}
                        showBreakdown={true}
                        breakdown={{
                          completed: 0, // Will be calculated server-side or can be fetched separately if needed
                          total: subTaskCount,
                          weighted: true,
                        }}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Started Working Info - Show when task is StartedWorking and has startedAt */}
                  {task.status === 'StartedWorking' && task.startedAt && (
                    <div className="text-sm text-slate-600 mb-4 pb-3 border-b border-gray-200">
                      Started working at {formatBangladeshiDateTime(task.startedAt)}
                    </div>
                  )}

                  {/* Status Change Buttons - Only show for non-SuperAdmin users */}
                  {!isSuperAdmin && (
                    <div className="flex gap-2 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs font-medium text-slate-600 self-center mr-2">Change Status:</span>
                      
                      {/* Pending tasks: Show only "Start Working" button */}
                      {task.status === 'Pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(task.id, 'StartedWorking')}
                          disabled={updatingStatus === task.id}
                          className="h-7 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start Working
                        </Button>
                      )}
                      
                      {/* StartedWorking tasks: Show "Complete" and "Cancel" buttons */}
                      {task.status === 'StartedWorking' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'Complete')}
                            disabled={updatingStatus === task.id}
                            className="h-7 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'Cancel')}
                            disabled={updatingStatus === task.id}
                            className="h-7 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      
                      {updatingStatus === task.id && (
                        <span className="text-xs text-slate-500 self-center ml-2">Updating...</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
                );
              })}
          </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No tasks found</div>
          );
          })()}
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />
    </div>
  );
}

