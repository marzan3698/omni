import { useQuery } from '@tanstack/react-query';
import { clientCampaignsApi } from '@/lib/api';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { Target, Calendar, DollarSign, Package, TrendingUp, FileText } from 'lucide-react';

export function ClientCampaigns() {
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ['client-campaigns'],
    queryFn: async () => {
      const response = await clientCampaignsApi.getMyCampaigns();
      return response.data.data || [];
    },
  });

  const campaigns = campaignsResponse || [];

  // Calculate campaign status (dark theme compatible)
  const getCampaignStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-500/30 text-blue-300' };
    } else if (now > end) {
      return { label: 'Ended', color: 'bg-slate-500/30 text-slate-400' };
    } else {
      return { label: 'Active', color: 'bg-green-500/30 text-green-300' };
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
        <h1 className="text-3xl font-bold text-amber-100">My Campaigns</h1>
        <p className="text-slate-300 mt-1">Track your assigned campaigns and their progress</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="game-card-border rounded-xl p-12 text-center bg-slate-800/60 border border-amber-500/30">
          <Target className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
          <p className="text-amber-200/90 text-lg">No campaigns assigned yet</p>
          <p className="text-slate-400 text-sm mt-2">You&apos;ll see your campaigns here once they&apos;re assigned</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign: any, index: number) => {
            const status = getCampaignStatus(campaign.startDate, campaign.endDate);
            const totalLeads = campaign.leads?.length || 0;
            const totalProducts = campaign.products?.length || 0;
            const totalInvoices = campaign.invoices?.length || 0;

            return (
              <DashboardWidgetCard key={campaign.id} index={index}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-amber-100">{campaign.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{campaign.description || 'No description provided'}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 pb-4 border-b border-amber-500/10">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
                      <Target className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-slate-500">Type</p>
                        <p className="text-sm font-medium text-amber-200/90">{getTypeLabel(campaign.type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="text-sm font-medium text-amber-200/90">
                          {new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-slate-500">Budget</p>
                        <p className="text-sm font-medium text-amber-200/90">
                          ${Number(campaign.budget).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-xs text-slate-500">Leads</p>
                        <p className="text-lg font-semibold text-white">{totalLeads}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-slate-500">Products</p>
                        <p className="text-lg font-semibold text-white">{totalProducts}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-xs text-slate-500">Invoices</p>
                        <p className="text-lg font-semibold text-white">{totalInvoices}</p>
                      </div>
                    </div>
                  </div>

                  {campaign.project && (
                    <div className="pt-4 border-t border-amber-500/10">
                      <p className="text-xs text-slate-500 mb-1">Related Project</p>
                      <p className="text-sm font-medium text-amber-200/90">{campaign.project.title}</p>
                    </div>
                  )}
                </div>
              </DashboardWidgetCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
