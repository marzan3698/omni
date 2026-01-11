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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-slate-700 font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              className={cn('mt-1', errors.title && 'border-red-500')}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-slate-700 font-medium">
              Description
            </Label>
            <textarea
              id="description"
              {...register('description')}
              className={cn(
                'mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                errors.description && 'border-red-500'
              )}
              placeholder="Enter task description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="text-slate-700 font-medium">
                Priority <span className="text-red-500">*</span>
              </Label>
              <select
                id="priority"
                {...register('priority')}
                className={cn(
                  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  errors.priority && 'border-red-500'
                )}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-slate-700 font-medium">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className={cn('mt-1', errors.dueDate && 'border-red-500')}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <Label htmlFor="projectId" className="text-slate-700 font-medium">
              Project (Optional)
            </Label>
            <select
              id="projectId"
              {...register('projectId', {
                setValueAs: (value) => {
                  if (value === '' || value === null) return null;
                  return parseInt(value);
                },
              })}
              className={cn(
                'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                errors.projectId && 'border-red-500'
              )}
            >
              <option value="">Select a project (optional)</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-red-500 text-sm mt-1">{errors.projectId.message}</p>
            )}
          </div>

          {/* Assignment Type */}
          <div>
            <Label className="text-slate-700 font-medium block mb-3">
              Assignment Type <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="individual"
                  {...register('assignmentType')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <User className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">Individual Employee</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="group"
                  {...register('assignmentType')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <Users className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">Employee Group</span>
              </label>
            </div>
            {errors.assignmentType && (
              <p className="text-red-500 text-sm mt-1">{errors.assignmentType.message}</p>
            )}
          </div>

          {/* Individual Employee Selection */}
          {assignmentType === 'individual' && (
            <div>
              <Label htmlFor="assignedTo" className="text-slate-700 font-medium">
                Assign To Employee <span className="text-red-500">*</span>
              </Label>
              <select
                id="assignedTo"
                {...register('assignedTo', {
                  setValueAs: (value) => {
                    if (value === '' || value === null) return null;
                    return parseInt(value);
                  },
                })}
                className={cn(
                  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  errors.assignedTo && 'border-red-500'
                )}
              >
                <option value="">Select an employee</option>
                {employees.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.user?.email || `Employee #${employee.id}`}
                  </option>
                ))}
              </select>
              {errors.assignedTo && (
                <p className="text-red-500 text-sm mt-1">{errors.assignedTo.message}</p>
              )}
            </div>
          )}

          {/* Employee Group Selection */}
          {assignmentType === 'group' && (
            <div>
              <Label htmlFor="groupId" className="text-slate-700 font-medium">
                Assign To Group <span className="text-red-500">*</span>
              </Label>
              <select
                id="groupId"
                {...register('groupId', {
                  setValueAs: (value) => {
                    if (value === '' || value === null) return null;
                    return parseInt(value);
                  },
                })}
                className={cn(
                  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  errors.groupId && 'border-red-500'
                )}
              >
                <option value="">Select an employee group</option>
                {groups.map((group: any) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group._count?.members || 0} members)
                  </option>
                ))}
              </select>
              {errors.groupId && (
                <p className="text-red-500 text-sm mt-1">{errors.groupId.message}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

