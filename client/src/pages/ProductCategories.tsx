import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, FolderTree } from 'lucide-react';

interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProductCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch categories
  const { data: categoriesResponse, isLoading, refetch } = useQuery({
    queryKey: ['product-categories', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productCategoryApi.getAll(user.companyId);
      return response.data.data as ProductCategory[];
    },
    enabled: !!user?.companyId,
  });

  const categories = categoriesResponse || [];

  // Create/Update mutation
  const saveCategoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingCategory) {
        return productCategoryApi.update(editingCategory.id, data, user?.companyId || 0);
      }
      return productCategoryApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      setIsModalOpen(false);
      resetForm();
      refetch();
      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
    },
    onError: (error: any) => {
      console.error('Category save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save category';
      alert(errorMessage);
    },
  });

  // Delete mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => productCategoryApi.delete(id, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      alert('Category deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete category');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setEditingCategory(null);
  };

  const handleOpenModal = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
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

    if (!user?.companyId) {
      alert('User company ID is missing');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
    };

    saveCategoryMutation.mutate(submitData);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  return (
    <PermissionGuard 
      permission="can_manage_products"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to access this page.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Product Categories</h1>
            <p className="text-slate-600 mt-1">Manage product categories</p>
          </div>
          <Button onClick={() => navigate('/product-categories/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories Table */}
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
                <FolderTree className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500">No categories found</p>
                <Button onClick={() => navigate('/product-categories/new')} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Category
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{category.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-600">
                            {category.description || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-500">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                            >
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

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name *</Label>
                    <Input
                      id="category-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <textarea
                      id="category-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter category description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveCategoryMutation.isPending}>
                      {saveCategoryMutation.isPending
                        ? 'Saving...'
                        : editingCategory
                        ? 'Update'
                        : 'Create'}
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

