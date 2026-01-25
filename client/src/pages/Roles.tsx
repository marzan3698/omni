import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Shield, Users, Save, X, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Role {
  id: number;
  name: string;
  permissions: Record<string, boolean>;
  _count: {
    users: number;
  };
}

// All available permissions
const allPermissions = [
  { key: 'can_delete_users', label: 'Delete Users' },
  { key: 'can_edit_users', label: 'Edit Users' },
  { key: 'can_view_users', label: 'View Users' },
  { key: 'can_reply_social', label: 'Reply to Social Messages' },
  { key: 'can_manage_roles', label: 'Manage Roles' },
  { key: 'can_view_reports', label: 'View Reports' },
  { key: 'can_manage_finance', label: 'Manage Finance' },
  { key: 'can_manage_companies', label: 'Manage Companies' },
  { key: 'can_manage_employees', label: 'Manage Employees' },
  { key: 'can_manage_tasks', label: 'Manage Tasks' },
  { key: 'can_manage_leads', label: 'Manage Leads' },
  { key: 'can_manage_inbox', label: 'Manage Inbox' },
  { key: 'can_view_companies', label: 'View Companies' },
  { key: 'can_view_employees', label: 'View Employees' },
  { key: 'can_view_tasks', label: 'View Tasks' },
  { key: 'can_view_leads', label: 'View Leads' },
  { key: 'can_view_finance', label: 'View Finance' },
  { key: 'can_create_leads', label: 'Create Leads' },
  { key: 'can_manage_users', label: 'Manage Users' },
  { key: 'can_view_all_users', label: 'View All Users' },
  { key: 'can_manage_integrations', label: 'Manage Integrations' },
  { key: 'can_view_integrations', label: 'View Integrations' },
  { key: 'can_manage_task_config', label: 'Manage Task Config' },
  { key: 'can_manage_root_items', label: 'Manage Root Items' },
  { key: 'can_manage_lead_config', label: 'Manage Lead Config' },
  { key: 'can_view_all_tasks', label: 'View All Tasks' },
  { key: 'can_assign_tasks_to_anyone', label: 'Assign Tasks to Anyone' },
  { key: 'can_manage_campaigns', label: 'Manage Campaigns' },
  { key: 'can_manage_products', label: 'Manage Products' },
  { key: 'can_manage_payment_settings', label: 'Manage Payment Settings' },
];

export default function Roles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [editingRoleName, setEditingRoleName] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [createRoleName, setCreateRoleName] = useState('');
  const [createRolePermissions, setCreateRolePermissions] = useState<Record<string, boolean>>({});

  // Fetch roles
  const { data: rolesResponse, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await roleApi.getAll();
      return response.data.data as Role[];
    },
  });

  const roles = rolesResponse || [];

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: Record<string, boolean> }) =>
      roleApi.updatePermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      setEditedPermissions({});
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update permissions');
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: ({ name, permissions }: { name: string; permissions: Record<string, boolean> }) =>
      roleApi.create(name, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateModal(false);
      setCreateRoleName('');
      setCreateRolePermissions({});
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create role');
    },
  });

  // Update role name mutation
  const updateRoleNameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      roleApi.updateName(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRoleName(null);
      setNewRoleName('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update role name');
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowDeleteModal(false);
      setDeletingRole(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setEditedPermissions({ ...role.permissions });
  };

  const handlePermissionChange = (permissionKey: string, value: boolean) => {
    setEditedPermissions({
      ...editedPermissions,
      [permissionKey]: value,
    });
  };

  const handleSave = () => {
    if (editingRole) {
      updatePermissionsMutation.mutate({
        id: editingRole.id,
        permissions: editedPermissions,
      });
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setEditedPermissions({});
  };

  const handleCreateRole = () => {
    setShowCreateModal(true);
    setCreateRoleName('');
    // Initialize all permissions to false
    const initialPermissions: Record<string, boolean> = {};
    allPermissions.forEach((perm) => {
      initialPermissions[perm.key] = false;
    });
    setCreateRolePermissions(initialPermissions);
  };

  const handleCreatePermissionChange = (permissionKey: string, value: boolean) => {
    setCreateRolePermissions({
      ...createRolePermissions,
      [permissionKey]: value,
    });
  };

  const handleSaveCreate = () => {
    if (!createRoleName.trim()) {
      alert('Role name is required');
      return;
    }
    createRoleMutation.mutate({
      name: createRoleName.trim(),
      permissions: createRolePermissions,
    });
  };

  const handleEditName = (role: Role) => {
    if (role.name === 'SuperAdmin') {
      alert('Cannot edit SuperAdmin role name');
      return;
    }
    setEditingRoleName(role);
    setNewRoleName(role.name);
  };

  const handleSaveName = () => {
    if (!editingRoleName) return;
    if (!newRoleName.trim()) {
      alert('Role name is required');
      return;
    }
    updateRoleNameMutation.mutate({
      id: editingRoleName.id,
      name: newRoleName.trim(),
    });
  };

  const handleDeleteClick = (role: Role) => {
    if (role.name === 'SuperAdmin') {
      alert('Cannot delete SuperAdmin role');
      return;
    }
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRole) return;
    deleteRoleMutation.mutate(deletingRole.id);
  };

  const isProtectedRole = (roleName: string) => roleName === 'SuperAdmin';

  // Group permissions by category
  const permissionGroups = {
    'User Management': allPermissions.filter((p) => p.key.includes('user') || p.key.includes('User')),
    'Content Management': allPermissions.filter(
      (p) => p.key.includes('company') || p.key.includes('employee') || p.key.includes('lead') || p.key.includes('task') || p.key.includes('campaign')
    ),
    'System Management': allPermissions.filter(
      (p) => p.key.includes('role') || p.key.includes('integration') || p.key.includes('root') || p.key.includes('config')
    ),
    'Access & View': allPermissions.filter((p) => p.key.includes('view') || p.key.includes('report')),
    'Communication': allPermissions.filter((p) => p.key.includes('social') || p.key.includes('inbox')),
    'Finance': allPermissions.filter((p) => p.key.includes('finance')),
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Role & Permissions Management
          </h1>
          <p className="text-gray-600 mt-1">Manage roles and their permissions</p>
        </div>
        <PermissionGuard permission="can_manage_roles">
          <Button onClick={handleCreateRole} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Role
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading roles...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">
                        {editingRoleName?.id === role.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                              className="h-8 w-48"
                              maxLength={50}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveName();
                                } else if (e.key === 'Escape') {
                                  setEditingRoleName(null);
                                  setNewRoleName('');
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveName}
                              disabled={updateRoleNameMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingRoleName(null);
                                setNewRoleName('');
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {role.name}
                            {isProtectedRole(role.name) && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                Protected
                              </span>
                            )}
                          </div>
                        )}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      <Users className="inline h-4 w-4 mr-1" />
                      {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <PermissionGuard permission="can_manage_roles">
                    <div className="flex items-center gap-1">
                      {editingRoleName?.id !== role.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditName(role)}
                          disabled={isProtectedRole(role.name)}
                          title={isProtectedRole(role.name) ? 'Cannot edit SuperAdmin role name' : 'Edit role name'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(role)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Permissions
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(role)}
                        disabled={isProtectedRole(role.name) || role._count.users > 0}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={
                          isProtectedRole(role.name)
                            ? 'Cannot delete SuperAdmin role'
                            : role._count.users > 0
                            ? `Cannot delete: ${role._count.users} user(s) assigned`
                            : 'Delete role'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Permissions:</p>
                  {Object.entries(role.permissions)
                    .filter(([_, value]) => value)
                    .slice(0, 5)
                    .map(([key]) => {
                      const perm = allPermissions.find((p) => p.key === key);
                      return (
                        <span
                          key={key}
                          className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mr-1 mb-1"
                        >
                          {perm?.label || key}
                        </span>
                      );
                    })}
                  {Object.values(role.permissions).filter(Boolean).length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{Object.values(role.permissions).filter(Boolean).length - 5} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Permissions: {editingRole.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Configure permissions for this role. Changes will affect all users with this role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                  <div key={groupName}>
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">{groupName}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex items-center gap-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editedPermissions[perm.key] || false}
                            onChange={(e) => handlePermissionChange(perm.key, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updatePermissionsMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Role</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Create a new role and configure its permissions. All permissions default to disabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Role Name Input */}
                <div>
                  <Label htmlFor="role-name">Role Name *</Label>
                  <Input
                    id="role-name"
                    value={createRoleName}
                    onChange={(e) => setCreateRoleName(e.target.value)}
                    placeholder="e.g., Manager, Sales Rep, Support"
                    maxLength={50}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {createRoleName.length}/50 characters
                  </p>
                </div>

                {/* Permissions */}
                <div className="space-y-6">
                  {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                    <div key={groupName}>
                      <h3 className="font-semibold text-lg mb-3 text-gray-800">{groupName}</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={createRolePermissions[perm.key] || false}
                              onChange={(e) => handleCreatePermissionChange(perm.key, e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCreate}
                  disabled={createRoleMutation.isPending || !createRoleName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Role
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-700">
                  Are you sure you want to delete the role <strong>"{deletingRole.name}"</strong>?
                </p>
                {deletingRole._count.users > 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium mb-1">
                      Cannot delete this role
                    </p>
                    <p className="text-sm text-red-600">
                      {deletingRole._count.users} user(s) are currently assigned to this role. Please reassign these users to another role before deleting.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      This action cannot be undone. All permissions associated with this role will be permanently deleted.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={deleteRoleMutation.isPending || deletingRole._count.users > 0}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

