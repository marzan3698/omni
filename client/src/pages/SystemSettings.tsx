import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, Settings } from 'lucide-react';

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  companyId: number;
}

export default function SystemSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
  });

  // Fetch settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await systemSettingApi.getAll(user?.companyId || 0);
      return response.data.data as SystemSetting[];
    },
    enabled: !!user?.companyId,
  });

  const settings = settingsResponse || [];

  // Create/Update mutation
  const upsertMutation = useMutation({
    mutationFn: (data: { key: string; value: string; description?: string }) =>
      systemSettingApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setIsModalOpen(false);
      setEditingSetting(null);
      setFormData({ key: '', value: '', description: '' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (key: string) => systemSettingApi.delete(key, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      key: formData.key,
      value: formData.value,
      description: formData.description || undefined,
    });
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    if (confirm('Are you sure you want to delete this setting?')) {
      deleteMutation.mutate(key);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage root items and system configuration</p>
        </div>
        <PermissionGuard permission="can_manage_root_items">
          <Button
            onClick={() => {
              setEditingSetting(null);
              setFormData({ key: '', value: '', description: '' });
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Setting
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading settings...</div>
      ) : settings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No settings found. Add your first setting to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{setting.key}</CardTitle>
                    {setting.description && (
                      <CardDescription className="mt-1">{setting.description}</CardDescription>
                    )}
                  </div>
                  <PermissionGuard permission="can_manage_root_items">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(setting.key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700 break-words">{setting.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingSetting ? 'Edit Setting' : 'Create Setting'}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSetting(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="setting-key">Key</Label>
                  <Input
                    id="setting-key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    required
                    disabled={!!editingSetting}
                    placeholder="e.g., site_name"
                  />
                  {editingSetting && (
                    <p className="text-xs text-gray-500 mt-1">Key cannot be changed after creation</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="setting-value">Value</Label>
                  <textarea
                    id="setting-value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter setting value"
                  />
                </div>
                <div>
                  <Label htmlFor="setting-description">Description (Optional)</Label>
                  <Input
                    id="setting-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this setting"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSetting(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={upsertMutation.isPending}>
                    {editingSetting ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

