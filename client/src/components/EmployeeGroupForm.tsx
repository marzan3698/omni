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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditing ? 'Edit Employee Group' : 'Create Employee Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <Label htmlFor="name">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter group name"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              className={`w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter group description"
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Employee Selection */}
          <div>
            <Label>
              Employees <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
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
            {errors.employees && (
              <p className="mt-1 text-sm text-red-600">{errors.employees}</p>
            )}
            {formData.employeeIds.length > 0 && (
              <p className="mt-2 text-sm text-slate-600">
                {formData.employeeIds.length} employee{formData.employeeIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Error Display */}
          {(createGroupMutation.error || updateGroupMutation.error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {createGroupMutation.error instanceof Error
                  ? createGroupMutation.error.message
                  : updateGroupMutation.error instanceof Error
                  ? updateGroupMutation.error.message
                  : 'An error occurred'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : isEditing
                ? 'Update Group'
                : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

