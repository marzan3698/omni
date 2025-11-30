import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi, leadApi, campaignApi } from '@/lib/api';
import { integrationApi } from '@/lib/integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { LayoutDashboard, Users, Briefcase, DollarSign, Target, CheckSquare, Building2, MessageSquare, Copy, Check, MessageSquare as ChatwootIcon, Megaphone, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);

  // Fetch user tasks for dashboard
  const { data: tasksResponse } = useQuery({
    queryKey: ['user-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id || !user?.companyId) return [];
      const response = await taskApi.getUserTasks(user.id, user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.id && !!user?.companyId,
  });

  // Fetch integrations for Chatwoot webhook URL
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.getIntegrations(),
    enabled: hasPermission('can_view_integrations'),
  });

  // Fetch Chatwoot webhook URL
  const chatwootIntegration = integrations.find((i) => i.provider === 'chatwoot');
  const { data: webhookUrl } = useQuery({
    queryKey: ['chatwoot-webhook-url', chatwootIntegration?.id],
    queryFn: async () => {
      if (!chatwootIntegration?.id) return null;
      try {
        return await integrationApi.getChatwootWebhookUrl(chatwootIntegration.id);
      } catch (error) {
        console.error('Error fetching webhook URL:', error);
        return null;
      }
    },
    enabled: hasPermission('can_view_integrations') && !!chatwootIntegration?.id,
  });

  const tasks = tasksResponse || [];
  const pendingTasks = tasks.filter((t: any) => t.status === 'Todo' || t.status === 'InProgress');
  const recentTasks = tasks.slice(0, 5);

  // Fetch leads count for Lead Manager
  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-count'],
    queryFn: async () => {
      const response = await leadApi.getAll();
      return response.data.data || [];
    },
    enabled: hasPermission('can_manage_leads') || hasPermission('can_view_leads'),
  });

  const leads = leadsResponse || [];
  const activeLeads = leads.filter((l: any) => l.status !== 'Won' && l.status !== 'Lost').length;

  // Fetch active campaigns for Lead Manager / Sales Manager
  const { data: campaignsResponse } = useQuery({
    queryKey: ['campaigns-active', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getActive(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && (hasPermission('can_manage_leads') || hasPermission('can_view_leads')),
  });

  // Fetch all campaigns for SuperAdmin
  const { data: allCampaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns-all', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId && (hasPermission('can_manage_campaigns') || user?.roleName === 'SuperAdmin'),
  });

  // Fetch campaign statistics for each active campaign
  const campaigns = campaignsResponse || [];
  const { data: campaignStats = [] } = useQuery({
    queryKey: ['campaign-stats', campaigns.map((c: any) => c.id)],
    queryFn: async () => {
      if (!user?.companyId || campaigns.length === 0) return [];
      const statsPromises = campaigns.map((campaign: any) =>
        campaignApi.getStatistics(campaign.id, user.companyId!)
          .then((res: any) => ({
            campaignId: campaign.id,
            ...res.data.data,
          }))
          .catch(() => null)
      );
      return (await Promise.all(statsPromises)).filter(Boolean);
    },
    enabled: !!user?.companyId && campaigns.length > 0 && (hasPermission('can_manage_leads') || hasPermission('can_view_leads')),
  });

  const handleCopyWebhookUrl = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWebhookUrlCopied(true);
      setTimeout(() => setWebhookUrlCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const allCampaigns = allCampaignsResponse || [];

  // Role-based stats based on permissions
  const getStats = () => {
    const stats: any[] = [];

    if (hasPermission('can_manage_leads') || hasPermission('can_view_leads')) {
      stats.push({
        title: 'Active Leads',
        value: activeLeads.toString(),
        change: 'View all leads',
        icon: Target,
        color: 'text-blue-600',
        link: '/leads',
      });
    }

    if (hasPermission('can_manage_finance')) {
      stats.push({
        title: 'Total Revenue',
        value: '$0',
        change: 'View finance',
        icon: DollarSign,
        color: 'text-green-600',
        link: '/finance',
      });
    }

    if (hasPermission('can_manage_employees')) {
      stats.push({
        title: 'Total Employees',
        value: '0',
        change: 'Manage team',
        icon: Users,
        color: 'text-indigo-600',
        link: '/employees',
      });
    }

    if (hasPermission('can_manage_tasks')) {
      stats.push({
        title: 'Pending Tasks',
        value: '0',
        change: 'View tasks',
        icon: CheckSquare,
        color: 'text-orange-600',
        link: '/tasks',
      });
    }

    if (hasPermission('can_manage_companies')) {
      stats.push({
        title: 'Companies',
        value: '0',
        change: 'Manage companies',
        icon: Building2,
        color: 'text-purple-600',
        link: '/companies',
      });
    }

    if (hasPermission('can_manage_inbox')) {
      stats.push({
        title: 'Unread Messages',
        value: '0',
        change: 'View inbox',
        icon: MessageSquare,
        color: 'text-pink-600',
        link: '/inbox',
      });
    }

    if (hasPermission('can_manage_campaigns') || user?.roleName === 'SuperAdmin') {
      stats.push({
        title: 'Total Campaigns',
        value: String(allCampaigns.length),
        change: 'Manage campaigns',
        icon: Megaphone,
        color: 'text-indigo-600',
        link: '/campaigns',
      });
    }

    return stats;
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chatwoot Webhook URL Widget - SuperAdmin Only */}
      <PermissionGuard permission="can_view_integrations">
        <Card className="shadow-sm border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <ChatwootIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle>Chatwoot Integration</CardTitle>
                <CardDescription>
                  Webhook URL for Chatwoot integration
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    chatwootIntegration?.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {chatwootIntegration?.isActive ? 'Active' : 'Inactive'}
                </span>
                {chatwootIntegration?.isWebhookActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Webhook Active
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {webhookUrl ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="flex-1 bg-white font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyWebhookUrl}
                      className="flex items-center gap-2"
                    >
                      {webhookUrlCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Copy this URL and add it in Chatwoot Settings → Integrations → Webhooks
                  </p>
                </div>
                {chatwootIntegration && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                    <span className="text-xs text-slate-600">Integration Status:</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          chatwootIntegration.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {chatwootIntegration.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {chatwootIntegration.isWebhookActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Webhook Enabled
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : chatwootIntegration ? (
              <div className="text-sm text-slate-500">
                Webhook URL not available. Please configure the integration in Settings.
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                No Chatwoot integration found. Please set up the integration in Settings.
              </div>
            )}
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Campaign Management Widget - Show for SuperAdmin */}
      {(hasPermission('can_manage_campaigns') || user?.roleName === 'SuperAdmin') && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  Campaign Management
                </CardTitle>
                <CardDescription>
                  Manage and monitor all marketing campaigns
                </CardDescription>
              </div>
              <Link to="/campaigns">
                <Button variant="outline" size="sm">
                  Manage Campaigns
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-500">Loading campaigns...</div>
              </div>
            ) : allCampaigns && allCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allCampaigns.slice(0, 4).map((campaign: any) => {
                  const now = new Date();
                  const startDate = new Date(campaign.startDate);
                  const endDate = new Date(campaign.endDate);
                  const isActive = startDate <= now && endDate >= now;
                  const totalLeads = campaign.leads?.length || 0;
                  const totalValue = campaign.leads?.reduce((sum: number, lead: any) => {
                    return sum + (lead.value ? Number(lead.value) : 0);
                  }, 0) || 0;
                  const progressPercentage = Number(campaign.budget) > 0
                    ? (totalValue / Number(campaign.budget)) * 100
                    : 0;

                  return (
                    <Card key={campaign.id} className="shadow-sm border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-semibold">{campaign.name}</CardTitle>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <CardDescription className="text-xs">
                          {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <CircularProgress
                            value={Math.min(100, Math.max(0, progressPercentage))}
                            size={60}
                            strokeWidth={5}
                          />
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Budget:</span>
                              <span className="font-medium">${Number(campaign.budget).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Value:</span>
                              <span className="font-medium text-green-600">${totalValue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Leads:</span>
                              <span className="font-medium">{totalLeads}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Megaphone className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No campaigns found. Create your first campaign to get started.</p>
                <Link to="/campaigns">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaign Progress Widgets - Show for Lead Manager / Sales Manager */}
      {(hasPermission('can_manage_leads') || hasPermission('can_view_leads')) && campaigns.length > 0 && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  Campaign Progress
                </CardTitle>
                <CardDescription>
                  Track your active marketing campaigns
                </CardDescription>
              </div>
              <Link to="/campaigns">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign: any) => {
                const stats = campaignStats.find((s: any) => s.campaignId === campaign.id)?.statistics;
                if (!stats) return null;

                const totalEstimatedValue = stats.totalEstimatedValue || 0;
                const budget = stats.budget || Number(campaign.budget);
                const progressPercentage = budget > 0 ? (totalEstimatedValue / budget) * 100 : 0;

                return (
                  <Card key={campaign.id} className="shadow-sm border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)} Campaign
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <CircularProgress
                          value={Math.min(100, Math.max(0, progressPercentage))}
                          size={80}
                          strokeWidth={6}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Budget:</span>
                            <span className="font-medium text-slate-900">
                              ${budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Estimated Value:</span>
                            <span className="font-medium text-green-600">
                              ${totalEstimatedValue.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Leads:</span>
                            <span className="font-medium text-slate-900">
                              {stats.totalLeads || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {campaigns.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No active campaigns. Create a campaign to get started.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks Widget - Show for all users */}
      {tasks.length > 0 && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>
                  {pendingTasks.length} pending task{pendingTasks.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Link to="/tasks">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      task.status === 'Done'
                        ? 'bg-green-500'
                        : task.status === 'InProgress'
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'High'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.status === 'Done'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'InProgress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New lead assigned</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Task completed</p>
                  <p className="text-xs text-slate-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasPermission('can_create_leads') && (
                <Link to="/leads">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-md transition-colors">
                    Create New Lead
                  </button>
                </Link>
              )}
              {hasPermission('can_manage_employees') && (
                <Link to="/employees">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-md transition-colors">
                    Add Employee
                  </button>
                </Link>
              )}
              {hasPermission('can_view_reports') && (
                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 rounded-md transition-colors">
                  Generate Report
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

