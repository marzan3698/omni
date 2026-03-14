import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  FileText, 
  ArrowRight,
  PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/PermissionGuard';

export function Finance() {
  const { user } = useAuth();

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['finance-stats', user?.companyId],
    queryFn: async () => {
      const response = await financeApi.getStatistics(user!.companyId!);
      return response.data.data;
    },
    enabled: !!user?.companyId,
  });

  const stats = statsResponse || {
    totalInvoiced: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    invoiceCount: 0,
  };

  const menuItems = [
    {
      title: 'Invoice List',
      description: 'View and manage all customer invoices',
      icon: FileText,
      link: '/finance/invoices',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Pending Approvals',
      description: 'Review and approve pending finance requests',
      icon: Receipt,
      link: '/finance/pending-clients',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Reports',
      description: 'Financial performance and analytics',
      icon: PieChart,
      link: '/finance/reports',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-200/60 animate-pulse">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_finance">
      <div className="space-y-6">
        <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm">Finance Overview</h1>
          <p className="text-amber-200/80 mt-1">Monitor your company's financial performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardWidgetCard index={0}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-200/90">Total Invoiced</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-white">৳{stats.totalInvoiced.toLocaleString()}</div>
            <p className="text-xs text-amber-500/60 mt-1">Total billing amount</p>
          </DashboardWidgetCard>

          <DashboardWidgetCard index={1}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-200/90">Total Paid</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">৳{stats.paidAmount.toLocaleString()}</div>
            <p className="text-xs text-emerald-500/60 mt-1">Successfully collected</p>
          </DashboardWidgetCard>

          <DashboardWidgetCard index={2}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-200/90">Outstanding</span>
              <Receipt className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-400">৳{stats.unpaidAmount.toLocaleString()}</div>
            <p className="text-xs text-red-500/60 mt-1">Pending payments</p>
          </DashboardWidgetCard>

          <DashboardWidgetCard index={3}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-200/90">Invoices</span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.invoiceCount}</div>
            <p className="text-xs text-blue-500/60 mt-1">Total count</p>
          </DashboardWidgetCard>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} to={item.link}>
                <DashboardWidgetCard index={idx + 4} className="h-full group">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${item.bgColor} border border-amber-500/10 group-hover:border-amber-500/30 transition-colors`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-100 group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-amber-200/60 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-500/30 group-hover:text-amber-500 transition-colors" />
                  </div>
                </DashboardWidgetCard>
              </Link>
            );
          })}
        </div>
      </div>
    </PermissionGuard>
  );
}
