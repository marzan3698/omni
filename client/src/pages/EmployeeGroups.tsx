import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { employeeGroupApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeGroupForm } from '@/components/EmployeeGroupForm';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Users, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface EmployeeGroup {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    email: string;
    name: string | null;
  };
  _count: {
    members: number;
    campaigns: number;
  };
}

export default function EmployeeGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EmployeeGroup | null>(null);

  // Fetch employee groups
  const { data: groupsResponse, isLoading, error } = useQuery({
    queryKey: ['employee-groups', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        return null;
      }
      const response = await employeeGroupApi.getAll(user.companyId);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch employee groups');
      }
      return Array.isArray(response.data.data) 
        ? (response.data.data as EmployeeGroup[])
        : [];
    },
    enabled: !!user?.companyId,
  });

  const groups = groupsResponse || [];

  // Delete mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => employeeGroupApi.delete(id, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-groups'] });
      queryClient.invalidateQueries({ queryKey: ['employee-groups-selector'] });
    },
  });

  const handleCreate = () => {
    setEditingGroup(null);
    setIsFormOpen(true);
  };

  const handleEdit = (group: EmployeeGroup) => {
    // Fetch full group details with members for editing
    navigate(`/employee-groups/${group.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee group? This will also remove it from all campaigns.')) {
      return;
    }

    try {
      await deleteGroupMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete employee group');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
  };

  if (isLoading) {
    return (
      <PermissionGuard permission="can_manage_employees">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading employee groups...</p>
        </div>
      </PermissionGuard>
    );
  }

  if (error) {
    return (
      <PermissionGuard permission="can_manage_employees">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading employee groups</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-2"
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="can_manage_employees">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employee Groups</h1>
            <p className="text-slate-500 mt-1">Manage employee groups and assign them to campaigns</p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>

        {/* Groups List */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            {groups.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No employee groups found</p>
                <Button onClick={handleCreate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Group Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Campaigns
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groups.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-5 h-5 text-indigo-500 mr-2" />
                            <div className="text-sm font-medium text-slate-900">{group.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 max-w-md truncate">
                            {group.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {group._count?.members || 0} member{group._count?.members !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {group._count?.campaigns ?? 0} campaign{group._count?.campaigns !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">
                            {group.creator.name || group.creator.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">
                            {new Date(group.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/employee-groups/${group.id}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(group)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(group.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={deleteGroupMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Form Modal */}
        {isFormOpen && (
          <EmployeeGroupForm
            group={editingGroup || null}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

