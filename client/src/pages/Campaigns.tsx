import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, Eye, Megaphone, TrendingUp, Target, Users, Calendar } from 'lucide-react';

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

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'reach':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'sale':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'research':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusStyle = (isActive: boolean) => {
    return isActive 
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
      : 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <PermissionGuard permission="can_manage_campaigns">
      <div className="space-y-6">
        <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm flex items-center gap-2">
              <Megaphone className="h-8 w-8 text-amber-500" />
              Campaigns
            </h1>
            <p className="text-amber-200/80 mt-1">Manage marketing campaigns</p>
          </div>
          <Button 
            onClick={() => navigate('/campaigns/new')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Campaign
          </Button>
        </div>

        {/* Campaigns List */}
        <DashboardWidgetCard index={0}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-amber-100">All Campaigns ({campaigns.length})</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-amber-200/60 animate-pulse">Loading campaigns...</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-amber-200/40 italic">
              No campaigns found. Create your first campaign to get started.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="text-left py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">Name</th>
                    <th className="text-left py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">Type</th>
                    <th className="text-left py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">Start Date</th>
                    <th className="text-left py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">End Date</th>
                    <th className="text-left py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">Budget</th>
                    <th className="text-left py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">Status</th>
                    <th className="text-right py-4 px-6 font-bold text-amber-500/40 uppercase tracking-widest text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/5">
                  {campaigns.map((campaign) => {
                    return (
                      <tr key={campaign.id} className="group hover:bg-amber-500/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-amber-100">{campaign.name}</div>
                          {campaign.description && (
                            <div className="text-xs text-amber-200/40 truncate max-w-xs mt-0.5">
                              {campaign.description}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getTypeStyle(campaign.type)}`}>
                            {campaign.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-amber-200/70 text-sm">
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-amber-200/70 text-sm">
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-emerald-400 text-sm">
                            ৳{Number(campaign.budget).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(campaign.isActive)}`}>
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(campaign)}
                              className="h-8 w-8 text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(campaign)}
                              className="h-8 w-8 text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(campaign.id)}
                              className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
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
        </DashboardWidgetCard>
      </div>
    </PermissionGuard>
  );
}
