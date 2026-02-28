import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadCategoryApi, leadInterestApi, leadPriorityApi, leadLabelApi, leadStatusConfigApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, ListChecks, Tag, Sparkles, Flag, Bookmark, FlagTriangleRight } from 'lucide-react';
import type { LeadPriority, LeadLabel, LeadStatusConfig } from '@/types';

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
  const [activeTab, setActiveTab] = useState<'categories' | 'interests' | 'priorities' | 'labels' | 'statuses'>('categories');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [editingPriority, setEditingPriority] = useState<LeadPriority | null>(null);
  const [editingLabel, setEditingLabel] = useState<LeadLabel | null>(null);
  const [editingStatus, setEditingStatus] = useState<LeadStatusConfig | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', isActive: true });
  const [interestFormData, setInterestFormData] = useState({ name: '', isActive: true });
  const [priorityFormData, setPriorityFormData] = useState({ name: '', sortOrder: 0, isActive: true });
  const [labelFormData, setLabelFormData] = useState({ name: '', color: '', isActive: true });
  const [statusFormData, setStatusFormData] = useState({ name: '', code: '', sortOrder: 0, isActive: true });

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

  const { data: prioritiesResponse, isLoading: prioritiesLoading } = useQuery({
    queryKey: ['lead-priorities'],
    queryFn: async () => {
      const response = await leadPriorityApi.getAll();
      return response.data.data as LeadPriority[];
    },
    enabled: !!user?.companyId,
  });

  const { data: labelsResponse, isLoading: labelsLoading } = useQuery({
    queryKey: ['lead-labels'],
    queryFn: async () => {
      const response = await leadLabelApi.getAll();
      return response.data.data as LeadLabel[];
    },
    enabled: !!user?.companyId,
  });

  const { data: statusesResponse, isLoading: statusesLoading } = useQuery({
    queryKey: ['lead-statuses'],
    queryFn: async () => {
      const response = await leadStatusConfigApi.getAll();
      return response.data.data as LeadStatusConfig[];
    },
    enabled: !!user?.companyId,
  });

  const categories = categoriesResponse || [];
  const interests = interestsResponse || [];
  const priorities = prioritiesResponse || [];
  const labels = labelsResponse || [];
  const statuses = statusesResponse || [];

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

  const createPriorityMutation = useMutation({
    mutationFn: (data: { name: string; sortOrder?: number; isActive?: boolean }) => leadPriorityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-priorities'] });
      setIsPriorityModalOpen(false);
      setPriorityFormData({ name: '', sortOrder: 0, isActive: true });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leadPriorityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-priorities'] });
      setIsPriorityModalOpen(false);
      setEditingPriority(null);
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: (id: number) => leadPriorityApi.delete(id, user?.companyId || 0),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-priorities'] }),
  });

  const createLabelMutation = useMutation({
    mutationFn: (data: { name: string; color?: string; isActive?: boolean }) => leadLabelApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-labels'] });
      setIsLabelModalOpen(false);
      setLabelFormData({ name: '', color: '', isActive: true });
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leadLabelApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-labels'] });
      setIsLabelModalOpen(false);
      setEditingLabel(null);
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id: number) => leadLabelApi.delete(id, user?.companyId || 0),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-labels'] }),
  });

  const createStatusMutation = useMutation({
    mutationFn: (data: { name: string; code: string; sortOrder?: number; isActive?: boolean }) => leadStatusConfigApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-statuses'] });
      setIsStatusModalOpen(false);
      setStatusFormData({ name: '', code: '', sortOrder: 0, isActive: true });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => leadStatusConfigApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-statuses'] });
      setIsStatusModalOpen(false);
      setEditingStatus(null);
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: (id: number) => leadStatusConfigApi.delete(id, user?.companyId || 0),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-statuses'] }),
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

  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPriority) {
      updatePriorityMutation.mutate({ id: editingPriority.id, data: priorityFormData });
    } else {
      createPriorityMutation.mutate(priorityFormData);
    }
  };

  const handleLabelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLabel) {
      updateLabelMutation.mutate({ id: editingLabel.id, data: { ...labelFormData, color: labelFormData.color || undefined } });
    } else {
      createLabelMutation.mutate({ ...labelFormData, color: labelFormData.color || undefined });
    }
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatus) {
      updateStatusMutation.mutate({ id: editingStatus.id, data: statusFormData });
    } else {
      createStatusMutation.mutate(statusFormData);
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
          <p className="text-amber-200/80 mt-1">Manage lead categories, interests, priorities, labels and statuses</p>
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
        <button
          onClick={() => setActiveTab('priorities')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'priorities'
              ? 'bg-amber-500/30 border border-amber-500 text-amber-100'
              : 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20'
          }`}
        >
          <Flag className="inline h-4 w-4 mr-2" />
          Priorities
        </button>
        <button
          onClick={() => setActiveTab('labels')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'labels'
              ? 'bg-amber-500/30 border border-amber-500 text-amber-100'
              : 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20'
          }`}
        >
          <Bookmark className="inline h-4 w-4 mr-2" />
          Labels
        </button>
        <button
          onClick={() => setActiveTab('statuses')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'statuses'
              ? 'bg-amber-500/30 border border-amber-500 text-amber-100'
              : 'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20'
          }`}
        >
          <FlagTriangleRight className="inline h-4 w-4 mr-2" />
          Lead Status
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

      {activeTab === 'priorities' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
                <Flag className="h-5 w-5 text-amber-400" />
                Lead Priorities
              </h2>
              <PermissionGuard permission="can_manage_lead_config">
                <Button onClick={() => { setEditingPriority(null); setPriorityFormData({ name: '', sortOrder: 0, isActive: true }); setIsPriorityModalOpen(true); }} className={btnOutline}>
                  <Plus className="mr-2 h-4 w-4" />Add Priority
                </Button>
              </PermissionGuard>
            </div>
            {prioritiesLoading ? (
              <div className="py-12 text-center text-amber-200/80 animate-pulse">Loading...</div>
            ) : priorities.length === 0 ? (
              <div className="py-12 text-center text-amber-200/70 border border-amber-500/20 rounded-lg">No priorities found</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {priorities.map((p, i) => (
                  <GameCard key={p.id} index={i}>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-amber-100">{p.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${p.isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-700/60 text-amber-200/70'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <PermissionGuard permission="can_manage_lead_config">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingPriority(p); setPriorityFormData({ name: p.name, sortOrder: p.sortOrder, isActive: p.isActive }); setIsPriorityModalOpen(true); }} className={btnOutline}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => confirm('Delete this priority?') && deletePriorityMutation.mutate(p.id)} className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </PermissionGuard>
                    </div>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {activeTab === 'labels' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
                <Bookmark className="h-5 w-5 text-amber-400" />
                Lead Labels
              </h2>
              <PermissionGuard permission="can_manage_lead_config">
                <Button onClick={() => { setEditingLabel(null); setLabelFormData({ name: '', color: '', isActive: true }); setIsLabelModalOpen(true); }} className={btnOutline}>
                  <Plus className="mr-2 h-4 w-4" />Add Label
                </Button>
              </PermissionGuard>
            </div>
            {labelsLoading ? (
              <div className="py-12 text-center text-amber-200/80 animate-pulse">Loading...</div>
            ) : labels.length === 0 ? (
              <div className="py-12 text-center text-amber-200/70 border border-amber-500/20 rounded-lg">No labels found</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {labels.map((l, i) => (
                  <GameCard key={l.id} index={i}>
                    <div className="p-4 flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {l.color && <span className="w-4 h-4 rounded-full border border-amber-500/30" style={{ backgroundColor: l.color }} />}
                        <div>
                          <h3 className="font-semibold text-amber-100">{l.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${l.isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-700/60 text-amber-200/70'}`}>
                            {l.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <PermissionGuard permission="can_manage_lead_config">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingLabel(l); setLabelFormData({ name: l.name, color: l.color || '', isActive: l.isActive }); setIsLabelModalOpen(true); }} className={btnOutline}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => confirm('Delete this label?') && deleteLabelMutation.mutate(l.id)} className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </PermissionGuard>
                    </div>
                  </GameCard>
                ))}
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {activeTab === 'statuses' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
                <FlagTriangleRight className="h-5 w-5 text-amber-400" />
                Lead Statuses (Won & Lost cannot be edited or deleted)
              </h2>
              <PermissionGuard permission="can_manage_lead_config">
                <Button onClick={() => { setEditingStatus(null); setStatusFormData({ name: '', code: '', sortOrder: 0, isActive: true }); setIsStatusModalOpen(true); }} className={btnOutline}>
                  <Plus className="mr-2 h-4 w-4" />Add Status
                </Button>
              </PermissionGuard>
            </div>
            {statusesLoading ? (
              <div className="py-12 text-center text-amber-200/80 animate-pulse">Loading...</div>
            ) : statuses.length === 0 ? (
              <div className="py-12 text-center text-amber-200/70 border border-amber-500/20 rounded-lg">No statuses found</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statuses.map((s, i) => (
                  <GameCard key={s.id} index={i}>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-amber-100">{s.name}</h3>
                        <span className="text-xs text-amber-200/70">code: {s.code}</span>
                        {s.isSystem && <span className="ml-2 text-xs px-2 py-1 rounded-full bg-amber-500/30 text-amber-200">System</span>}
                      </div>
                      {!s.isSystem && (
                        <PermissionGuard permission="can_manage_lead_config">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingStatus(s); setStatusFormData({ name: s.name, code: s.code, sortOrder: s.sortOrder, isActive: s.isActive }); setIsStatusModalOpen(true); }} className={btnOutline}><Edit className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => confirm('Delete this status?') && deleteStatusMutation.mutate(s.id)} className="bg-slate-800/60 border-red-500/50 text-red-300 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </PermissionGuard>
                      )}
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

      {/* Priority Modal */}
      {isPriorityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md game-panel rounded-xl overflow-hidden border border-amber-500/30">
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-amber-100">{editingPriority ? 'Edit Priority' : 'Create Priority'}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setIsPriorityModalOpen(false); setEditingPriority(null); }} className="text-amber-200/80 hover:text-amber-100"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handlePrioritySubmit} className="p-6 space-y-4">
              <div>
                <Label className="text-amber-200/90">Priority Name</Label>
                <Input value={priorityFormData.name} onChange={(e) => setPriorityFormData({ ...priorityFormData, name: e.target.value })} required className={inputDark} />
              </div>
              <div>
                <Label className="text-amber-200/90">Sort Order</Label>
                <Input type="number" value={priorityFormData.sortOrder} onChange={(e) => setPriorityFormData({ ...priorityFormData, sortOrder: parseInt(e.target.value) || 0 })} className={inputDark} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={priorityFormData.isActive} onChange={(e) => setPriorityFormData({ ...priorityFormData, isActive: e.target.checked })} className="rounded border-amber-500/50 bg-slate-800/60 text-amber-500" />
                <Label className="text-amber-200/90">Active</Label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsPriorityModalOpen(false); setEditingPriority(null); }} className={btnOutline}>Cancel</Button>
                <Button type="submit" disabled={createPriorityMutation.isPending || updatePriorityMutation.isPending} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">{editingPriority ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Label Modal */}
      {isLabelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md game-panel rounded-xl overflow-hidden border border-amber-500/30">
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-amber-100">{editingLabel ? 'Edit Label' : 'Create Label'}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setIsLabelModalOpen(false); setEditingLabel(null); }} className="text-amber-200/80 hover:text-amber-100"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleLabelSubmit} className="p-6 space-y-4">
              <div>
                <Label className="text-amber-200/90">Label Name</Label>
                <Input value={labelFormData.name} onChange={(e) => setLabelFormData({ ...labelFormData, name: e.target.value })} required className={inputDark} />
              </div>
              <div>
                <Label className="text-amber-200/90">Color (hex, e.g. #3b82f6)</Label>
                <Input value={labelFormData.color} onChange={(e) => setLabelFormData({ ...labelFormData, color: e.target.value })} placeholder="#3b82f6" className={inputDark} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={labelFormData.isActive} onChange={(e) => setLabelFormData({ ...labelFormData, isActive: e.target.checked })} className="rounded border-amber-500/50 bg-slate-800/60 text-amber-500" />
                <Label className="text-amber-200/90">Active</Label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsLabelModalOpen(false); setEditingLabel(null); }} className={btnOutline}>Cancel</Button>
                <Button type="submit" disabled={createLabelMutation.isPending || updateLabelMutation.isPending} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">{editingLabel ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md game-panel rounded-xl overflow-hidden border border-amber-500/30">
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-amber-100">{editingStatus ? 'Edit Status' : 'Create Status'}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setIsStatusModalOpen(false); setEditingStatus(null); }} className="text-amber-200/80 hover:text-amber-100"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              <div>
                <Label className="text-amber-200/90">Status Name</Label>
                <Input value={statusFormData.name} onChange={(e) => setStatusFormData({ ...statusFormData, name: e.target.value })} required className={inputDark} placeholder="e.g. In Progress" />
              </div>
              <div>
                <Label className="text-amber-200/90">Code (alphanumeric, e.g. InProgress)</Label>
                <Input value={statusFormData.code} onChange={(e) => setStatusFormData({ ...statusFormData, code: e.target.value.replace(/\s/g, '') })} required className={inputDark} placeholder="e.g. InProgress" disabled={!!editingStatus?.isSystem} />
              </div>
              <div>
                <Label className="text-amber-200/90">Sort Order</Label>
                <Input type="number" value={statusFormData.sortOrder} onChange={(e) => setStatusFormData({ ...statusFormData, sortOrder: parseInt(e.target.value) || 0 })} className={inputDark} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={statusFormData.isActive} onChange={(e) => setStatusFormData({ ...statusFormData, isActive: e.target.checked })} className="rounded border-amber-500/50 bg-slate-800/60 text-amber-500" />
                <Label className="text-amber-200/90">Active</Label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => { setIsStatusModalOpen(false); setEditingStatus(null); }} className={btnOutline}>Cancel</Button>
                <Button type="submit" disabled={createStatusMutation.isPending || updateStatusMutation.isPending} className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium">{editingStatus ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

