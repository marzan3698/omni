import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle2, X, Play, Circle, Clock, User, Users, FolderOpen } from 'lucide-react';
import { SubTaskItem } from '@/components/SubTaskItem';
import { AttachmentGrid } from '@/components/AttachmentGrid';
import type { TaskAttachment } from '@/types';
import { TaskConversation } from '@/components/TaskConversation';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { SubTaskFormModal } from '@/components/SubTaskFormModal';
import { AttachmentUploader } from '@/components/AttachmentUploader';
import type { TaskStatus, TaskPriority } from '@/types';
import { formatBangladeshiDateTime } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  Pending: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Pending' },
  StartedWorking: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Started Working' },
  Complete: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Complete' },
  Cancel: { icon: X, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Cancel' },
};

const priorityConfig = {
  Low: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  Medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  High: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showSubTaskModal, setShowSubTaskModal] = useState(false);
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);

  const taskId = parseInt(id || '0');
  const companyId = user?.companyId || 0;

  // Fetch task detail
  const { data: taskDetail, isLoading, error } = useQuery({
    queryKey: ['task-detail', taskId, companyId],
    queryFn: async () => {
      const response = await taskApi.getDetail(taskId, companyId);
      return response.data.data;
    },
    enabled: !!taskId && !!companyId,
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async (status: TaskStatus) => {
      return await taskApi.updateStatus(taskId, status, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Sub-task mutations
  const createSubTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await taskApi.createSubTask(taskId, data, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
      setShowSubTaskModal(false);
    },
  });

  const updateSubTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await taskApi.updateSubTask(id, data, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
    },
  });

  const deleteSubTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return await taskApi.deleteSubTask(id, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
    },
  });

  // Attachment mutations
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      return await taskApi.uploadAttachment(taskId, file, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
      setShowAttachmentUploader(false);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return await taskApi.deleteAttachment(attachmentId, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !taskDetail) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Failed to load task details</p>
            <Button onClick={() => navigate('/tasks')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const task = taskDetail;
  const subTasks = taskDetail.subTasks || [];
  const attachments = taskDetail.attachments || [];
  const progress = task.progress ? Number(task.progress) : 0;
  const StatusIcon = statusConfig[task.status as TaskStatus].icon;
  const isSuperAdmin = user?.roleName === 'SuperAdmin';
  const isHRManager = user?.roleName === 'HR Manager';
  const canEdit = isSuperAdmin || isHRManager;

  // Calculate sub-task breakdown
  const completedSubTasks = subTasks.filter((st: any) => st.status === 'Complete').length;
  const totalSubTasks = subTasks.length;

  const handleSubTaskStatusChange = async (id: number, status: TaskStatus) => {
    await updateSubTaskMutation.mutateAsync({ id, data: { status } });
  };

  const handleFileSelect = (file: File) => {
    uploadAttachmentMutation.mutate(file);
  };

  const handleLinkAdd = async (url: string) => {
    try {
      await taskApi.addLinkAttachment({
        taskId,
        linkUrl: url,
        companyId,
      });
      queryClient.invalidateQueries({ queryKey: ['task-detail', taskId, companyId] });
      setShowAttachmentUploader(false);
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/tasks')} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Task Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2',
                  statusConfig[task.status as TaskStatus].bg,
                  statusConfig[task.status as TaskStatus].border
                )}>
                  <StatusIcon className={cn('w-5 h-5', statusConfig[task.status as TaskStatus].color)} />
                </div>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
              </div>

              {/* Status and Priority Badges */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={cn('text-xs', statusConfig[task.status as TaskStatus].border)}>
                  {statusConfig[task.status as TaskStatus].label}
                </Badge>
                <Badge variant="outline" className={cn('text-xs', priorityConfig[task.priority as TaskPriority].border)}>
                  {task.priority} Priority
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <AnimatedProgressBar
                  progress={progress}
                  showPercentage={true}
                  showBreakdown={totalSubTasks > 0}
                  breakdown={{
                    completed: completedSubTasks,
                    total: totalSubTasks,
                    weighted: true,
                  }}
                  size="md"
                />
              </div>

              {/* Task Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Due: {formatBangladeshiDateTime(new Date(task.dueDate))}</span>
                  </div>
                )}
                {task.startedAt && (
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span>Started: {formatBangladeshiDateTime(new Date(task.startedAt))}</span>
                  </div>
                )}
                {task.assignedEmployee && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Assigned to: {task.assignedEmployee.user?.email}</span>
                  </div>
                )}
                {task.group && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Group: {task.group.name}</span>
                  </div>
                )}
                {task.project && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>Project: {task.project.title}</span>
                  </div>
                )}
              </div>

              {/* Status Change Buttons (for employees) */}
              {!canEdit && task.assignedEmployee?.user?.id === user?.id && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Change Status:</span>
                  {task.status === 'Pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => statusUpdateMutation.mutate('StartedWorking')}
                      disabled={statusUpdateMutation.isPending}
                      className="h-7 text-xs"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start Working
                    </Button>
                  )}
                  {task.status === 'StartedWorking' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => statusUpdateMutation.mutate('Complete')}
                        disabled={statusUpdateMutation.isPending}
                        className="h-7 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => statusUpdateMutation.mutate('Cancel')}
                        disabled={statusUpdateMutation.isPending}
                        className="h-7 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Description */}
        {task.description && (
          <CardContent className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Two-column layout: Left (Sub-tasks & Attachments) / Right (Conversation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Sub-tasks and Attachments */}
        <div className="space-y-6">
          {/* Sub-tasks Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sub-tasks</CardTitle>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubTaskModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-task
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {subTasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No sub-tasks yet</p>
              ) : (
                subTasks.map((subTask: any) => (
                  <SubTaskItem
                    key={subTask.id}
                    id={subTask.id}
                    title={subTask.title}
                    instructions={subTask.instructions}
                    weight={Number(subTask.weight)}
                    status={subTask.status}
                    order={subTask.order}
                    startedAt={subTask.startedAt}
                    completedAt={subTask.completedAt}
                    attachments={subTask.attachments || []}
                    onStatusChange={handleSubTaskStatusChange}
                    onDelete={canEdit ? (id) => deleteSubTaskMutation.mutate(id) : undefined}
                    canEdit={canEdit || task.assignedEmployee?.user?.id === user?.id}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Attachments</CardTitle>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAttachmentUploader(!showAttachmentUploader)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attachment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showAttachmentUploader && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <AttachmentUploader
                    onFileSelect={handleFileSelect}
                    onLinkAdd={handleLinkAdd}
                    taskId={taskId}
                  />
                </div>
              )}
              <AttachmentGrid
                attachments={attachments}
                onDelete={canEdit ? (id) => deleteAttachmentMutation.mutate(id) : undefined}
                showDelete={canEdit}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Conversation */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskConversation taskId={taskId} companyId={companyId} className="h-[600px]" />
          </CardContent>
        </Card>
      </div>

      {/* Sub-task Form Modal */}
      {showSubTaskModal && (
        <SubTaskFormModal
          isOpen={showSubTaskModal}
          onClose={() => setShowSubTaskModal(false)}
          onSubmit={(data) => createSubTaskMutation.mutate(data)}
          isLoading={createSubTaskMutation.isPending}
        />
      )}
    </div>
  );
}

