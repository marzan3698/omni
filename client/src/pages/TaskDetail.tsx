import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle2, X, Play, Circle, Clock, User, Users, FolderOpen } from 'lucide-react';
import { SubTaskItem } from '@/components/SubTaskItem';
import { AttachmentGrid } from '@/components/AttachmentGrid';
import type { TaskAttachment } from '@/types';
import { TaskConversation } from '@/components/TaskConversation';
import { GameProgressBar } from '@/components/GameProgressBar';
import { SubTaskFormModal } from '@/components/SubTaskFormModal';
import { AttachmentUploader } from '@/components/AttachmentUploader';
import type { TaskStatus, TaskPriority } from '@/types';
import { formatBangladeshiDateTime } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  Pending: { icon: Circle, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'Pending' },
  StartedWorking: { icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', label: 'Started Working' },
  Complete: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Complete' },
  Cancel: { icon: X, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', label: 'Cancel' },
};

const priorityConfig = {
  Low: { color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  Medium: { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  High: { color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40' },
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
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Upload failed: ${errorMsg}`);
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

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-amber-200/80 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          Loading task details...
        </div>
      </div>
    );
  }

  if (error || !taskDetail) {
    return (
      <div className="p-6">
        <GamePanel>
          <div className="p-12 text-center">
            <p className="text-red-300 mb-4">Failed to load task details</p>
            <Button onClick={() => navigate('/tasks')} className={btnOutline}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </div>
        </GamePanel>
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
        <Button onClick={() => navigate('/tasks')} className={btnOutline} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className={btnOutline}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Task Header */}
      <GamePanel>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border-2', statusConfig[task.status as TaskStatus].bg, statusConfig[task.status as TaskStatus].border)}>
                  <StatusIcon className={cn('w-5 h-5', statusConfig[task.status as TaskStatus].color)} />
                </div>
                <h1 className="text-2xl font-bold text-amber-100">{task.title}</h1>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={cn('px-2 py-1 rounded text-xs font-medium border', statusConfig[task.status as TaskStatus].border, 'text-amber-200')}>
                  {statusConfig[task.status as TaskStatus].label}
                </span>
                <span className={cn('px-2 py-1 rounded text-xs font-medium border', priorityConfig[task.priority as TaskPriority].border, priorityConfig[task.priority as TaskPriority].color)}>
                  {task.priority} Priority
                </span>
              </div>

              <div className="mb-4">
                <GameProgressBar
                  progress={progress}
                  showPercentage
                  showBreakdown={totalSubTasks > 0}
                  breakdown={{ completed: completedSubTasks, total: totalSubTasks, weighted: true }}
                  size="md"
                  theme="dark"
                  showXpStyle
                  showSegments
                  showRank
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-200/80">
                {task.dueDate && (
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /><span>Due: {formatBangladeshiDateTime(new Date(task.dueDate))}</span></div>
                )}
                {task.startedAt && (
                  <div className="flex items-center gap-2"><Play className="w-4 h-4 text-amber-400" /><span>Started: {formatBangladeshiDateTime(new Date(task.startedAt))}</span></div>
                )}
                {task.assignedEmployee && (
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-amber-400" /><span>Assigned to: {task.assignedEmployee.user?.email}</span></div>
                )}
                {task.group && (
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-amber-400" /><span>Group: {task.group.name}</span></div>
                )}
                {task.project && (
                  <div className="flex items-center gap-2"><FolderOpen className="w-4 h-4 text-amber-400" /><span>Project: {task.project.title}</span></div>
                )}
              </div>

              {!canEdit && task.assignedEmployee?.user?.id === user?.id && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-200/80">Change Status:</span>
                  {task.status === 'Pending' && (
                    <Button variant="outline" size="sm" onClick={() => statusUpdateMutation.mutate('StartedWorking')} disabled={statusUpdateMutation.isPending} className={`h-7 text-xs ${btnOutline}`}>
                      <Play className="w-3 h-3 mr-1" />Start Working
                    </Button>
                  )}
                  {task.status === 'StartedWorking' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => statusUpdateMutation.mutate('Complete')} disabled={statusUpdateMutation.isPending} className="h-7 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 mr-1" />Complete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => statusUpdateMutation.mutate('Cancel')} disabled={statusUpdateMutation.isPending} className="h-7 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40">
                        <X className="w-3 h-3 mr-1" />Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {task.description && (
            <div className="border-t border-amber-500/20 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-amber-200/90 mb-2">Description</h3>
              <p className="text-sm text-amber-200/80 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>
      </GamePanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GamePanel>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-amber-100">Sub-tasks</h2>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowSubTaskModal(true)} className={btnOutline}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-task
                  </Button>
                )}
              </div>
              {subTasks.length === 0 ? (
                <p className="text-sm text-amber-200/70 text-center py-8">No sub-tasks yet</p>
              ) : (
                <div className="space-y-3">
                  {subTasks.map((subTask: any) => (
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
                      theme="dark"
                    />
                  ))}
                </div>
              )}
            </div>
          </GamePanel>

          <GamePanel>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-amber-100">Attachments</h2>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowAttachmentUploader(!showAttachmentUploader)} className={btnOutline}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attachment
                  </Button>
                )}
              </div>
              {showAttachmentUploader && (
                <div className="mb-4 pb-4 border-b border-amber-500/20">
                  <AttachmentUploader onFileSelect={handleFileSelect} onLinkAdd={handleLinkAdd} taskId={taskId} />
                </div>
              )}
              <AttachmentGrid
                attachments={attachments}
                onDelete={canEdit ? (id) => deleteAttachmentMutation.mutate(id) : undefined}
                showDelete={canEdit}
              />
            </div>
          </GamePanel>
        </div>

        <GamePanel className="lg:sticky lg:top-6 lg:self-start">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-100 mb-4">Conversation</h2>
            <TaskConversation taskId={taskId} companyId={companyId} className="h-[600px]" />
          </div>
        </GamePanel>
      </div>

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

