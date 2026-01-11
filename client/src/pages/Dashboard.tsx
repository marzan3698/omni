import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi, leadApi, campaignApi, invoiceApi, adminApi } from '@/lib/api';
import { integrationApi } from '@/lib/integration';
import { socialApi } from '@/lib/social';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { LayoutDashboard, Users, Briefcase, DollarSign, Target, CheckSquare, Building2, MessageSquare, Copy, Check, MessageSquare as ChatwootIcon, Megaphone, Plus, FileText, X, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'live-office' | 'analytics' | 'finance-report'>('live-office');

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
  const pendingTasks = tasks.filter((t: any) => t.status === 'Pending');
  const startedWorkingTasks = tasks.filter((t: any) => t.status === 'StartedWorking');
  const completeTasks = tasks.filter((t: any) => t.status === 'Complete');
  const cancelTasks = tasks.filter((t: any) => t.status === 'Cancel');
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

  // Fetch invoices for client
  const { data: clientInvoicesResponse } = useQuery({
    queryKey: ['client-invoices-dashboard'],
    queryFn: async () => {
      try {
        const response = await invoiceApi.getClientInvoices();
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: user?.roleName === 'Client',
  });

  // Fetch all invoices for admin
  const { data: allInvoicesResponse } = useQuery({
    queryKey: ['all-invoices-dashboard', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      try {
        const response = await invoiceApi.getAll({ companyId: user.companyId });
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.companyId && (hasPermission('can_manage_finance') || user?.roleName === 'SuperAdmin'),
  });

  const clientInvoices = clientInvoicesResponse || [];
  const allInvoices = allInvoicesResponse || [];
  const unpaidInvoices = allInvoices.filter((inv: any) => inv.status === 'Unpaid');
  const totalInvoiceAmount = allInvoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);

  // Fetch projects for total project amount calculation
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects-dashboard', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      try {
        const response = await adminApi.getAllProjects({ companyId: user.companyId });
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.companyId && (hasPermission('can_manage_companies') || user?.roleName === 'SuperAdmin'),
  });

  const allProjects = projectsResponse || [];
  const totalProjectAmount = allProjects.reduce((sum: number, project: any) => sum + Number(project.amount || 0), 0);

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

    if (hasPermission('can_manage_finance') || user?.roleName === 'SuperAdmin') {
      stats.push({
        title: 'Total Invoices',
        value: `৳${totalInvoiceAmount.toLocaleString()}`,
        change: `${unpaidInvoices.length} unpaid`,
        icon: FileText,
        color: 'text-green-600',
        link: '/finance',
      });
    }

    if (user?.roleName === 'Client') {
      stats.push({
        title: 'My Invoices',
        value: clientInvoices.length.toString(),
        change: `${clientInvoices.filter((inv: any) => inv.status === 'Unpaid').length} unpaid`,
        icon: FileText,
        color: 'text-indigo-600',
        link: '/client/invoices',
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

    // Show Tasks widget for all non-Client roles
    if (user?.roleName !== 'Client') {
      const totalTasks = tasks.length;
      stats.push({
        title: 'My Tasks',
        value: totalTasks.toString(),
        change: `${pendingTasks.length} pending, ${startedWorkingTasks.length} in progress`,
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

  // Fetch conversation statistics for SuperAdmin
  const { data: conversationStats } = useQuery({
    queryKey: ['conversation-stats'],
    queryFn: () => socialApi.getConversationStats(),
    enabled: user?.roleName === 'SuperAdmin',
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const isSuperAdmin = user?.roleName === 'SuperAdmin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here's what's happening today.
        </p>
      </div>

      {/* Tabs - SuperAdmin Only */}
      {isSuperAdmin && (
        <div className="flex gap-2 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveTab('live-office')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'live-office'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
            )}
          >
            Live Office (লাইভ অফিস)
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
            )}
          >
            Analytics (এনালিটিক্স)
          </button>
          <button
            onClick={() => setActiveTab('finance-report')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'finance-report'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
            )}
          >
            Finance Report (ফাইন্যান্স রিপোর্ট)
          </button>
        </div>
      )}

      {/* Tab Content - SuperAdmin */}
      {isSuperAdmin ? (
        <>
          {/* Live Office Tab */}
          {activeTab === 'live-office' && conversationStats && (
            <div className="space-y-6">
              {/* Conversation Statistics Widgets */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Widget 1: Conversations Taken Overview */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Conversations Taken
                    </CardTitle>
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{conversationStats.totalAssigned}</div>
                    <p className="text-xs text-slate-500 mt-1">Currently assigned conversations</p>
                  </CardContent>
                </Card>

                {/* Widget 2: Active Employees */}
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Active Employees
                    </CardTitle>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{conversationStats.activeEmployees.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Employees with assigned conversations</p>
                    {conversationStats.activeEmployees.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                        {conversationStats.activeEmployees.map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 truncate">{employee.name}</span>
                            <span className="text-slate-500 ml-2">({employee.assignedCount})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Release Statistics Widget */}
              {conversationStats.totalReleases > 0 && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      Release Statistics
                    </CardTitle>
                    <CardDescription>
                      Total releases and release statistics by employee
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-slate-900">{conversationStats.totalReleases}</div>
                      <p className="text-xs text-slate-500 mt-1">Total conversation releases</p>
                    </div>
                    {conversationStats.releasesByEmployee.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 mb-2">Top Employees by Releases:</p>
                        <div className="space-y-2">
                          {conversationStats.releasesByEmployee.map((item) => (
                            <div key={item.employeeId} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                              <span className="text-slate-700">{item.employeeName}</span>
                              <span className="font-semibold text-slate-900">{item.releaseCount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tasks Widget - Show for all non-Client roles */}
              {user?.roleName !== 'Client' && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                          My Tasks
                        </CardTitle>
                        <CardDescription>
                          {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
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
                    {/* Status Breakdown */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-md">
                        <div className="text-xl font-bold text-yellow-700">{pendingTasks.length}</div>
                        <div className="text-xs text-yellow-600 mt-1">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-md">
                        <div className="text-xl font-bold text-blue-700">{startedWorkingTasks.length}</div>
                        <div className="text-xs text-blue-600 mt-1">Started Working</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-md">
                        <div className="text-xl font-bold text-green-700">{completeTasks.length}</div>
                        <div className="text-xs text-green-600 mt-1">Complete</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-md">
                        <div className="text-xl font-bold text-red-700">{cancelTasks.length}</div>
                        <div className="text-xs text-red-600 mt-1">Cancel</div>
                      </div>
                    </div>

                    {/* Recent Tasks List */}
                    {recentTasks.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 mb-2">Recent Tasks:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {recentTasks.map((task: any) => (
                            <Link
                              key={task.id}
                              to="/tasks"
                              className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {task.status === 'Pending' && <Circle className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                                {task.status === 'StartedWorking' && <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                                {task.status === 'Complete' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                {task.status === 'Cancel' && <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                <span className="text-sm text-slate-700 truncate flex-1">{task.title}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${
                                task.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                task.status === 'StartedWorking' ? 'bg-blue-100 text-blue-700' :
                                task.status === 'Complete' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {task.status === 'Pending' ? 'Pending' :
                                 task.status === 'StartedWorking' ? 'Started' :
                                 task.status === 'Complete' ? 'Complete' : 'Cancel'}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No tasks assigned yet</p>
                        <Link to="/tasks">
                          <Button size="sm" className="mt-3" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Task
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
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

              {/* Campaign Management Widget */}
              {(hasPermission('can_manage_campaigns') || isSuperAdmin) && (
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
                                      <span className="font-medium">৳{Number(campaign.budget).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">Value:</span>
                                      <span className="font-medium text-green-600">৳{totalValue.toLocaleString()}</span>
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
            </div>
          )}

          {/* Finance Report Tab */}
          {activeTab === 'finance-report' && (
            <div className="space-y-6">
              {/* Recent Invoices Widget */}
              {(hasPermission('can_manage_finance') || isSuperAdmin) && allInvoices.length > 0 && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          Recent Invoices
                        </CardTitle>
                        <CardDescription>
                          {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Link to="/finance">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {allInvoices.slice(0, 5).map((invoice: any) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              Invoice #{invoice.invoiceNumber}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                invoice.status === 'Unpaid' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {invoice.status}
                              </span>
                              <span className="text-xs text-slate-500">
                                ৳{Number(invoice.totalAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Link to={`/finance/invoices/${invoice.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Total Project Amount Card */}
              {(hasPermission('can_manage_finance') || isSuperAdmin) && (
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Total Project Amount
                    </CardTitle>
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">৳{totalProjectAmount.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 mt-1">Total value of all projects</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      ) : (
        <>
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

      {/* Tasks Widget - Show for all non-Client roles */}
      {user?.roleName !== 'Client' && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  My Tasks
                </CardTitle>
                <CardDescription>
                  {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
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
            {/* Status Breakdown */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-md">
                <div className="text-xl font-bold text-yellow-700">{pendingTasks.length}</div>
                <div className="text-xs text-yellow-600 mt-1">Pending</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-md">
                <div className="text-xl font-bold text-blue-700">{startedWorkingTasks.length}</div>
                <div className="text-xs text-blue-600 mt-1">Started Working</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-xl font-bold text-green-700">{completeTasks.length}</div>
                <div className="text-xs text-green-600 mt-1">Complete</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <div className="text-xl font-bold text-red-700">{cancelTasks.length}</div>
                <div className="text-xs text-red-600 mt-1">Cancel</div>
              </div>
            </div>

            {/* Recent Tasks List */}
            {recentTasks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">Recent Tasks:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentTasks.map((task: any) => (
                    <Link
                      key={task.id}
                      to="/tasks"
                      className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {task.status === 'Pending' && <Circle className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                        {task.status === 'StartedWorking' && <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        {task.status === 'Complete' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        {task.status === 'Cancel' && <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <span className="text-sm text-slate-700 truncate flex-1">{task.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${
                        task.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        task.status === 'StartedWorking' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'Complete' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {task.status === 'Pending' ? 'Pending' :
                         task.status === 'StartedWorking' ? 'Started' :
                         task.status === 'Complete' ? 'Complete' : 'Cancel'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No tasks assigned yet</p>
                <Link to="/tasks">
                  <Button size="sm" className="mt-3" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

          {/* Campaign Management Widget - Show for non-SuperAdmin with permission */}
          {(hasPermission('can_manage_campaigns') && !isSuperAdmin) && (
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
                                  <span className="font-medium">৳{Number(campaign.budget).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Value:</span>
                                  <span className="font-medium text-green-600">৳{totalValue.toLocaleString()}</span>
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
        </>
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
                              ৳{budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Estimated Value:</span>
                            <span className="font-medium text-green-600">
                              ৳{totalEstimatedValue.toLocaleString()}
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
                  {pendingTasks.length} pending, {startedWorkingTasks.length} in progress, {completeTasks.length} complete
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
                      task.status === 'Pending'
                        ? 'bg-yellow-500'
                        : task.status === 'Complete'
                        ? 'bg-green-500'
                        : task.status === 'StartedWorking'
                        ? 'bg-blue-500'
                        : task.status === 'Cancel'
                        ? 'bg-red-500'
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
                          task.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : task.status === 'Complete'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'StartedWorking'
                            ? 'bg-blue-100 text-blue-700'
                            : task.status === 'Cancel'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {task.status === 'Pending' ? 'Pending' : task.status === 'StartedWorking' ? 'Started Working' : task.status === 'Complete' ? 'Complete' : task.status === 'Cancel' ? 'Cancel' : task.status}
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

      {/* Client Invoices Widget */}
      {user?.roleName === 'Client' && clientInvoices.length > 0 && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  My Invoices
                </CardTitle>
                <CardDescription>
                  {clientInvoices.filter((inv: any) => inv.status === 'Unpaid').length} unpaid
                </CardDescription>
              </div>
              <Link to="/client/invoices">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientInvoices.slice(0, 5).map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Invoice #{invoice.invoiceNumber}
                    </p>
                    {invoice.project && (
                      <p className="text-xs text-slate-500 mt-1">{invoice.project.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'Unpaid' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {invoice.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        ৳{Number(invoice.totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Link to={`/client/invoices/${invoice.id}`}>
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

