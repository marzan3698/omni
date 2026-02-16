import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
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

  const darkModal = {
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    boxShadow: '0 0 0 1px rgba(217,119,6,0.3), 0 25px 50px -12px rgba(0,0,0,0.7)',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-100">
            <Settings className="h-8 w-8 text-amber-400" />
            System Settings
          </h1>
          <p className="text-amber-200/80 mt-1">Manage root items and system configuration</p>
        </div>
        <PermissionGuard permission="can_manage_root_items">
          <Button
            onClick={() => {
              setEditingSetting(null);
              setFormData({ key: '', value: '', description: '' });
              setIsModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Setting
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-amber-200/80">Loading settings...</div>
      ) : settings.length === 0 ? (
        <GamePanel>
          <div className="py-12 text-center text-amber-200/70">No settings found. Add your first setting to get started.</div>
        </GamePanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settings.map((setting, idx) => (
            <GameCard key={setting.id} index={idx}>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-100">{setting.key}</h3>
                    {setting.description && (
                      <p className="mt-1 text-sm text-amber-200/70">{setting.description}</p>
                    )}
                  </div>
                  <PermissionGuard permission="can_manage_root_items">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                        className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(setting.key)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>
                <div className="mt-4 p-3 rounded-md bg-slate-800/60 border border-amber-500/20">
                  <p className="text-sm text-amber-100 break-words">{setting.value}</p>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl overflow-hidden" style={darkModal}>
            <div className="p-6 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-100">{editingSetting ? 'Edit Setting' : 'Create Setting'}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSetting(null);
                  }}
                  className="text-amber-100 hover:bg-amber-500/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="setting-key" className="text-amber-200/90">Key</Label>
                  <Input
                    id="setting-key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    required
                    disabled={!!editingSetting}
                    placeholder="e.g., site_name"
                    className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 mt-1"
                  />
                  {editingSetting && (
                    <p className="text-xs text-amber-200/60 mt-1">Key cannot be changed after creation</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="setting-value" className="text-amber-200/90">Value</Label>
                  <textarea
                    id="setting-value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    className="w-full min-h-[100px] px-3 py-2 border border-amber-500/20 rounded-md bg-slate-800/60 text-amber-100 placeholder-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 mt-1"
                    placeholder="Enter setting value"
                  />
                </div>
                <div>
                  <Label htmlFor="setting-description" className="text-amber-200/90">Description (Optional)</Label>
                  <Input
                    id="setting-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this setting"
                    className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSetting(null);
                    }}
                    className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={upsertMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
                  >
                    {editingSetting ? 'Update' : 'Create'}
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

