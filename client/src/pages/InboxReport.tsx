import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboxReportApi, type InboxReportFilters } from '@/lib/inbox-report';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  Tag,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useAuth } from '@/contexts/AuthContext';

export default function InboxReport() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<InboxReportFilters>(() => {
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  });

  // Fetch report data
  const {
    data: reportData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inbox-report', filters],
    queryFn: () => inboxReportApi.getInboxReport(filters),
    enabled: !!user,
  });

  // Get unique labels from labelBreakdown for filter dropdown
  const availableLabels = reportData?.labelBreakdown.map((lb) => lb.labelName) || [];

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLabelChange = (labelName: string) => {
    setFilters((prev) => ({
      ...prev,
      labelName: labelName === '' ? undefined : labelName,
    }));
  };

  const handleResetFilters = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFilters({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const handleQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setFilters({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      labelName: filters.labelName, // Preserve label filter
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error} />
      </div>
    );
  }

  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100 mt-1';
  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const btnActive = 'bg-amber-500/30 border-amber-500 text-amber-100';

  // Determine which quick date range is active
  const getActiveQuickRange = (): number | null => {
    if (!filters.startDate || !filters.endDate) return null;
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (end.getTime() !== today.getTime()) return null;
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 1;
    if (days === 6) return 7;
    if (days === 29) return 30;
    if (days === 89) return 90;
    return null;
  };
  const activeQuickRange = getActiveQuickRange();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-amber-400" />
            Inbox Report
          </h1>
          <p className="text-amber-200/80 mt-1">Comprehensive analytics and performance metrics for inbox conversations</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className={`flex items-center gap-2 shrink-0 py-2 px-4 ${btnOutline}`} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters Section */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
            <Calendar className="h-5 w-5 text-amber-400" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="md:col-span-4">
              <Label className="mb-2 block text-amber-200/90">Quick Date Range</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(1)}
                  className={`min-h-[36px] py-2 px-3 leading-normal ${activeQuickRange === 1 ? btnActive : btnOutline}`}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(7)}
                  className={`min-h-[36px] py-2 px-3 leading-normal ${activeQuickRange === 7 ? btnActive : btnOutline}`}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(30)}
                  className={`min-h-[36px] py-2 px-3 leading-normal ${activeQuickRange === 30 ? btnActive : btnOutline}`}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(90)}
                  className={`min-h-[36px] py-2 px-3 leading-normal ${activeQuickRange === 90 ? btnActive : btnOutline}`}
                >
                  Last 90 Days
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="startDate" className="text-amber-200/90">Start Date</Label>
              <Input id="startDate" type="date" value={filters.startDate || ''} onChange={(e) => handleDateChange('startDate', e.target.value)} className={inputDark} />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-amber-200/90">End Date</Label>
              <Input id="endDate" type="date" value={filters.endDate || ''} onChange={(e) => handleDateChange('endDate', e.target.value)} className={inputDark} />
            </div>
            <div>
              <Label htmlFor="labelFilter" className="text-amber-200/90">Filter by Label</Label>
              <select
                id="labelFilter"
                value={filters.labelName || ''}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-amber-500/20 bg-slate-800/60 px-3 py-2 text-sm text-amber-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              >
                <option value="">All Labels</option>
                {availableLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleResetFilters} className={`w-full ${btnOutline} font-medium`}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </GamePanel>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <GameCard key={i} index={i}>
              <div className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-amber-500/20 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-amber-500/20 rounded w-1/2"></div>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <GameCard index={0}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-200/80">Total Users</p>
                  <p className="text-3xl font-bold text-amber-100 mt-2">
                    {reportData.summary.totalUniqueUsers}
                  </p>
                </div>
                <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/20">
                  <Users className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>
          </GameCard>
          <GameCard index={1}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-200/80">Total Conversations</p>
                  <p className="text-3xl font-bold text-amber-100 mt-2">{reportData.summary.totalConversations}</p>
                </div>
                <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/20">
                  <MessageSquare className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>
          </GameCard>
          <GameCard index={2}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-200/80">Total Messages</p>
                  <p className="text-3xl font-bold text-amber-100 mt-2">{reportData.summary.totalMessages}</p>
                </div>
                <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/20">
                  <Mail className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>
          </GameCard>
          <GameCard index={3}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-200/80">Open</p>
                  <p className="text-3xl font-bold text-amber-100 mt-2">{reportData.summary.openConversations}</p>
                </div>
                <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/20">
                  <CheckCircle className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>
          </GameCard>
          <GameCard index={4}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-200/80">Closed</p>
                  <p className="text-3xl font-bold text-amber-100 mt-2">{reportData.summary.closedConversations}</p>
                </div>
                <div className="p-3 rounded-full border border-amber-500/30 bg-amber-500/20">
                  <XCircle className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>
          </GameCard>
        </div>
      ) : null}

      {/* Employee Performance Table */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100 mb-4">
            <Users className="h-5 w-5 text-amber-400" />
            Employee Performance
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-amber-500/20 rounded"></div>
              ))}
            </div>
          ) : reportData && reportData.employeePerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20">
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Employee Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Email</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-200/90">Assigned Conversations</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-200/90">Messages Handled</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.employeePerformance.map((employee) => (
                    <tr key={employee.employeeId} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                      <td className="py-3 px-4 text-amber-100">{employee.employeeName}</td>
                      <td className="py-3 px-4 text-amber-200/80">{employee.email}</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-100">{employee.assignedConversations}</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-100">{employee.messagesHandled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-amber-200/70 text-center py-8">No employee performance data available</p>
          )}
        </div>
      </GamePanel>

      {/* Label Breakdown */}
      <GamePanel>
        <div className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100 mb-4">
            <Tag className="h-5 w-5 text-amber-400" />
            Label Distribution
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-amber-500/20 rounded"></div>
              ))}
            </div>
          ) : reportData && reportData.labelBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20">
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Label Name</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-200/90">Conversation Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.labelBreakdown.map((label, index) => (
                    <tr key={index} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2 text-amber-100">
                          <Tag className="h-4 w-4 text-amber-400" />
                          {label.labelName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-100">{label.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-amber-200/70 text-center py-8">No label data available</p>
          )}
        </div>
      </GamePanel>

      {/* Daily Trend */}
      {reportData && reportData.dailyTrend.length > 0 && (
        <GamePanel>
          <div className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-100 mb-4">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              Daily Trend
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20">
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-200/90">Messages</th>
                    <th className="text-right py-3 px-4 font-semibold text-amber-200/90">Conversations</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailyTrend.map((day, index) => (
                    <tr key={index} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                      <td className="py-3 px-4 text-amber-100">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-100">{day.messages}</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-100">{day.conversations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </GamePanel>
      )}
    </div>
  );
}
