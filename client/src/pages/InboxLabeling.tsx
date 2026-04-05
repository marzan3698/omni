import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag, Loader2, AlertCircle, Check } from 'lucide-react';
import { socialApi, type InboxLabelPreset } from '@/lib/social';
import Swal from 'sweetalert2';

export default function InboxLabeling() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<InboxLabelPreset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  // Fetch presets
  const { data: presets, isLoading, isError } = useQuery({
    queryKey: ['inboxLabelPresets'],
    queryFn: () => socialApi.getInboxLabelPresets(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => socialApi.createInboxLabelPreset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inboxLabelPresets'] });
      Swal.fire({
        icon: 'success',
        title: 'Label created successfully',
        timer: 1500,
        showConfirmButton: false,
      });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed to create label',
        text: error.message || 'Something went wrong',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      socialApi.updateInboxLabelPreset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inboxLabelPresets'] });
      Swal.fire({
        icon: 'success',
        title: 'Label updated successfully',
        timer: 1500,
        showConfirmButton: false,
      });
      setIsModalOpen(false);
      setEditingPreset(null);
      resetForm();
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed to update label',
        text: error.message || 'Something went wrong',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => socialApi.deleteInboxLabelPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inboxLabelPresets'] });
      Swal.fire({
        icon: 'success',
        title: 'Label deleted successfully',
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed to delete label',
        text: error.message || 'Something went wrong',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3b82f6',
      description: '',
      sortOrder: 0,
      isActive: true,
    });
    setEditingPreset(null);
  };

  const handleEdit = (preset: InboxLabelPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      color: preset.color || '#3b82f6',
      description: preset.description || '',
      sortOrder: preset.sortOrder,
      isActive: preset.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this label?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPreset) {
      updateMutation.mutate({ id: editingPreset.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="text-amber-500" />
            Inbox Labeling (ইনবক্স লেবেলিং)
          </h1>
          <p className="text-slate-400 mt-1">Manage custom labels for your inbox conversations.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-4 h-4" />
          Add Label
        </button>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          Failed to load inbox labels.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets?.map((preset) => (
          <div
            key={preset.id}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-amber-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: preset.color || '#3b82f6' }}
                />
                <h3 className="text-lg font-semibold text-white">{preset.name}</h3>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(preset)}
                  className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg bg-slate-700/50 hover:bg-amber-500/10"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(preset.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg bg-slate-700/50 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {preset.description && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{preset.description}</p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-700/50">
              <span className="flex items-center gap-1">
                Order: {preset.sortOrder}
              </span>
              <span className={preset.isActive ? 'text-green-500 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                {preset.isActive ? (
                  <>
                    <Check className="w-3 h-3" /> Active
                  </>
                ) : (
                  'Inactive'
                )}
              </span>
            </div>
          </div>
        ))}

        {presets?.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl">
            <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No labels created yet. Add one to get started!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/40">
              <h2 className="text-xl font-bold text-white">
                {editingPreset ? 'Edit Label' : 'Add New Label'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Label Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                  placeholder="e.g. L1: New Inquiry"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 border-none rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 resize-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                  placeholder="Bengali instructions or details..."
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-slate-300">Active</span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-amber-900/20"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingPreset ? 'Update Label' : 'Create Label'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
