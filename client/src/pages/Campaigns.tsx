import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { campaignApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, Megaphone } from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: string | number;
  type: 'reach' | 'sale' | 'research';
  companyId: number;
  createdAt: string;
  updatedAt: string;
  leads?: Array<{ id: number; value: string | number | null }>;
}

export default function Campaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    type: 'sale' as 'reach' | 'sale' | 'research',
  });

  // Fetch campaigns
  const { data: campaignsResponse, isLoading, refetch } = useQuery({
    queryKey: ['campaigns', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getAll(user.companyId);
      return response.data.data as Campaign[];
    },
    enabled: !!user?.companyId,
  });

  const campaigns = campaignsResponse || [];

  // Create/Update mutation
  const saveCampaignMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingCampaign) {
        return campaignApi.update(editingCampaign.id, data, user?.companyId || 0);
      }
      return campaignApi.create({ ...data, companyId: user?.companyId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns-all'] });
      await queryClient.invalidateQueries({ queryKey: ['campaigns-active'] });
      await queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      setIsModalOpen(false);
      resetForm();
      refetch();
      // Navigate back to campaigns list after successful creation
      if (location.pathname === '/campaigns/new') {
        navigate('/campaigns');
      }
      alert(editingCampaign ? 'Campaign updated successfully!' : 'Campaign created successfully!');
    },
    onError: (error: any) => {
      console.error('Campaign save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save campaign';
      alert(errorMessage);
    },
  });

  // Delete mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: (id: number) => campaignApi.delete(id, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-all'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-active'] });
      alert('Campaign deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete campaign');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      budget: '',
      type: 'sale',
    });
    setEditingCampaign(null);
  };

  // Open modal if route is /campaigns/new
  useEffect(() => {
    if (location.pathname === '/campaigns/new') {
      setIsModalOpen(true);
      setEditingCampaign(null);
      resetForm();
    } else if (location.pathname === '/campaigns') {
      setIsModalOpen(false);
    }
  }, [location.pathname]);

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0],
        budget: String(campaign.budget),
        type: campaign.type,
      });
      setIsModalOpen(true);
    } else {
      navigate('/campaigns/new');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
    if (location.pathname === '/campaigns/new') {
      navigate('/campaigns');
    }
    if (location.pathname === '/campaigns/new') {
      navigate('/campaigns');
    }
  };

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
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      alert('Budget must be greater than 0');
      return;
    }

    // Check date validation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate >= endDate) {
      alert('End date must be after start date');
      return;
    }

    if (!user?.companyId) {
      alert('Company ID not found. Please refresh and try again.');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: parseFloat(formData.budget),
      type: formData.type,
      companyId: user.companyId,
    };

    console.log('Submitting campaign data:', submitData);
    saveCampaignMutation.mutate(submitData);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaignMutation.mutate(id);
    }
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

  const isActive = (campaign: Campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    return startDate <= now && endDate >= now;
  };

  return (
    <PermissionGuard permission="can_manage_campaigns">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
            <p className="text-slate-600 mt-1">Manage marketing campaigns</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Campaign
          </Button>
        </div>

        {/* Campaigns List */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">All Campaigns ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-500">Loading campaigns...</div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No campaigns found. Create your first campaign to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">End Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Budget</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => {
                      const active = isActive(campaign);
                      const totalLeads = campaign.leads?.length || 0;
                      return (
                        <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-sm text-slate-500 truncate max-w-xs">
                                {campaign.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(campaign.type)}`}>
                              {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(campaign.startDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-green-600">
                              ${Number(campaign.budget).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(campaign)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(campaign.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget *</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Campaign Type *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="reach">Reach</option>
                      <option value="sale">Sale</option>
                      <option value="research">Research</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveCampaignMutation.isPending}>
                      {saveCampaignMutation.isPending ? 'Saving...' : editingCampaign ? 'Update' : 'Create'}
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

