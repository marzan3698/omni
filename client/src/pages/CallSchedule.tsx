import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { callApi, employeeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Search, Filter, X, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { LeadCall } from '@/types';

export function CallSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch employees for filter
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await employeeApi.getAll(user.companyId);
      return (response.data.data as any[]) || [];
    },
    enabled: !!user?.companyId,
  });

  // Fetch calls with filters
  const { data: callsResponse, isLoading } = useQuery({
    queryKey: ['calls', filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.assignedTo) params.assignedTo = parseInt(filters.assignedTo);
      
      const response = await callApi.getAll(params);
      return (response.data.data as LeadCall[]) || [];
    },
    refetchInterval: 60000, // Refresh every 1 minute
  });

  const calls = callsResponse || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      assignedTo: '',
    });
  };

  const hasActiveFilters = filters.status !== '' || filters.startDate !== '' || filters.endDate !== '' || filters.assignedTo !== '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Canceled': return 'bg-red-100 text-red-700';
      case 'NoAnswer': return 'bg-yellow-100 text-yellow-700';
      case 'Busy': return 'bg-orange-100 text-orange-700';
      case 'LeftVoicemail': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDateTime = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Call Schedule</h1>
          <p className="text-slate-600 mt-1">View and manage all scheduled calls</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                  <option value="NoAnswer">No Answer</option>
                  <option value="Busy">Busy</option>
                  <option value="LeftVoicemail">Left Voicemail</option>
                </select>
              </div>

              <div>
                <Label htmlFor="start-date-filter">Start Date</Label>
                <Input
                  id="start-date-filter"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="end-date-filter">End Date</Label>
                <Input
                  id="end-date-filter"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="assigned-to-filter">Assigned To</Label>
                <select
                  id="assigned-to-filter"
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.email || emp.user?.name || `Employee ${emp.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">
            All Calls ({calls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading calls...</div>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No calls found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Call Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Lead</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Call Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Phone Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call: any) => (
                    <tr key={call.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{call.title || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        {call.lead ? (
                          <button
                            onClick={() => navigate(`/leads/${call.lead.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                          >
                            {call.lead.title}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {call.assignedEmployee ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">
                              {call.assignedEmployee.user?.email || call.assignedEmployee.user?.name || 'Employee'}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-900">{formatDateTime(call.callTime)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {call.phoneNumber ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{call.phoneNumber}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          getStatusColor(call.status)
                        )}>
                          {call.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {call.notes ? (
                          <div className="text-sm text-slate-600 truncate max-w-xs" title={call.notes}>
                            {call.notes}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/leads/${call.leadId}`)}
                            title="View lead"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
