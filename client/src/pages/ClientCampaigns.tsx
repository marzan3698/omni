import { useQuery } from '@tanstack/react-query';
import { clientCampaignsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Calendar, DollarSign, Package, TrendingUp, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ClientCampaigns() {
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ['client-campaigns'],
    queryFn: async () => {
      const response = await clientCampaignsApi.getMyCampaigns();
      return response.data.data || [];
    },
  });

  const campaigns = campaignsResponse || [];

  // Calculate campaign status
  const getCampaignStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-500' };
    } else if (now > end) {
      return { label: 'Ended', color: 'bg-gray-500' };
    } else {
      return { label: 'Active', color: 'bg-green-500' };
    }
  };

  // Get campaign type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reach: 'Reach Campaign',
      sale: 'Sales Campaign',
      research: 'Research Campaign',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Campaigns</h1>
        <p className="text-slate-600 mt-1">Track your assigned campaigns and their progress</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No campaigns assigned yet</p>
            <p className="text-slate-400 text-sm mt-2">You'll see your campaigns here once they're assigned</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign: any) => {
            const status = getCampaignStatus(campaign.startDate, campaign.endDate);
            const totalLeads = campaign.leads?.length || 0;
            const totalProducts = campaign.products?.length || 0;
            const totalInvoices = campaign.invoices?.length || 0;

            return (
              <Card key={campaign.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <Badge className={`${status.color} text-white`}>
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {campaign.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Main Campaign Info */}
                    <div className="grid md:grid-cols-3 gap-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Type</p>
                          <p className="text-sm font-medium text-slate-900">{getTypeLabel(campaign.type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Duration</p>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <DollarSign className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Budget</p>
                          <p className="text-sm font-medium text-slate-900">
                            ${Number(campaign.budget).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-slate-500">Leads</p>
                          <p className="text-lg font-semibold text-slate-900">{totalLeads}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-500">Products</p>
                          <p className="text-lg font-semibold text-slate-900">{totalProducts}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-slate-500">Invoices</p>
                          <p className="text-lg font-semibold text-slate-900">{totalInvoices}</p>
                        </div>
                      </div>
                    </div>

                    {/* Project Info */}
                    {campaign.project && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-slate-500 mb-1">Related Project</p>
                        <p className="text-sm font-medium text-slate-900">{campaign.project.title}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
