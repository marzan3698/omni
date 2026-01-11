import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ArrowLeft, Edit, User, Building2, FileText, DollarSign, Calendar, Tag, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CampaignDetail {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: string | number;
  type: 'reach' | 'sale' | 'research';
  isActive: boolean;
  companyId: number;
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
  clients?: Array<{
    id: number;
    client: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
  invoices?: Array<{
    id: number;
    invoice: {
      id: number;
      invoiceNumber: string;
      totalAmount: string | number;
      status: 'Paid' | 'Unpaid' | 'Overdue';
      issueDate: string;
      dueDate: string;
    };
  }>;
  products?: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      salePrice: string | number;
      category?: {
        id: number;
        name: string;
      };
    };
  }>;
  groups?: Array<{
    id: number;
    group: {
      id: number;
      name: string;
      description: string;
    };
  }>;
  leads?: Array<{
    id: number;
    value: string | number | null;
  }>;
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) return null;
      const response = await campaignApi.getById(Number(id), user.companyId);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch campaign');
      }
      return response.data.data as CampaignDetail;
    },
    enabled: !!id && !!user?.companyId,
  });

  // Update isActive mutation
  const updateActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!id || !user?.companyId) return;
      return campaignApi.update(Number(id), { isActive }, user.companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-active'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update campaign status');
    },
  });

  const handleActiveToggle = (checked: boolean) => {
    updateActiveMutation.mutate(checked);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reach':
        return 'bg-blue-100 text-blue-700';
      case 'sale':
        return 'bg-green-100 text-green-700';
      case 'research':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <PermissionGuard permission="can_manage_campaigns">
        <div className="p-6">
          <div className="text-center py-12">Loading campaign details...</div>
        </div>
      </PermissionGuard>
    );
  }

  if (error || !campaign) {
    return (
      <PermissionGuard permission="can_manage_campaigns">
        <div className="p-6">
          <div className="text-center py-12 text-red-600">
            {error instanceof Error ? error.message : 'Campaign not found'}
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/campaigns')} variant="outline">
              Back to Campaigns
            </Button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  const totalInvoiceAmount = campaign.invoices?.reduce((sum, ci) => {
    return sum + Number(ci.invoice.totalAmount || 0);
  }, 0) || 0;

  const totalLeadsValue = campaign.leads?.reduce((sum, lead) => {
    return sum + Number(lead.value || 0);
  }, 0) || 0;

  return (
    <PermissionGuard permission="can_manage_campaigns">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/campaigns')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{campaign.name}</h1>
              <p className="text-slate-600 mt-1">Campaign Details</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Active/Inactive Toggle */}
            <div className="flex items-center gap-3">
              <Label htmlFor="active-toggle" className="text-sm font-medium">
                {campaign.isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="active-toggle"
                checked={campaign.isActive}
                onCheckedChange={handleActiveToggle}
                disabled={updateActiveMutation.isPending}
              />
            </div>
            <Button onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Campaign
            </Button>
          </div>
        </div>

        {/* Campaign Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Budget</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ৳{Number(campaign.budget).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Tag className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Type</p>
                  <p className="text-2xl font-bold text-slate-900 capitalize">{campaign.type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Invoices</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {campaign.invoices?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Leads</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {campaign.leads?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Information */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Description</Label>
                  <p className="mt-1 text-slate-900">
                    {campaign.description || 'No description provided'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Start Date</Label>
                    <p className="mt-1 text-slate-900">
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">End Date</Label>
                    <p className="mt-1 text-slate-900">
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Created At</Label>
                    <p className="mt-1 text-slate-900">
                      {new Date(campaign.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                    <p className="mt-1 text-slate-900">
                      {new Date(campaign.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            {campaign.project && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Project Title</Label>
                    <p className="mt-1 text-slate-900 font-medium">{campaign.project.title}</p>
                  </div>
                  {campaign.project.client && (
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Client Name</Label>
                      <p className="mt-1 text-slate-900">
                        {campaign.project.client.name || campaign.project.client.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Client Information */}
            {campaign.clients && campaign.clients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaign.clients.map((cc) => (
                      <div key={cc.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {cc.client.name || 'Unnamed Client'}
                            </p>
                            <p className="text-sm text-slate-600">{cc.client.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoice Information */}
            {campaign.invoices && campaign.invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaign.invoices.map((ci) => (
                      <div key={ci.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              Invoice #{ci.invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-slate-600">
                              ৳{Number(ci.invoice.totalAmount).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ci.invoice.status)}`}>
                            {ci.invoice.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Issue Date: </span>
                            {new Date(ci.invoice.issueDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Due Date: </span>
                            {new Date(ci.invoice.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">Total Invoice Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                          ৳{totalInvoiceAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            {campaign.products && campaign.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {campaign.products.map((cp) => (
                      <div key={cp.id} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-900">{cp.product.name}</p>
                            {cp.product.category && (
                              <p className="text-sm text-slate-600">{cp.product.category.name}</p>
                            )}
                          </div>
                          <p className="font-medium text-green-600">
                            ৳{Number(cp.product.salePrice).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employee Groups */}
            {campaign.groups && campaign.groups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Employee Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {campaign.groups.map((cg) => (
                      <div key={cg.id} className="p-3 border border-slate-200 rounded-lg">
                        <p className="font-medium text-slate-900">{cg.group.name}</p>
                        {cg.group.description && (
                          <p className="text-sm text-slate-600 mt-1">{cg.group.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Campaign Status */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Campaign Type</Label>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(campaign.type)}`}>
                      {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Budget</span>
                  <span className="font-medium text-slate-900">
                    ৳{Number(campaign.budget).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Invoices</span>
                  <span className="font-medium text-slate-900">
                    ৳{totalInvoiceAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Leads Value</span>
                  <span className="font-medium text-green-600">
                    ৳{totalLeadsValue.toLocaleString()}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">Remaining Budget</span>
                    <span className={`font-bold ${
                      Number(campaign.budget) - totalInvoiceAmount >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ৳{(Number(campaign.budget) - totalInvoiceAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

