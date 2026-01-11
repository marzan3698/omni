import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Campaign {
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
  leads?: Array<{ id: number; value: string | number | null }>;
}

export default function Campaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch campaigns
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ['campaigns', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getAll(user.companyId);
      return response.data.data as Campaign[];
    },
    enabled: !!user?.companyId,
  });

  const campaigns = campaignsResponse || [];

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

  const handleView = (campaign: Campaign) => {
    navigate(`/campaigns/${campaign.id}`);
  };

  const handleEdit = (campaign: Campaign) => {
    navigate(`/campaigns/${campaign.id}/edit`);
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

  const isActiveByDate = (campaign: Campaign) => {
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
          <Button onClick={() => navigate('/campaigns/new')}>
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
                              ৳{Number(campaign.budget).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              campaign.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {campaign.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(campaign)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(campaign)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(campaign.id)}
                                title="Delete"
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
      </div>
    </PermissionGuard>
  );
}
