import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi, leadApi, campaignApi, invoiceApi, adminApi } from '@/lib/api';
import { socialApi } from '@/lib/social';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { CircularProgress } from '@/components/ui/circular-progress';
import { LayoutDashboard, Users, Briefcase, DollarSign, Target, CheckSquare, Building2, MessageSquare, Copy, Check, Megaphone, Plus, FileText, X, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { WorkTimeline } from '@/components/WorkTimeline';
import { LiveUsersSection } from '@/components/LiveUsersSection';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { user, hasPermission } = useAuth();
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
  const canViewLiveUsers =
    isSuperAdmin ||
    hasPermission('can_manage_companies') ||
    hasPermission('can_manage_employees') ||
    hasPermission('can_manage_inbox');

  return (
    <div className="relative rounded-xl md:rounded-2xl overflow-hidden">
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm">Dashboard</h1>
        <p className="text-amber-200/80 mt-1">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here's what's happening today.
        </p>
      </div>

      {/* Tabs - SuperAdmin Only - Game style */}
      {isSuperAdmin && (
        <div className="flex gap-2 p-2 rounded-xl border-2 border-amber-500/30 bg-slate-800/50 mb-4">
          {[
            { key: 'live-office' as const, label: 'Live Office (লাইভ অফিস)' },
            { key: 'analytics' as const, label: 'Analytics (এনালিটিক্স)' },
            { key: 'finance-report' as const, label: 'Finance Report (ফাইন্যান্স রিপোর্ট)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30 border border-amber-400/60'
                  : 'bg-slate-700/60 text-amber-50 hover:bg-amber-500/25 hover:text-white border border-amber-500/30 hover:border-amber-500/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content - SuperAdmin */}
      {isSuperAdmin ? (
        <>
          {/* Live Office Tab */}
          {activeTab === 'live-office' && conversationStats && (
            <div className="space-y-6">
              {/* Live Users - FIFA style cards (first) */}
              {canViewLiveUsers && (
                <LiveUsersSection />
              )}
              {/* Conversation Statistics Widgets */}
              <div className="grid gap-4 md:grid-cols-2">
                <DashboardWidgetCard index={0}>
                  <div className="flex flex-row items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-200/90">Assigned Conversations</span>
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-white animate-game-score-pop">{conversationStats.totalAssigned}</div>
                  <p className="text-xs text-slate-400 mt-1">Currently assigned conversations</p>
                </DashboardWidgetCard>

                <DashboardWidgetCard index={1}>
                  <div className="flex flex-row items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-200/90">Active Employees</span>
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-white animate-game-score-pop">{conversationStats.activeEmployees.length}</div>
                  <p className="text-xs text-slate-400 mt-1">Employees with assigned conversations</p>
                  {conversationStats.activeEmployees.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                      {conversationStats.activeEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 truncate">{employee.name}</span>
                          <span className="text-amber-400/80 ml-2">({employee.assignedCount})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardWidgetCard>
              </div>

              {/* Release Statistics Widget */}
              {conversationStats.totalReleases > 0 && (
                <DashboardWidgetCard index={2}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-white">Release Statistics</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Total releases and release statistics by employee</p>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-amber-400 animate-game-score-pop">{conversationStats.totalReleases}</div>
                    <p className="text-xs text-slate-400 mt-1">Total conversation releases</p>
                  </div>
                  {conversationStats.releasesByEmployee.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-200/90 mb-2">Top Employees by Releases:</p>
                      <div className="space-y-2">
                        {conversationStats.releasesByEmployee.map((item) => (
                          <div key={item.employeeId} className="flex items-center justify-between text-sm p-2 bg-slate-800/60 rounded-lg border border-amber-500/10">
                            <span className="text-slate-200">{item.employeeName}</span>
                            <span className="font-semibold text-amber-400">{item.releaseCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </DashboardWidgetCard>
              )}

              {/* Tasks Widget - Show for all non-Client roles */}
              {user?.roleName !== 'Client' && (
                <DashboardWidgetCard index={3}>
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-white">My Tasks</span>
                      <span className="text-xs text-slate-400">({tasks.length} total)</span>
                    </div>
                    <Link to="/tasks">
                      <Button variant="outline" size="sm" className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/60 font-semibold">
                        View All
                      </Button>
                    </Link>
                  </div>
                  {/* Status Breakdown - FIFA style stat boxes */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10 animate-game-stat-reveal" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                      <div className="text-xl font-bold text-amber-400">{pendingTasks.length}</div>
                      <div className="text-xs text-slate-400 mt-1">Pending</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10 animate-game-stat-reveal" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                      <div className="text-xl font-bold text-blue-400">{startedWorkingTasks.length}</div>
                      <div className="text-xs text-slate-400 mt-1">Started</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10 animate-game-stat-reveal" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                      <div className="text-xl font-bold text-emerald-400">{completeTasks.length}</div>
                      <div className="text-xs text-slate-400 mt-1">Complete</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10 animate-game-stat-reveal" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
                      <div className="text-xl font-bold text-red-400">{cancelTasks.length}</div>
                      <div className="text-xs text-slate-400 mt-1">Cancel</div>
                    </div>
                  </div>

                  {recentTasks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-200/90 mb-2">Recent Tasks:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {recentTasks.map((task: any) => (
                          <Link
                            key={task.id}
                            to="/tasks"
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-amber-500/10 hover:border-amber-500/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {task.status === 'Pending' && <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                              {task.status === 'StartedWorking' && <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                              {task.status === 'Complete' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                              {task.status === 'Cancel' && <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              <span className="text-sm text-slate-200 truncate flex-1">{task.title}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${
                              task.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                              task.status === 'StartedWorking' ? 'bg-blue-500/20 text-blue-400' :
                              task.status === 'Complete' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-red-500/20 text-red-400'
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
                    <div className="text-center py-6 text-slate-400">
                      <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                      <p className="text-sm">No tasks assigned yet</p>
                      <Link to="/tasks">
                        <Button size="sm" className="mt-3 border-amber-500/30 text-amber-200 hover:bg-amber-500/20" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Task
                        </Button>
                      </Link>
                    </div>
                  )}
                </DashboardWidgetCard>
              )}

              {/* Work Timeline - for employees */}
              {user?.roleName !== 'Client' && <WorkTimeline />}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <DashboardWidgetCard key={stat.title} index={idx} link={stat.link}>
                      <div className="flex flex-row items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-200/90">{stat.title}</span>
                        <Icon className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-bold text-white animate-game-score-pop">{stat.value}</div>
                      <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
                    </DashboardWidgetCard>
                  );
                })}
              </div>

              {/* Campaign Management Widget */}
              {(hasPermission('can_manage_campaigns') || isSuperAdmin) && (
                <DashboardWidgetCard index={stats.length}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-white">Campaign Management</span>
                    </div>
                    <p className="text-xs text-slate-400">Manage and monitor all marketing campaigns</p>
                    <Link to="/campaigns">
                      <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-200 hover:bg-amber-500/20">
                        Manage Campaigns
                      </Button>
                    </Link>
                  </div>
                  <div>
                    {campaignsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-slate-400 animate-pulse">Loading campaigns...</div>
                      </div>
                    ) : allCampaigns && allCampaigns.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {allCampaigns.slice(0, 4).map((campaign: any, cIdx: number) => {
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
                            <div key={campaign.id} className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-4 animate-game-stat-reveal" style={{ animationDelay: `${cIdx * 80}ms`, animationFillMode: 'both' }}>
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-semibold text-white">{campaign.name}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                                }`}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mb-3">{campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}</p>
                              <div className="space-y-2">
                                <CircularProgress
                                  value={Math.min(100, Math.max(0, progressPercentage))}
                                  size={60}
                                  strokeWidth={5}
                                  dark
                                />
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between"><span className="text-slate-400">Budget:</span><span className="font-medium text-amber-400">৳{Number(campaign.budget).toLocaleString()}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-400">Value:</span><span className="font-medium text-emerald-400">৳{totalValue.toLocaleString()}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-400">Leads:</span><span className="font-medium text-white">{totalLeads}</span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Megaphone className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                        <p>No campaigns found. Create your first campaign to get started.</p>
                        <Link to="/campaigns">
                          <Button className="mt-4 border-amber-500/30 text-amber-200 hover:bg-amber-500/20" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </DashboardWidgetCard>
              )}
            </div>
          )}

          {/* Finance Report Tab */}
          {activeTab === 'finance-report' && (
            <div className="space-y-6">
              {(hasPermission('can_manage_finance') || isSuperAdmin) && allInvoices.length > 0 && (
                <DashboardWidgetCard index={0}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-white">Recent Invoices</span>
                    </div>
                    <span className="text-xs text-slate-400">{unpaidInvoices.length} unpaid</span>
                    <Link to="/finance">
                      <Button variant="outline" size="sm" className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/60 font-semibold">
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {allInvoices.slice(0, 5).map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-amber-500/10 hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            Invoice #{invoice.invoiceNumber}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              invoice.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                              invoice.status === 'Unpaid' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {invoice.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              ৳{Number(invoice.totalAmount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Link to={`/finance/invoices/${invoice.id}`}>
                          <Button size="sm" variant="ghost" className="text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </DashboardWidgetCard>
              )}

              {(hasPermission('can_manage_finance') || isSuperAdmin) && (
                <DashboardWidgetCard index={1}>
                  <div className="flex flex-row items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-200/90">Total Project Amount</span>
                    <Briefcase className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400 animate-game-score-pop">৳{totalProjectAmount.toLocaleString()}</div>
                  <p className="text-xs text-slate-400 mt-1">Total value of all projects</p>
                </DashboardWidgetCard>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Live Users - FIFA style cards (first for admins) */}
          {canViewLiveUsers && (
            <LiveUsersSection />
          )}
          {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <DashboardWidgetCard key={stat.title} index={idx} link={stat.link}>
              <div className="flex flex-row items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-200/90">{stat.title}</span>
                <Icon className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-white animate-game-score-pop">{stat.value}</div>
              <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
            </DashboardWidgetCard>
          );
        })}
      </div>

      {/* Tasks Widget - Show for all non-Client roles */}
      {user?.roleName !== 'Client' && (
        <DashboardWidgetCard index={stats.length}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-white">My Tasks</span>
            </div>
            <span className="text-xs text-slate-400">{tasks.length} total task{tasks.length !== 1 ? 's' : ''}</span>
            <Link to="/tasks">
              <Button variant="outline" size="sm" className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/60 font-semibold">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
              <div className="text-xl font-bold text-amber-400">{pendingTasks.length}</div>
              <div className="text-xs text-slate-400 mt-1">Pending</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
              <div className="text-xl font-bold text-blue-400">{startedWorkingTasks.length}</div>
              <div className="text-xs text-slate-400 mt-1">Started</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
              <div className="text-xl font-bold text-emerald-400">{completeTasks.length}</div>
              <div className="text-xs text-slate-400 mt-1">Complete</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/60 border border-amber-500/10">
              <div className="text-xl font-bold text-red-400">{cancelTasks.length}</div>
              <div className="text-xs text-slate-400 mt-1">Cancel</div>
            </div>
          </div>
          {recentTasks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-200/90 mb-2">Recent Tasks:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentTasks.map((task: any) => (
                  <Link
                    key={task.id}
                    to="/tasks"
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-amber-500/10 hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {task.status === 'Pending' && <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      {task.status === 'StartedWorking' && <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      {task.status === 'Complete' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {task.status === 'Cancel' && <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <span className="text-sm text-slate-200 truncate flex-1">{task.title}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${
                      task.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                      task.status === 'StartedWorking' ? 'bg-blue-500/20 text-blue-400' :
                      task.status === 'Complete' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
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
            <div className="text-center py-6 text-slate-400">
              <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-500" />
              <p className="text-sm">No tasks assigned yet</p>
              <Link to="/tasks">
                <Button size="sm" className="mt-3 border-amber-500/30 text-amber-200 hover:bg-amber-500/20" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </Link>
            </div>
          )}
        </DashboardWidgetCard>
      )}

          {/* Work Timeline - for employees */}
          {user?.roleName !== 'Client' && <WorkTimeline />}

          {/* Campaign Management Widget - Show for non-SuperAdmin with permission */}
          {(hasPermission('can_manage_campaigns') && !isSuperAdmin) && (
            <DashboardWidgetCard index={stats.length + 2}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-white">Campaign Management</span>
                </div>
                <p className="text-xs text-slate-400">Manage and monitor all marketing campaigns</p>
                <Link to="/campaigns">
                  <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-200 hover:bg-amber-500/20">
                    Manage Campaigns
                  </Button>
                </Link>
              </div>
              {campaignsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-400 animate-pulse">Loading campaigns...</div>
                </div>
              ) : allCampaigns && allCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {allCampaigns.slice(0, 4).map((campaign: any, cIdx: number) => {
                    const now = new Date();
                    const startDate = new Date(campaign.startDate);
                    const endDate = new Date(campaign.endDate);
                    const isActive = startDate <= now && endDate >= now;
                    const totalLeads = campaign.leads?.length || 0;
                    const totalValue = campaign.leads?.reduce((sum: number, lead: any) => sum + (lead.value ? Number(lead.value) : 0), 0) || 0;
                    const progressPercentage = Number(campaign.budget) > 0 ? (totalValue / Number(campaign.budget)) * 100 : 0;
                    return (
                      <div key={campaign.id} className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-4 animate-game-stat-reveal" style={{ animationDelay: `${cIdx * 80}ms`, animationFillMode: 'both' }}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-semibold text-white">{campaign.name}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}</p>
                        <div className="space-y-2">
                          <CircularProgress value={Math.min(100, Math.max(0, progressPercentage))} size={60} strokeWidth={5} dark />
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Budget:</span><span className="font-medium text-amber-400">৳{Number(campaign.budget).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Value:</span><span className="font-medium text-emerald-400">৳{totalValue.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Leads:</span><span className="font-medium text-white">{totalLeads}</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Megaphone className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                  <p>No campaigns found. Create your first campaign to get started.</p>
                  <Link to="/campaigns">
                    <Button className="mt-4 border-amber-500/30 text-amber-200 hover:bg-amber-500/20" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                </div>
              )}
            </DashboardWidgetCard>
          )}
        </>
      )}

      {/* Campaign Progress Widgets - Show for Lead Manager / Sales Manager */}
      {(hasPermission('can_manage_leads') || hasPermission('can_view_leads')) && campaigns.length > 0 && (
        <DashboardWidgetCard index={0}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-white">Campaign Progress</span>
            </div>
            <p className="text-xs text-slate-400">Track your active marketing campaigns</p>
            <Link to="/campaigns">
              <Button variant="outline" size="sm" className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/60 font-semibold">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign: any, cIdx: number) => {
              const stats = campaignStats.find((s: any) => s.campaignId === campaign.id)?.statistics;
              if (!stats) return null;

              const totalEstimatedValue = stats.totalEstimatedValue || 0;
              const budget = stats.budget || Number(campaign.budget);
              const progressPercentage = budget > 0 ? (totalEstimatedValue / budget) * 100 : 0;

              return (
                <div key={campaign.id} className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-4 animate-game-stat-reveal" style={{ animationDelay: `${cIdx * 80}ms`, animationFillMode: 'both' }}>
                  <div className="mb-3">
                    <div className="text-base font-semibold text-white">{campaign.name}</div>
                    <p className="text-xs text-slate-400">{campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)} Campaign</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <CircularProgress
                      value={Math.min(100, Math.max(0, progressPercentage))}
                      size={80}
                      strokeWidth={6}
                      dark
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Budget:</span>
                        <span className="font-medium text-amber-400">৳{budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Estimated Value:</span>
                        <span className="font-medium text-emerald-400">৳{totalEstimatedValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Leads:</span>
                        <span className="font-medium text-white">{stats.totalLeads || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardWidgetCard>
      )}

      {/* Tasks Widget - Show for all users (alternate layout) */}
      {tasks.length > 0 && (
        <DashboardWidgetCard index={0}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-white">My Tasks</span>
            </div>
            <span className="text-xs text-slate-400">{pendingTasks.length} pending, {startedWorkingTasks.length} in progress</span>
            <Link to="/tasks">
              <Button variant="outline" size="sm" className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/60 font-semibold">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task: any) => (
              <Link
                key={task.id}
                to="/tasks"
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-amber-500/10 hover:border-amber-500/30 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    task.status === 'Pending' ? 'bg-amber-500' :
                    task.status === 'Complete' ? 'bg-emerald-500' :
                    task.status === 'StartedWorking' ? 'bg-blue-500' :
                    task.status === 'Cancel' ? 'bg-red-500' : 'bg-slate-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600 text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                      task.status === 'Complete' ? 'bg-emerald-500/20 text-emerald-400' :
                      task.status === 'StartedWorking' ? 'bg-blue-500/20 text-blue-400' :
                      task.status === 'Cancel' ? 'bg-red-500/20 text-red-400' : 'bg-slate-600 text-slate-400'
                    }`}>
                      {task.status === 'Pending' ? 'Pending' : task.status === 'StartedWorking' ? 'Started' : task.status === 'Complete' ? 'Complete' : task.status === 'Cancel' ? 'Cancel' : task.status}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-slate-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </DashboardWidgetCard>
      )}

      {/* Client Invoices Widget */}
      {user?.roleName === 'Client' && clientInvoices.length > 0 && (
        <DashboardWidgetCard index={0}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-white">My Invoices</span>
            </div>
            <span className="text-xs text-slate-400">{clientInvoices.filter((inv: any) => inv.status === 'Unpaid').length} unpaid</span>
            <Link to="/client/invoices">
              <Button variant="outline" size="sm" className="border-amber-500/50 bg-transparent text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20 hover:border-amber-400/60 font-semibold">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {clientInvoices.slice(0, 5).map((invoice: any) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-amber-500/10 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Invoice #{invoice.invoiceNumber}
                  </p>
                  {invoice.project && (
                    <p className="text-xs text-slate-400 mt-1">{invoice.project.title}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      invoice.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                      invoice.status === 'Unpaid' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {invoice.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      ৳{Number(invoice.totalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link to={`/client/invoices/${invoice.id}`}>
                  <Button size="sm" variant="ghost" className="text-amber-100 hover:bg-amber-500/25 hover:text-white hover:bg-amber-500/20">View</Button>
                </Link>
              </div>
            ))}
          </div>
        </DashboardWidgetCard>
      )}

    </div>
    </div>
  );
}

