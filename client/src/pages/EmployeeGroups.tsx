import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GamePanel } from '@/components/GamePanel';
import { employeeGroupApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeGroupForm } from '@/components/EmployeeGroupForm';
import { EmployeeGroupViewModal } from '@/components/EmployeeGroupViewModal';
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
  const { id: urlId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EmployeeGroup | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<number | null>(null);

  // Fetch single group when viewing/editing via URL (e.g. /employee-groups/123)
  const groupId = urlId ? parseInt(urlId, 10) : null;
  const { data: singleGroup, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: ['employee-group', groupId, user?.companyId],
    queryFn: async () => {
      if (!groupId || !user?.companyId) return null;
      const response = await employeeGroupApi.getById(groupId, user.companyId);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch employee group');
      }
      return response.data.data as EmployeeGroup & { members?: Array<{ employee: { id: number } }> };
    },
    enabled: !!groupId && !!user?.companyId && !isNaN(groupId),
  });

  // When single group loads from URL, open the form
  useEffect(() => {
    if (singleGroup && groupId) {
      setEditingGroup(singleGroup as EmployeeGroup);
      setIsFormOpen(true);
    }
  }, [singleGroup, groupId]);

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
    if (urlId) navigate('/employee-groups');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
    if (urlId) navigate('/employee-groups');
  };

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

  if (isLoading) {
    return (
      <PermissionGuard permission="can_manage_employees">
        <div className="p-6">
          <div className="flex items-center justify-center h-64 text-amber-200/80 animate-pulse">
            Loading employee groups...
          </div>
        </div>
      </PermissionGuard>
    );
  }

  // Show error when fetching single group by URL failed (e.g. not found)
  if (groupId && singleError) {
    return (
      <PermissionGuard permission="can_manage_employees">
        <div className="p-6">
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
            <p className="font-medium">Employee group not found</p>
            <p className="text-sm mt-1 opacity-90">{singleError instanceof Error ? singleError.message : 'The group may have been deleted or you do not have access.'}</p>
            <Button onClick={() => navigate('/employee-groups')} className={`mt-3 ${btnOutline}`} size="sm">
              Back to Employee Groups
            </Button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  if (error) {
    return (
      <PermissionGuard permission="can_manage_employees">
        <div className="p-6">
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
            <p className="font-medium">Error loading employee groups</p>
            <p className="text-sm mt-1 opacity-90">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
            <Button onClick={() => window.location.reload()} className={`mt-3 ${btnOutline}`} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="can_manage_employees">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
              <Users className="h-8 w-8 text-amber-400" />
              Employee Groups
            </h1>
            <p className="text-amber-200/80 mt-1">Manage employee groups and assign them to campaigns</p>
          </div>
          <Button onClick={handleCreate} className={`flex items-center gap-2 ${btnOutline}`}>
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>

        {/* Groups List */}
        <GamePanel>
          {groups.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-14 h-14 text-amber-500/40 mx-auto mb-4" />
              <p className="text-amber-200/70 mb-4">No employee groups found</p>
              <Button onClick={handleCreate} className={btnOutline}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-amber-500/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Campaigns
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-amber-200/90 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-amber-400 mr-2" />
                          <div className="text-sm font-medium text-amber-100">{group.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-amber-200/80 max-w-md truncate">
                          {group.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-amber-100">
                          {group._count?.members || 0} member{group._count?.members !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-amber-100">
                          {group._count?.campaigns ?? 0} campaign{group._count?.campaigns !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-amber-200/80">
                          {group.creator.name || group.creator.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-amber-200/70">
                          {new Date(group.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingGroupId(group.id)} className={btnOutline}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(group)} className={btnOutline}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                            className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20"
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
        </GamePanel>

        {isFormOpen && (
          <EmployeeGroupForm
            group={editingGroup || null}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}

        {viewingGroupId && (
          <EmployeeGroupViewModal
            groupId={viewingGroupId}
            onClose={() => setViewingGroupId(null)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

