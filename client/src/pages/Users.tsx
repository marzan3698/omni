import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, Search, LogIn } from 'lucide-react';

interface User {
  id: string;
  email: string;
  roleId: number;
  companyId: number;
  profileImage: string | null;
  role: {
    id: number;
    name: string;
    permissions: Record<string, boolean>;
  };
  company: {
    id: number;
    name: string;
  };
  employee: any;
}

export default function Users() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    roleId: 0,
    companyId: user?.companyId || 0,
  });

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userApi.getAll();
      return response.data.data as User[];
    },
  });

  // Fetch roles for dropdown
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      // This would need a roles API endpoint
      return [];
    },
    enabled: false, // Disabled for now, will need roles API
  });

  const users = usersResponse || [];
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      setFormData({ email: '', password: '', roleId: 0, companyId: user?.companyId || 0 });
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setFormData({ email: '', password: '', roleId: 0, companyId: user?.companyId || 0 });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      roleId: user.roleId,
      companyId: user.companyId,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleLoginAs = async (userItem: User) => {
    if (userItem.id === user?.id) {
      alert('You are already logged in as this user.');
      return;
    }
    try {
      const response = await userApi.loginAsUser(userItem.id);
      if (response.data.success && response.data.data?.token) {
        const { token, user: targetUser } = response.data.data;
        localStorage.setItem('token', token);
        const redirectUrl = targetUser?.roleName === 'Client' ? '/client/dashboard' : '/dashboard';
        window.location.href = redirectUrl;
      } else {
        alert(response.data.message || 'Login as user failed');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Login as user failed');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100">User Management</h1>
          <p className="text-amber-200/80 mt-1">Manage system users and their roles</p>
        </div>
        <PermissionGuard permission="can_manage_users">
          <Button
            onClick={() => {
              setEditingUser(null);
              setFormData({ email: '', password: '', roleId: 0, companyId: user?.companyId || 0 });
              setIsCreateModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500/60 h-4 w-4" />
        <Input
          placeholder="Search users by email or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 focus-visible:ring-amber-500/50"
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center py-12 text-amber-200/80">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <GamePanel>
          <div className="py-12 text-center text-amber-200/70">No users found</div>
        </GamePanel>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((userItem, idx) => (
            <GameCard key={userItem.id} index={idx}>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-500/50 bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                        <span className="text-amber-100 font-semibold">
                          {userItem.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-amber-50">{userItem.email}</h3>
                        <p className="text-sm text-amber-200/80">
                          {userItem.role.name} • {userItem.company.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.roleName === 'SuperAdmin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoginAs(userItem)}
                        title="Login as this user"
                        className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Login as
                      </Button>
                    )}
                    <PermissionGuard permission="can_manage_users">
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(userItem)}
                          className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(userItem.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="w-full max-w-md rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              boxShadow: '0 0 0 1px rgba(217,119,6,0.3), 0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div className="p-6 border-b border-amber-500/20">
              <h2 className="text-xl font-semibold text-amber-100">{editingUser ? 'Edit User' : 'Create User'}</h2>
              <p className="text-sm text-amber-200/70 mt-1">
                {editingUser ? 'Update user information' : 'Add a new user to the system'}
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-amber-200/90">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-amber-200/90">{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={6}
                    className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="roleId" className="text-amber-200/90">Role</Label>
                  <Input
                    id="roleId"
                    type="number"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                    required
                    placeholder="Role ID (1=Admin, 2=Manager, etc.)"
                    className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

