import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Calendar, DollarSign } from 'lucide-react';

export function ClientCampaigns() {
  const { user } = useAuth();

  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ['client-campaigns'],
    queryFn: async () => {
      // Get all campaigns and filter client's campaigns
      const response = await campaignApi.getAll(user?.companyId || 0);
      const allCampaigns = response.data.data || [];
      // Filter campaigns where client is assigned
      return allCampaigns.filter((campaign: any) =>
        campaign.clients?.some((cc: any) => cc.clientId === user?.id)
      );
    },
    enabled: !!user?.companyId,
  });

  const campaigns = campaignsResponse || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Campaigns</h1>
        <p className="text-slate-600 mt-1">Campaigns you are assigned to</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : campaigns.length === 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="text-center py-8 text-slate-500">
            No campaigns assigned yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id} className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle>{campaign.name}</CardTitle>
                <CardDescription>{campaign.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-slate-600">{campaign.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-slate-600">
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-slate-600">
                      ${Number(campaign.budget).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
