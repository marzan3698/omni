import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Shield, Users, Save, X } from 'lucide-react';

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
];

export default function Roles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, boolean>>({});

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

  // Group permissions by category
  const permissionGroups = {
    'User Management': allPermissions.filter((p) => p.key.includes('user') || p.key.includes('User')),
    'Content Management': allPermissions.filter(
      (p) => p.key.includes('company') || p.key.includes('employee') || p.key.includes('lead') || p.key.includes('task')
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Role & Permissions Management
        </h1>
        <p className="text-gray-600 mt-1">Manage roles and their permissions</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading roles...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{role.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Users className="inline h-4 w-4 mr-1" />
                      {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <PermissionGuard permission="can_manage_roles">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
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
    </div>
  );
}

