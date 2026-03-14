import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { campaignApi, projectApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Megaphone, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ProductSearch } from '@/components/ProductSearch';
import { GroupSelector } from '@/components/GroupSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: string | number;
  type: 'reach' | 'sale' | 'research';
  companyId: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    title: string;
    clientId: string;
    client?: {
      id: string;
      email: string;
      name: string | null;
    };
  };
  invoices?: Array<{
    invoice: {
      id: number;
      invoiceNumber: string;
      totalAmount: number;
      status: string;
    };
  }>;
  groups?: Array<{
    group: {
      id: number;
      name: string;
      description: string;
    };
  }>;
}

interface Project {
  id: number;
  title: string;
  clientId: string;
  status?: string;
  client?: {
    id: string;
    email: string;
    name: string | null;
  };
  invoices?: Array<{
    id: number;
    invoiceNumber: string;
    totalAmount: number | string;
    status: string;
  }>;
}

export default function CampaignForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    type: 'sale' as 'reach' | 'sale' | 'research',
    projectId: '',
    productIds: [] as number[],
    groupIds: [] as number[],
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch campaign data if editing
  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id || !user?.companyId) return null;
      const response = await campaignApi.getById(Number(id), user.companyId);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch campaign');
      }
      return response.data.data as Campaign;
    },
    enabled: isEditMode && !!user?.companyId,
  });

  // Fetch projects
  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getAll();
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
      // Filter projects by company for non-SuperAdmin users and by status
      let projects = (response.data.data || []) as Project[];
      
      // Filter by company for non-SuperAdmin users
      if (user?.roleName !== 'SuperAdmin' && user?.companyId) {
        projects = projects.filter((p: any) => p.companyId === user.companyId);
      }
      
      // Filter by status - exclude projects with status "Completed"
      projects = projects.filter((p: any) => p.status !== 'Completed');
      
      return projects;
    },
    enabled: !!user,
  });

  const projects = projectsResponse || [];

  // Update form data when campaign data is loaded
  useEffect(() => {
    if (campaignData) {
      const productIds: number[] = [];
      if (campaignData.products && Array.isArray(campaignData.products)) {
        campaignData.products.forEach((cp: any) => {
          const productId = cp.product?.id || cp.productId || cp.id;
          if (productId && typeof productId === 'number') {
            productIds.push(productId);
          }
        });
      }

      const groupIds: number[] = [];
      if (campaignData.groups && Array.isArray(campaignData.groups)) {
        campaignData.groups.forEach((cg: any) => {
          const groupId = cg.group?.id || cg.groupId || cg.id;
          if (groupId && typeof groupId === 'number') {
            groupIds.push(groupId);
          }
        });
      }

      const project = projects.find((p) => p.id === campaignData.projectId);
      if (project) {
        setSelectedProject(project);
      }

      setFormData({
        name: campaignData.name || '',
        description: campaignData.description || '',
        startDate: campaignData.startDate ? new Date(campaignData.startDate).toISOString().split('T')[0] : '',
        endDate: campaignData.endDate ? new Date(campaignData.endDate).toISOString().split('T')[0] : '',
        budget: String(campaignData.budget || ''),
        type: campaignData.type || 'sale',
        projectId: String(campaignData.projectId || ''),
        productIds: productIds,
        groupIds: groupIds,
      });
    }
  }, [campaignData, projects]);

  // Handle project selection
  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === Number(projectId));
    setSelectedProject(project || null);
    
    // Auto-calculate budget from project invoices (only for new campaigns or when manually changing project)
    let calculatedBudget = '';
    if (project && project.invoices && project.invoices.length > 0) {
      const totalAmount = project.invoices.reduce((sum, invoice) => {
        return sum + Number(invoice.totalAmount || 0);
      }, 0);
      calculatedBudget = totalAmount.toFixed(2);
    }
    
    // Only auto-fill budget if it's a new campaign (not in edit mode) or if budget is currently empty
    const shouldAutoFillBudget = !isEditMode || !formData.budget;
    
    setFormData({ 
      ...formData, 
      projectId,
      budget: (shouldAutoFillBudget && calculatedBudget) ? calculatedBudget : formData.budget,
    });
  };

  // Create/Update mutation
  const saveCampaignMutation = useMutation({
    mutationFn: (data: any) => {
      const submitData = {
        ...data,
        companyId: user?.companyId,
        projectId: Number(data.projectId),
        productIds: formData.productIds,
        groupIds: formData.groupIds,
      };
      if (isEditMode && id) {
        return campaignApi.update(Number(id), submitData, user?.companyId || 0);
      }
      return campaignApi.create(submitData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns-all'] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns-active'] });
      await queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      navigate('/campaigns');
      alert(isEditMode ? 'Campaign updated successfully!' : 'Campaign created successfully!');
    },
    onError: (error: any) => {
      console.error('Campaign save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save campaign';
      alert(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert('Campaign name is required');
      return;
    }
    if (!formData.startDate) {
      alert('Start date is required');
      return;
    }
    if (!formData.endDate) {
      alert('End date is required');
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }
    if (!formData.budget || Number(formData.budget) <= 0) {
      alert('Budget must be greater than 0');
      return;
    }
    if (!formData.projectId) {
      alert('Project selection is required');
      return;
    }

    saveCampaignMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: Number(formData.budget),
      type: formData.type,
      projectId: formData.projectId,
    });
  };

  if (campaignLoading || projectsLoading) {
    return (
      <div className="p-12 text-center text-amber-200/60 animate-pulse">লোড হচ্ছে...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/campaigns')}
            className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm flex items-center gap-2">
              <Megaphone className="h-8 w-8 text-amber-500" />
              {isEditMode ? 'Edit Campaign' : 'Create Campaign'}
            </h1>
            <p className="text-amber-200/80 mt-1">
              {isEditMode ? 'Update campaign details' : 'Launch a new marketing campaign'}
            </p>
          </div>
        </div>
      </div>

      <DashboardWidgetCard index={0}>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-amber-100">Campaign Details</h2>
          <p className="text-amber-200/40 text-xs mt-1">
            {isEditMode
              ? 'Update the campaign information'
              : 'Complete the form to initialize your campaign'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Selection */}
          <div className="space-y-4">
            <Label htmlFor="projectId" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
              Target Project <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={handleProjectChange}
              disabled={isEditMode}
            >
              <SelectTrigger className="bg-slate-900/50 border-amber-500/20 text-amber-100 h-12">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-amber-500/20 text-amber-100">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)} className="hover:bg-amber-500/10 focus:bg-amber-500/10">
                    {project.title} {project.client?.name ? `(${project.client.name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProject && (
              <div className="text-xs p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center text-amber-200/60">
                  <span className="uppercase tracking-widest font-bold">Client</span>
                  <span className="text-amber-100 font-bold">{selectedProject.client?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-amber-200/60">
                  <span className="uppercase tracking-widest font-bold">Client Email</span>
                  <span className="text-amber-100 font-mono">{selectedProject.client?.email || 'N/A'}</span>
                </div>
                {selectedProject.invoices && selectedProject.invoices.length > 0 && (
                  <div className="flex justify-between items-center text-amber-200/60">
                    <span className="uppercase tracking-widest font-bold">Total Invoice Amount</span>
                    <span className="text-emerald-400 font-bold">৳{selectedProject.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 flex items-center gap-2 text-blue-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Project details synchronized</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
                required
                className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40 h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
                Campaign Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'reach' | 'sale' | 'research') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="bg-slate-900/50 border-amber-500/20 text-amber-100 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-amber-500/20 text-amber-100">
                  <SelectItem value="sale" className="focus:bg-amber-500/10">Sale</SelectItem>
                  <SelectItem value="reach" className="focus:bg-amber-500/10">Reach</SelectItem>
                  <SelectItem value="research" className="focus:bg-amber-500/10">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter campaign objectives..."
              rows={4}
              className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40 transition-all resize-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="bg-slate-900/50 border-amber-500/20 text-amber-100 h-10 [color-scheme:dark]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="bg-slate-900/50 border-amber-500/20 text-amber-100 h-10 [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
                Budget (৳) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Enter budget"
                required
                className="bg-slate-900/50 border-amber-500/20 text-emerald-400 placeholder:text-amber-900/40 h-10 font-bold"
              />
            </div>
          </div>

          <div className="border-t border-amber-500/10 pt-8 space-y-8">
            <div className="space-y-2">
              <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Products (Optional)</Label>
              <ProductSearch
                companyId={user?.companyId || 0}
                selectedProductIds={formData.productIds}
                onSelectionChange={(productIds) =>
                  setFormData({ ...formData, productIds })
                }
              />
            </div>

            {user?.companyId && (
              <div className="space-y-2">
                <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Employee Groups (Optional)</Label>
                <GroupSelector
                  companyId={user.companyId}
                  selectedGroupIds={formData.groupIds}
                  onSelectionChange={(groupIds) =>
                    setFormData({ ...formData, groupIds })
                  }
                />
              </div>
            )}
          </div>

          {isEditMode && campaignData?.invoices && campaignData.invoices.length > 0 && (
            <div className="space-y-2 pt-6 border-t border-amber-500/10">
              <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Assigned Invoices</Label>
              <div className="p-4 bg-slate-900/50 border border-amber-500/5 rounded-xl space-y-3">
                {campaignData.invoices.map((ci) => (
                  <div key={ci.invoice.id} className="flex justify-between items-center text-xs">
                    <span className="text-amber-100 font-mono tracking-wider">{ci.invoice.invoiceNumber}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-emerald-400 font-bold">৳{Number(ci.invoice.totalAmount).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase text-[8px] font-bold">
                        {ci.invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8 border-t border-amber-500/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/campaigns')}
              className="px-8 bg-slate-800 border-amber-500/20 text-amber-200/60 hover:text-amber-100 font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveCampaignMutation.isPending}
              className="px-8 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveCampaignMutation.isPending
                ? 'Saving...'
                : isEditMode
                ? 'Update Campaign'
                : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DashboardWidgetCard>
    </div>
  );
}
