import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Shield, Users, Save, X, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

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
  { key: 'can_approve_clients', label: 'Client Setup (ক্লায়েন্ট সেটাপ - Approve Pending Clients)' },
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
  { key: 'can_edit_leads', label: 'Edit Leads (লিড এডিট করা)' },
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
  // Invoice Management
  { key: 'can_manage_invoices', label: 'Invoice Management (ইনভয়েজ ম্যানেজমেন্ট)' },
  { key: 'can_view_clients', label: 'View Clients (ক্লায়েন্ট দেখা)' },
  { key: 'can_manage_clients', label: 'Manage Clients (ক্লায়েন্ট ম্যানেজ)' },
  { key: 'can_view_products', label: 'View Products (প্রোডাক্ট দেখা)' },
  // Project Management
  { key: 'can_manage_projects', label: 'Project Management (প্রজেক্ট ম্যানেজমেন্ট)' },
  { key: 'can_view_services', label: 'View Services (সার্ভিস দেখা)' },
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

  const INVOICE_DEPENDENT_PERMISSIONS = ['can_view_clients', 'can_manage_clients', 'can_view_products'];
  const PROJECT_DEPENDENT_PERMISSIONS = ['can_view_clients', 'can_manage_clients', 'can_view_services'];

  const handlePermissionChange = (permissionKey: string, value: boolean) => {
    const next = { ...editedPermissions, [permissionKey]: value };
    if (permissionKey === 'can_manage_invoices' && value) {
      INVOICE_DEPENDENT_PERMISSIONS.forEach((p) => {
        next[p] = true;
      });
    }
    if (permissionKey === 'can_manage_projects' && value) {
      PROJECT_DEPENDENT_PERMISSIONS.forEach((p) => {
        next[p] = true;
      });
    }
    setEditedPermissions(next);
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
    const next = { ...createRolePermissions, [permissionKey]: value };
    if (permissionKey === 'can_manage_invoices' && value) {
      INVOICE_DEPENDENT_PERMISSIONS.forEach((p) => {
        next[p] = true;
      });
    }
    if (permissionKey === 'can_manage_projects' && value) {
      PROJECT_DEPENDENT_PERMISSIONS.forEach((p) => {
        next[p] = true;
      });
    }
    setCreateRolePermissions(next);
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
    if (role.name === 'Lead Manager') {
      alert('Cannot edit Lead Manager role name');
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
    if (role.name === 'Lead Manager') {
      alert('Cannot delete Lead Manager role');
      return;
    }
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRole) return;
    deleteRoleMutation.mutate(deletingRole.id);
  };

  const isProtectedRole = (roleName: string) => roleName === 'SuperAdmin' || roleName === 'Lead Manager';

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
    'Finance': allPermissions.filter((p) => p.key.includes('finance') || p.key.includes('payment')),
    'Invoice Management (ইনভয়েজ ম্যানেজমেন্ট)': allPermissions.filter(
      (p) =>
        p.key === 'can_manage_invoices' ||
        p.key === 'can_view_clients' ||
        p.key === 'can_manage_clients' ||
        p.key === 'can_view_products'
    ),
    'Project Management (প্রজেক্ট ম্যানেজমেন্ট)': allPermissions.filter(
      (p) =>
        p.key === 'can_manage_projects' ||
        p.key === 'can_view_services'
    ),
    'Client Setup (ক্লায়েন্ট সেটাপ)': allPermissions.filter((p) => p.key.includes('approve')),
  };

  const modalBase = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';
  const modalPanel = 'w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl';
  const modalPanelSm = 'w-full max-w-md rounded-xl overflow-hidden';
  const darkPanel = {
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    boxShadow: '0 0 0 1px rgba(217,119,6,0.3), 0 25px 50px -12px rgba(0,0,0,0.7)',
  };
  const permLabel =
    'flex items-center gap-2 p-3 border border-amber-500/20 rounded-md hover:bg-amber-500/10 cursor-pointer bg-slate-800/40';
  const permLabelText = 'text-sm text-amber-100';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-100">
            <Shield className="h-8 w-8 text-amber-400" />
            Role & Permissions Management
          </h1>
          <p className="text-amber-200/80 mt-1">Manage roles and their permissions</p>
        </div>
        <PermissionGuard permission="can_manage_roles">
          <Button
            onClick={handleCreateRole}
            className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Role
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-amber-200/80">Loading roles...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role, idx) => (
            <GameCard key={role.id} index={idx}>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-semibold text-amber-100">
                        {editingRoleName?.id === role.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                              className="h-8 w-48 bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50"
                              maxLength={50}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                else if (e.key === 'Escape') {
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
                              className="text-amber-100 hover:bg-amber-500/20"
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
                              className="text-amber-100 hover:bg-amber-500/20"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{role.name}</span>
                            {isProtectedRole(role.name) && (
                              <span className="px-2 py-0.5 bg-red-500/25 text-red-300 text-xs font-medium rounded-full border border-red-500/30">
                                Protected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-amber-200/80">
                      <Users className="inline h-4 w-4 mr-1" />
                      {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <PermissionGuard permission="can_manage_roles">
                    <div className="flex items-center gap-1">
                      {editingRoleName?.id !== role.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditName(role)}
                          disabled={isProtectedRole(role.name)}
                          title={isProtectedRole(role.name) ? `Cannot edit ${role.name} role name` : 'Edit role name'}
                          className="text-amber-100 hover:bg-amber-500/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(role)}
                        className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Permissions
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(role)}
                        disabled={isProtectedRole(role.name) || role._count.users > 0}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        title={
                          isProtectedRole(role.name)
                            ? `Cannot delete ${role.name} role`
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
                <div className="space-y-2 mt-4 pt-4 border-t border-amber-500/10">
                  <p className="text-sm font-medium text-amber-200/90 mb-2">Key Permissions:</p>
                  {Object.entries(role.permissions)
                    .filter(([_, value]) => value)
                    .slice(0, 5)
                    .map(([key]) => {
                      const perm = allPermissions.find((p) => p.key === key);
                      return (
                        <span
                          key={key}
                          className="inline-block px-2 py-1 bg-amber-500/25 text-amber-200 text-xs rounded-full mr-1 mb-1 border border-amber-500/20"
                        >
                          {perm?.label || key}
                        </span>
                      );
                    })}
                  {Object.values(role.permissions).filter(Boolean).length > 5 && (
                    <span className="text-xs text-amber-200/60">
                      +{Object.values(role.permissions).filter(Boolean).length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingRole && (
        <div className={modalBase}>
          <div className={modalPanel} style={darkPanel}>
            <div className="p-6 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-100">Edit Permissions: {editingRole.name}</h2>
                <Button variant="ghost" size="icon" onClick={handleCancel} className="text-amber-100 hover:bg-amber-500/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-amber-200/70 mt-1">
                Configure permissions for this role. Changes will affect all users with this role.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                  <div key={groupName}>
                    <h3 className="font-semibold text-lg mb-3 text-amber-200/90">{groupName}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {permissions.map((perm) => (
                        <label key={perm.key} className={permLabel}>
                          <input
                            type="checkbox"
                            checked={editedPermissions[perm.key] || false}
                            onChange={(e) => handlePermissionChange(perm.key, e.target.checked)}
                            className="rounded border-amber-500/40 accent-amber-500"
                          />
                          <span className={permLabelText}>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-amber-500/20">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updatePermissionsMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className={modalBase}>
          <div className={modalPanel} style={darkPanel}>
            <div className="p-6 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-100">Create New Role</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="text-amber-100 hover:bg-amber-500/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-amber-200/70 mt-1">
                Create a new role and configure its permissions. All permissions default to disabled.
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="role-name" className="text-amber-200/90">Role Name *</Label>
                  <Input
                    id="role-name"
                    value={createRoleName}
                    onChange={(e) => setCreateRoleName(e.target.value)}
                    placeholder="e.g., Manager, Sales Rep, Support"
                    maxLength={50}
                    className="mt-1 bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50"
                  />
                  <p className="text-xs text-amber-200/60 mt-1">{createRoleName.length}/50 characters</p>
                </div>
                <div className="space-y-6">
                  {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                    <div key={groupName}>
                      <h3 className="font-semibold text-lg mb-3 text-amber-200/90">{groupName}</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {permissions.map((perm) => (
                          <label key={perm.key} className={permLabel}>
                            <input
                              type="checkbox"
                              checked={createRolePermissions[perm.key] || false}
                              onChange={(e) => handleCreatePermissionChange(perm.key, e.target.checked)}
                              className="rounded border-amber-500/40 accent-amber-500"
                            />
                            <span className={permLabelText}>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-amber-500/20">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCreate}
                  disabled={createRoleMutation.isPending || !createRoleName.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRole && (
        <div className={modalBase}>
          <div className={modalPanelSm} style={darkPanel}>
            <div className="p-6 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Role
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteModal(false)} className="text-amber-100 hover:bg-amber-500/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-amber-100">
                  Are you sure you want to delete the role <strong className="text-amber-200">"{deletingRole.name}"</strong>?
                </p>
                {deletingRole._count.users > 0 ? (
                  <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
                    <p className="text-sm text-red-300 font-medium mb-1">Cannot delete this role</p>
                    <p className="text-sm text-red-200/90">
                      {deletingRole._count.users} user(s) are currently assigned to this role. Please reassign these users to another role before deleting.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                    <p className="text-sm text-amber-200">
                      This action cannot be undone. All permissions associated with this role will be permanently deleted.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-amber-500/20">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={deleteRoleMutation.isPending || deletingRole._count.users > 0}
                  className="bg-red-600 hover:bg-red-500 text-white border-red-500/50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

