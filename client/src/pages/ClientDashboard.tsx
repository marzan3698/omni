import { useQuery } from '@tanstack/react-query';
import { projectApi, clientCampaignsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';

export function ClientDashboard() {
  const { data: statsResponse } = useQuery({
    queryKey: ['project-stats'],
    queryFn: async () => {
      const response = await projectApi.getStats();
      return response.data.data;
    },
  });

  const { data: campaignsResponse } = useQuery({
    queryKey: ['client-campaigns-dashboard'],
    queryFn: async () => {
      const response = await clientCampaignsApi.getMyCampaigns();
      return response.data.data || [];
    },
  });

  const stats = statsResponse || { total: 0, active: 0, completed: 0 };
  const campaigns = campaignsResponse || [];

  // Calculate campaign statistics
  const activeCampaigns = campaigns.filter((c: any) => {
    const now = new Date();
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    return now >= start && now <= end;
  }).length;

  const totalLeads = campaigns.reduce((sum: number, c: any) => sum + (c.leads?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your projects and campaigns</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time projects</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished projects</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Running now</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Summary */}
      {campaigns.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Campaign Overview</CardTitle>
              <CardDescription>Your assigned campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium">Total Campaigns</span>
                  </div>
                  <span className="text-2xl font-bold">{campaigns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Total Leads</span>
                  </div>
                  <span className="text-2xl font-bold">{totalLeads}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Recent Campaigns</CardTitle>
              <CardDescription>Latest campaign activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.slice(0, 3).map((campaign: any) => {
                  const now = new Date();
                  const start = new Date(campaign.startDate);
                  const end = new Date(campaign.endDate);
                  const isActive = now >= start && now <= end;

                  return (
                    <div key={campaign.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{campaign.name}</p>
                        <p className="text-xs text-slate-500">{campaign.type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
