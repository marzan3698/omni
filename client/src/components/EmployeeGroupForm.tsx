import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeGroupApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeSelector } from './EmployeeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface EmployeeGroupFormProps {
  group?: {
    id: number;
    name: string;
    description: string;
    members?: Array<{
      employee: {
        id: number;
      };
    }>;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmployeeGroupForm({ group, onClose, onSuccess }: EmployeeGroupFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!group;

  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    employeeIds: (group?.members || []).map((m: any) => m.employee.id) as number[],
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    employees?: string;
  }>({});

  const createGroupMutation = useMutation({
    mutationFn: (data: any) => employeeGroupApi.create(data),
    onSuccess: async () => {
      // Invalidate and refetch all employee-groups queries
      await queryClient.invalidateQueries({ 
        queryKey: ['employee-groups'],
        refetchType: 'active'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['employee-groups-selector'],
        refetchType: 'active'
      });
      onSuccess?.();
      onClose();
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data: any) =>
      employeeGroupApi.update(group!.id, data, user?.companyId || 0),
    onSuccess: async () => {
      // Invalidate and refetch all employee-groups queries
      await queryClient.invalidateQueries({ 
        queryKey: ['employee-groups'],
        refetchType: 'active'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['employee-groups-selector'],
        refetchType: 'active'
      });
      onSuccess?.();
      onClose();
    },
  });

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Group description is required';
    }

    if (formData.employeeIds.length === 0) {
      newErrors.employees = 'At least one employee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      companyId: user?.companyId,
      employeeIds: formData.employeeIds,
    };

    if (isEditing) {
      updateGroupMutation.mutate({
        name: submitData.name,
        description: submitData.description,
        employeeIds: submitData.employeeIds,
      });
    } else {
      createGroupMutation.mutate(submitData);
    }
  };

  const isLoading = createGroupMutation.isPending || updateGroupMutation.isPending;

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="game-panel rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-500/30">
        <div className="sticky top-0 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between bg-slate-900/95 z-10">
          <h2 className="text-xl font-semibold text-amber-100">
            {isEditing ? 'Edit Employee Group' : 'Create Employee Group'}
          </h2>
          <button onClick={onClose} className="text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/20 rounded p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Label htmlFor="name" className="text-amber-200/90">
              Group Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={`${inputDark} ${errors.name ? 'border-red-500/50' : ''}`}
              placeholder="Enter group name"
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-amber-200/90">
              Description <span className="text-red-400">*</span>
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              className={`w-full min-h-[100px] px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${inputDark} ${
                errors.description ? 'border-red-500/50' : ''
              }`}
              placeholder="Enter group description"
              required
            />
            {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
          </div>

          <div>
            <Label className="text-amber-200/90">
              Employees <span className="text-red-400">*</span>
            </Label>
            <div className="mt-2 p-4 border border-amber-500/20 rounded-lg bg-slate-800/40">
              {user?.companyId && (
                <EmployeeSelector
                  companyId={user.companyId}
                  selectedEmployeeIds={formData.employeeIds}
                  onSelectionChange={(employeeIds) => {
                    setFormData({ ...formData, employeeIds });
                    if (errors.employees) setErrors({ ...errors, employees: undefined });
                  }}
                  isSuperAdmin={user?.roleName === 'SuperAdmin'}
                />
              )}
            </div>
            {errors.employees && <p className="mt-1 text-sm text-red-400">{errors.employees}</p>}
            {formData.employeeIds.length > 0 && (
              <p className="mt-2 text-sm text-amber-200/80">
                {formData.employeeIds.length} employee{formData.employeeIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {(createGroupMutation.error || updateGroupMutation.error) && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300">
              <p className="text-sm">
                {createGroupMutation.error instanceof Error
                  ? createGroupMutation.error.message
                  : updateGroupMutation.error instanceof Error
                  ? updateGroupMutation.error.message
                  : 'An error occurred'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-amber-500/20">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className={btnOutline}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">
              {isLoading ? 'Saving...' : isEditing ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

