import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, projectApi, employeeApi, employeeGroupApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation schema
const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.string().optional(),
  projectId: z.number().int().positive().optional().nullable(),
  assignmentType: z.enum(['individual', 'group']),
  assignedTo: z.number().int().positive().optional().nullable(),
  groupId: z.number().int().positive().optional().nullable(),
}).refine(
  (data) => {
    if (data.assignmentType === 'individual') {
      return !!data.assignedTo;
    } else {
      return !!data.groupId;
    }
  },
  {
    message: 'Please select an employee or group',
    path: ['assignedTo'],
  }
);

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any; // Existing task for editing (optional)
}

export function TaskFormModal({ isOpen, onClose, task }: TaskFormModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [assignmentType, setAssignmentType] = useState<'individual' | 'group'>('individual');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'Medium',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      projectId: task?.projectId || null,
      assignmentType: task?.groupId ? 'group' : 'individual',
      assignedTo: task?.assignedTo || null,
      groupId: task?.groupId || null,
    },
  });

  // Watch assignment type to conditionally show fields
  const watchedAssignmentType = watch('assignmentType');

  useEffect(() => {
    if (watchedAssignmentType) {
      setAssignmentType(watchedAssignmentType);
      // Reset assignment fields when type changes
      if (watchedAssignmentType === 'individual') {
        setValue('groupId', null);
      } else {
        setValue('assignedTo', null);
      }
    }
  }, [watchedAssignmentType, setValue]);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'Medium',
        dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        projectId: task?.projectId || null,
        assignmentType: task?.groupId ? 'group' : 'individual',
        assignedTo: task?.assignedTo || null,
        groupId: task?.groupId || null,
      });
      setAssignmentType(task?.groupId ? 'group' : 'individual');
    }
  }, [isOpen, task, reset]);

  // Fetch projects
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getAll();
      return response.data.data || [];
    },
    enabled: isOpen,
  });

  // Fetch employees
  const { data: employeesResponse } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await employeeApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: isOpen && !!user?.companyId && assignmentType === 'individual',
  });

  // Fetch employee groups
  const { data: groupsResponse } = useQuery({
    queryKey: ['employee-groups', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await employeeGroupApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: isOpen && !!user?.companyId && assignmentType === 'group',
  });

  const projects = projectsResponse || [];
  const employees = employeesResponse || [];
  const groups = groupsResponse || [];

  // Create/Update task mutation
  const taskMutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      const taskData: any = {
        companyId: user?.companyId!,
        title: data.title,
        priority: data.priority,
      };

      // Add optional fields only if they have values
      if (data.description) {
        taskData.description = data.description;
      }
      if (data.dueDate) {
        taskData.dueDate = new Date(data.dueDate).toISOString();
      }
      if (data.projectId) {
        taskData.projectId = data.projectId;
      }

      // Add assignment based on type
      if (data.assignmentType === 'individual') {
        if (data.assignedTo) {
          taskData.assignedTo = data.assignedTo;
        }
      } else if (data.assignmentType === 'group') {
        if (data.groupId) {
          taskData.groupId = data.groupId;
        }
      }

      if (task) {
        return taskApi.update(task.id, taskData, user?.companyId);
      } else {
        return taskApi.create(taskData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'user'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to save task:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save task';
      console.error('Error details:', error.response?.data);
      alert(errorMessage);
    },
  });

  const onSubmit = (data: TaskFormData) => {
    taskMutation.mutate(data);
  };

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100 focus:border-amber-500/50 focus:ring-amber-500/30';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="game-panel rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-amber-500/30">
        <div className="sticky top-0 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between bg-slate-900/95 z-10">
          <h2 className="text-xl font-bold text-amber-100">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/20 rounded p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <Label htmlFor="title" className="text-amber-200/90">Title <span className="text-red-400">*</span></Label>
            <Input id="title" {...register('title')} className={cn('mt-1', inputDark, errors.title && 'border-red-500/50')} placeholder="Enter task title" />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-amber-200/90">Description</Label>
            <textarea id="description" {...register('description')} className={cn('mt-1 w-full min-h-[100px] px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50', inputDark, errors.description && 'border-red-500/50')} placeholder="Enter task description" />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="text-amber-200/90">Priority <span className="text-red-400">*</span></Label>
              <select id="priority" {...register('priority')} className={cn('mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50', inputDark, errors.priority && 'border-red-500/50')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && <p className="text-red-400 text-sm mt-1">{errors.priority.message}</p>}
            </div>
            <div>
              <Label htmlFor="dueDate" className="text-amber-200/90">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} className={cn('mt-1', inputDark, errors.dueDate && 'border-red-500/50')} />
              {errors.dueDate && <p className="text-red-400 text-sm mt-1">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="projectId" className="text-amber-200/90">Project (Optional)</Label>
            <select id="projectId" {...register('projectId', { setValueAs: (v) => (v === '' || v === null ? null : parseInt(v)) })} className={cn('mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50', inputDark, errors.projectId && 'border-red-500/50')}>
              <option value="">Select a project (optional)</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            {errors.projectId && <p className="text-red-400 text-sm mt-1">{errors.projectId.message}</p>}
          </div>

          <div>
            <Label className="text-amber-200/90 block mb-3">Assignment Type <span className="text-red-400">*</span></Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-amber-200/90">
                <input type="radio" value="individual" {...register('assignmentType')} className="w-4 h-4 text-amber-500 focus:ring-amber-500" />
                <User className="w-5 h-5" />
                <span>Individual Employee</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-amber-200/90">
                <input type="radio" value="group" {...register('assignmentType')} className="w-4 h-4 text-amber-500 focus:ring-amber-500" />
                <Users className="w-5 h-5" />
                <span>Employee Group</span>
              </label>
            </div>
            {errors.assignmentType && <p className="text-red-400 text-sm mt-1">{errors.assignmentType.message}</p>}
          </div>

          {assignmentType === 'individual' && (
            <div>
              <Label htmlFor="assignedTo" className="text-amber-200/90">Assign To Employee <span className="text-red-400">*</span></Label>
              <select id="assignedTo" {...register('assignedTo', { setValueAs: (v) => (v === '' || v === null ? null : parseInt(v)) })} className={cn('mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50', inputDark, errors.assignedTo && 'border-red-500/50')}>
                <option value="">Select an employee</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.user?.email || `Employee #${e.id}`}</option>)}
              </select>
              {errors.assignedTo && <p className="text-red-400 text-sm mt-1">{errors.assignedTo.message}</p>}
            </div>
          )}

          {assignmentType === 'group' && (
            <div>
              <Label htmlFor="groupId" className="text-amber-200/90">Assign To Group <span className="text-red-400">*</span></Label>
              <select id="groupId" {...register('groupId', { setValueAs: (v) => (v === '' || v === null ? null : parseInt(v)) })} className={cn('mt-1 w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50', inputDark, errors.groupId && 'border-red-500/50')}>
                <option value="">Select an employee group</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name} ({g._count?.members || 0} members)</option>)}
              </select>
              {errors.groupId && <p className="text-red-400 text-sm mt-1">{errors.groupId.message}</p>}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/20">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className={btnOutline}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

