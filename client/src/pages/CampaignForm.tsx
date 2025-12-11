import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { campaignApi, projectApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
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
      
      // Filter by status - only show projects with status "StartedWorking"
      projects = projects.filter((p: any) => p.status === 'StartedWorking');
      
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
    setFormData({ ...formData, projectId });
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
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/campaigns')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditMode
            ? 'Update campaign details and settings'
            : 'Create a new campaign and assign it to a project'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Update the campaign information below'
              : 'Fill in the campaign information below. The client and invoices will be automatically assigned from the selected project.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection (Required) */}
            <div className="space-y-2">
              <Label htmlFor="projectId">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={handleProjectChange}
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.title} {project.client?.name ? `(${project.client.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="text-sm text-muted-foreground mt-2 p-3 bg-slate-50 rounded-md">
                  <p>
                    <strong>Client:</strong> {selectedProject.client?.name || selectedProject.client?.email || 'N/A'}
                  </p>
                  <p className="mt-1">
                    <strong>Client Email:</strong> {selectedProject.client?.email || 'N/A'}
                  </p>
                  <p className="mt-1 text-blue-600">
                    ✓ Client and invoices from this project will be automatically assigned to the campaign
                  </p>
                </div>
              )}
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter campaign description"
                rows={4}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Budget and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">
                  Budget <span className="text-red-500">*</span>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">
                  Campaign Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'reach' | 'sale' | 'research') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="reach">Reach</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Products (Optional)</Label>
              <ProductSearch
                companyId={user?.companyId || 0}
                selectedProductIds={formData.productIds}
                onSelectionChange={(productIds) =>
                  setFormData({ ...formData, productIds })
                }
              />
            </div>

            {/* Employee Group Selection (Optional) */}
            {user?.companyId && (
              <div className="space-y-2">
                <Label>Employee Groups (Optional)</Label>
                <GroupSelector
                  companyId={user.companyId}
                  selectedGroupIds={formData.groupIds}
                  onSelectionChange={(groupIds) =>
                    setFormData({ ...formData, groupIds })
                  }
                />
              </div>
            )}

            {/* Display assigned invoices if editing */}
            {isEditMode && campaignData?.invoices && campaignData.invoices.length > 0 && (
              <div className="space-y-2">
                <Label>Assigned Invoices</Label>
                <div className="p-3 bg-slate-50 rounded-md">
                  {campaignData.invoices.map((ci) => (
                    <div key={ci.invoice.id} className="text-sm mb-2">
                      <strong>{ci.invoice.invoiceNumber}</strong> - ${ci.invoice.totalAmount} (
                      {ci.invoice.status})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/campaigns')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveCampaignMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {saveCampaignMutation.isPending
                  ? 'Saving...'
                  : isEditMode
                  ? 'Update Campaign'
                  : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

