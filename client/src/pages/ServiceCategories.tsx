import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, Wrench, Upload } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import {
  getServiceCategoryIcon,
  SERVICE_CATEGORY_ICON_OPTIONS,
} from '@/lib/serviceCategoryIcons';
import { cn } from '@/lib/utils';

interface ServiceCategory {
  id: number;
  name: string;
  parentId: number | null;
  parent?: { id: number; name: string } | null;
  children?: { id: number; name: string; iconName: string | null; iconUrl: string | null }[];
  description: string | null;
  iconName: string | null;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [iconMode, setIconMode] = useState<'preset' | 'upload'>('preset');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: null as number | null,
    description: '',
    iconName: 'Wrench' as string,
  });

  const { data: categoriesResponse, isLoading, refetch } = useQuery({
    queryKey: ['service-categories', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await serviceCategoryApi.getAll(user.companyId);
      return response.data.data as ServiceCategory[];
    },
    enabled: !!user?.companyId,
  });

  const categories = categoriesResponse || [];
  const topLevelCategories = categories.filter((c) => !c.parentId);

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; parentId?: number | null; description?: string; iconName?: string }) => {
      if (editingCategory) {
        const payload: Record<string, unknown> = {
          name: data.name,
          parentId: data.parentId ?? null,
          description: data.description || null,
        };
        if (iconMode === 'preset') {
          payload.iconName = data.iconName;
          payload.iconUrl = null;
        } else {
          payload.iconName = null;
          if (!uploadFile && !editingCategory.iconUrl) payload.iconUrl = null;
        }
        return serviceCategoryApi.update(editingCategory.id, payload as any, user?.companyId!);
      }
      return serviceCategoryApi.create({
        name: data.name,
        parentId: data.parentId ?? null,
        description: data.description,
        iconName: iconMode === 'preset' ? data.iconName : undefined,
      });
    },
    onSuccess: async (response, variables) => {
      const data = response.data?.data as ServiceCategory;
      const categoryId = data?.id ?? editingCategory?.id;
      if (categoryId && uploadFile && iconMode === 'upload') {
        try {
          await serviceCategoryApi.uploadIcon(categoryId, uploadFile);
        } catch (e) {
          console.error('Icon upload failed:', e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      setIsModalOpen(false);
      resetForm();
      refetch();
      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to save category';
      alert(msg);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => serviceCategoryApi.delete(id, user?.companyId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      alert('Category deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete category');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', parentId: null, description: '', iconName: 'Wrench' });
    setEditingCategory(null);
    setIconMode('preset');
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenModal = (category?: ServiceCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parentId: category.parentId ?? null,
        description: category.description || '',
        iconName: category.iconName || 'Wrench',
      });
      setIconMode(category.iconUrl ? 'upload' : 'preset');
      setUploadFile(null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }
    if (!user?.companyId) return;
    if (iconMode === 'upload' && !uploadFile && !editingCategory?.iconUrl) {
      alert('Please select an icon or upload an image');
      return;
    }
    saveCategoryMutation.mutate({
      name: formData.name.trim(),
      parentId: formData.parentId,
      description: formData.description?.trim() || undefined,
      iconName: iconMode === 'preset' ? formData.iconName : undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure? Services in this category must be moved or deleted first.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const renderCategoryIcon = (cat: ServiceCategory) => {
    if (cat.iconUrl) {
      return (
        <img
          src={getImageUrl(cat.iconUrl)}
          alt=""
          className="w-8 h-8 object-contain rounded"
        />
      );
    }
    const IconComponent = getServiceCategoryIcon(cat.iconName);
    if (IconComponent) {
      return <IconComponent className="w-8 h-8 text-indigo-600" />;
    }
    return <Wrench className="w-8 h-8 text-slate-400" />;
  };

  return (
    <PermissionGuard
      permission="can_manage_products"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Service Categories</h1>
            <p className="text-slate-600 mt-1">Manage service categories (required for adding services)</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500">No service categories yet</p>
                <p className="text-sm text-slate-400 mt-1">Add a category to create services</p>
                <Button onClick={() => handleOpenModal()} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Category
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 w-16">Icon</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Parent</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-slate-50 rounded">
                            {renderCategoryIcon(category)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {category.parentId ? (
                            <span className="text-slate-500 pl-4">↳ {category.name}</span>
                          ) : (
                            category.name
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {category.parent?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {category.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                              <Trash2 className="w-4 h-4" />
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cat-name">Category Name *</Label>
                    <Input
                      id="cat-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cat-parent">Parent Category (optional)</Label>
                    <select
                      id="cat-parent"
                      value={formData.parentId ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentId: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Top level (no parent) —</option>
                      {topLevelCategories
                        .filter((c) => !editingCategory || c.id !== editingCategory.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Leave empty for main category, or select to create a sub-category</p>
                  </div>
                  <div>
                    <Label htmlFor="cat-desc">Description</Label>
                    <textarea
                      id="cat-desc"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label>Icon</Label>
                    <div className="flex gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setIconMode('preset')}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded border text-sm',
                          iconMode === 'preset'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-slate-600'
                        )}
                      >
                        <Wrench className="w-4 h-4" />
                        Select preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setIconMode('upload')}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded border text-sm',
                          iconMode === 'upload'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-slate-600'
                        )}
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    </div>

                    {iconMode === 'preset' && (
                      <div className="grid grid-cols-8 gap-2 mt-3">
                        {SERVICE_CATEGORY_ICON_OPTIONS.map((opt) => {
                          const IconComp = getServiceCategoryIcon(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, iconName: opt.value })}
                              className={cn(
                                'p-2 rounded border flex items-center justify-center transition-colors',
                                formData.iconName === opt.value
                                  ? 'border-indigo-600 bg-indigo-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              )}
                              title={opt.label}
                            >
                              {IconComp && <IconComp className="w-5 h-5" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {iconMode === 'upload' && (
                      <div className="mt-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="text-sm text-slate-600"
                        />
                        {editingCategory?.iconUrl && !uploadFile && (
                          <p className="text-xs text-slate-500 mt-1">Current icon will be kept if no new file selected.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveCategoryMutation.isPending}>
                      {saveCategoryMutation.isPending ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
