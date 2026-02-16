import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadCategoryApi, leadInterestApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, ListChecks, Tag, Sparkles } from 'lucide-react';

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

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <ListChecks className="h-8 w-8 text-amber-400" />
            Lead Configuration
          </h1>
          <p className="text-amber-200/80 mt-1">Manage lead categories and interests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-amber-500/30 border border-amber-500 text-amber-100'
              : 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20'
          }`}
        >
          <Tag className="inline h-4 w-4 mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'interests'
              ? 'bg-amber-500/30 border border-amber-500 text-amber-100'
              : 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20'
          }`}
        >
          <Sparkles className="inline h-4 w-4 mr-2" />
          Interests
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
                <Tag className="h-5 w-5 text-amber-400" />
                Lead Categories
              </h2>
              <PermissionGuard permission="can_manage_lead_config">
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryFormData({ name: '', isActive: true });
                    setIsCategoryModalOpen(true);
                  }}
                  className={btnOutline}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </PermissionGuard>
            </div>

            {categoriesLoading ? (
              <div className="py-12 text-center text-amber-200/80 animate-pulse">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center text-amber-200/70 border border-amber-500/20 rounded-lg">
                No categories found
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, i) => (
                  <GameCard key={category.id} index={i}>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-100">{category.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              category.isActive
                                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/30'
                                : 'bg-slate-700/60 text-amber-200/70 border border-amber-500/20'
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
                              className={btnOutline}
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
                              className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </PermissionGuard>
                      </div>
                    </div>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {/* Interests Tab */}
      {activeTab === 'interests' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Lead Interests
              </h2>
              <PermissionGuard permission="can_manage_lead_config">
                <Button
                  onClick={() => {
                    setEditingInterest(null);
                    setInterestFormData({ name: '', isActive: true });
                    setIsInterestModalOpen(true);
                  }}
                  className={btnOutline}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Interest
                </Button>
              </PermissionGuard>
            </div>

            {interestsLoading ? (
              <div className="py-12 text-center text-amber-200/80 animate-pulse">Loading interests...</div>
            ) : interests.length === 0 ? (
              <div className="py-12 text-center text-amber-200/70 border border-amber-500/20 rounded-lg">
                No interests found
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {interests.map((interest, i) => (
                  <GameCard key={interest.id} index={i}>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-100">{interest.name}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              interest.isActive
                                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/30'
                                : 'bg-slate-700/60 text-amber-200/70 border border-amber-500/20'
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
                              className={btnOutline}
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
                              className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </PermissionGuard>
                      </div>
                    </div>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md game-panel rounded-xl overflow-hidden border border-amber-500/30">
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-amber-100">{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} className="text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="category-name" className="text-amber-200/90">Category Name</Label>
                <Input id="category-name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} required className={inputDark} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="category-active" checked={categoryFormData.isActive} onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })} className="rounded border-amber-500/50 bg-slate-800/60 text-amber-500" />
                <Label htmlFor="category-active" className="text-amber-200/90">Active</Label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} className={btnOutline}>Cancel</Button>
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interest Modal */}
      {isInterestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md game-panel rounded-xl overflow-hidden border border-amber-500/30">
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-amber-100">{editingInterest ? 'Edit Interest' : 'Create Interest'}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setIsInterestModalOpen(false); setEditingInterest(null); }} className="text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleInterestSubmit} className="p-6 space-y-4">
              <div>
                <Label htmlFor="interest-name" className="text-amber-200/90">Interest Name</Label>
                <Input id="interest-name" value={interestFormData.name} onChange={(e) => setInterestFormData({ ...interestFormData, name: e.target.value })} required className={inputDark} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="interest-active" checked={interestFormData.isActive} onChange={(e) => setInterestFormData({ ...interestFormData, isActive: e.target.checked })} className="rounded border-amber-500/50 bg-slate-800/60 text-amber-500" />
                <Label htmlFor="interest-active" className="text-amber-200/90">Active</Label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsInterestModalOpen(false); setEditingInterest(null); }} className={btnOutline}>Cancel</Button>
                <Button type="submit" disabled={createInterestMutation.isPending || updateInterestMutation.isPending} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">
                  {editingInterest ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

