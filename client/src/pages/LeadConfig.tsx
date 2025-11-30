import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadCategoryApi, leadInterestApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  isActive: boolean;
  companyId: number;
}

interface Interest {
  id: number;
  name: string;
  isActive: boolean;
  companyId: number;
}

export default function LeadConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'interests'>('categories');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', isActive: true });
  const [interestFormData, setInterestFormData] = useState({ name: '', isActive: true });

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['lead-categories'],
    queryFn: async () => {
      const response = await leadCategoryApi.getAll(user?.companyId || 0);
      return response.data.data as Category[];
    },
    enabled: !!user?.companyId,
  });

  // Fetch interests
  const { data: interestsResponse, isLoading: interestsLoading } = useQuery({
    queryKey: ['lead-interests'],
    queryFn: async () => {
      const response = await leadInterestApi.getAll(user?.companyId || 0);
      return response.data.data as Interest[];
    },
    enabled: !!user?.companyId,
  });

  const categories = categoriesResponse || [];
  const interests = interestsResponse || [];

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; isActive?: boolean }) => leadCategoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-categories'] });
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '', isActive: true });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leadCategoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-categories'] });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', isActive: true });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => leadCategoryApi.delete(id, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-categories'] });
    },
  });

  // Interest mutations
  const createInterestMutation = useMutation({
    mutationFn: (data: { name: string; isActive?: boolean }) => leadInterestApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-interests'] });
      setIsInterestModalOpen(false);
      setInterestFormData({ name: '', isActive: true });
    },
  });

  const updateInterestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leadInterestApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-interests'] });
      setIsInterestModalOpen(false);
      setEditingInterest(null);
      setInterestFormData({ name: '', isActive: true });
    },
  });

  const deleteInterestMutation = useMutation({
    mutationFn: (id: number) => leadInterestApi.delete(id, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-interests'] });
    },
  });

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInterest) {
      updateInterestMutation.mutate({ id: editingInterest.id, data: interestFormData });
    } else {
      createInterestMutation.mutate(interestFormData);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lead Configuration</h1>
        <p className="text-gray-600 mt-1">Manage lead categories and interests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'categories'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'interests'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Interests
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lead Categories</h2>
            <PermissionGuard permission="can_manage_lead_config">
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', isActive: true });
                  setIsCategoryModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </PermissionGuard>
          </div>

          {categoriesLoading ? (
            <div className="text-center py-12">Loading categories...</div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No categories found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{category.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            category.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <PermissionGuard permission="can_manage_lead_config">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryFormData({ name: category.name, isActive: category.isActive });
                              setIsCategoryModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this category?')) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </PermissionGuard>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interests Tab */}
      {activeTab === 'interests' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Lead Interests</h2>
            <PermissionGuard permission="can_manage_lead_config">
              <Button
                onClick={() => {
                  setEditingInterest(null);
                  setInterestFormData({ name: '', isActive: true });
                  setIsInterestModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Interest
              </Button>
            </PermissionGuard>
          </div>

          {interestsLoading ? (
            <div className="text-center py-12">Loading interests...</div>
          ) : interests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No interests found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {interests.map((interest) => (
                <Card key={interest.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{interest.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            interest.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {interest.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <PermissionGuard permission="can_manage_lead_config">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingInterest(interest);
                              setInterestFormData({ name: interest.name, isActive: interest.isActive });
                              setIsInterestModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this interest?')) {
                                deleteInterestMutation.mutate(interest.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </PermissionGuard>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="category-active"
                    checked={categoryFormData.isActive}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="category-active">Active</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      setEditingCategory(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interest Modal */}
      {isInterestModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingInterest ? 'Edit Interest' : 'Create Interest'}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsInterestModalOpen(false);
                    setEditingInterest(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInterestSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="interest-name">Interest Name</Label>
                  <Input
                    id="interest-name"
                    value={interestFormData.name}
                    onChange={(e) => setInterestFormData({ ...interestFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="interest-active"
                    checked={interestFormData.isActive}
                    onChange={(e) => setInterestFormData({ ...interestFormData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="interest-active">Active</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsInterestModalOpen(false);
                      setEditingInterest(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createInterestMutation.isPending || updateInterestMutation.isPending}>
                    {editingInterest ? 'Update' : 'Create'}
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

