import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { meetingApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Search, Filter, X, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { LeadMeeting } from '@/types';

export function MeetingSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: 'Scheduled',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch meetings with filters
  const { data: meetingsResponse, isLoading } = useQuery({
    queryKey: ['meetings', filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await meetingApi.getAll(params);
      return (response.data.data as LeadMeeting[]) || [];
    },
    refetchInterval: 60000, // Refresh every 1 minute
  });

  const meetings = meetingsResponse || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'Scheduled',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = filters.status !== 'Scheduled' || filters.startDate !== '' || filters.endDate !== '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Canceled': return 'bg-red-100 text-red-700';
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

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meeting Schedule</h1>
          <p className="text-slate-600 mt-1">View and manage all scheduled meetings</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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

      {/* Meetings Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">
            All Meetings ({meetings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading meetings...</div>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No meetings found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Meeting Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Lead</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Meeting Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Google Meet</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting: any) => (
                    <tr key={meeting.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{meeting.title}</div>
                        {meeting.description && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">
                            {meeting.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {meeting.lead ? (
                          <button
                            onClick={() => navigate(`/leads/${meeting.lead.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                          >
                            {meeting.lead.title}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-900">{formatDateTime(meeting.meetingTime)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700">{meeting.durationMinutes} min</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          getStatusColor(meeting.status)
                        )}>
                          {meeting.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={meeting.googleMeetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Join Meeting
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/leads/${meeting.leadId}`)}
                            title="View lead"
                          >
                            <Calendar className="w-4 h-4" />
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
