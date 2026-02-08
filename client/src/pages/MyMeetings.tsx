import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { meetingApi, leadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Filter, X, Clock, Eye, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { LeadMeeting, LeadMeetingStatus } from '@/types';

export function MyMeetings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingDescription, setEditingDescription] = useState<{ meetingId: number; description: string } | null>(null);
  const [editingStatus, setEditingStatus] = useState<{ meetingId: number; status: LeadMeetingStatus } | null>(null);

  const { data: meetingsResponse, isLoading } = useQuery({
    queryKey: ['my-meetings', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await meetingApi.getAll(params);
      return (response.data.data as LeadMeeting[]) || [];
    },
    refetchInterval: 60000,
  });

  const meetings = meetingsResponse || [];

  const updateMeetingMutation = useMutation({
    mutationFn: async ({
      leadId,
      meetingId,
      data,
    }: {
      leadId: number;
      meetingId: number;
      data: { description?: string; status?: LeadMeetingStatus };
    }) => {
      if (!user?.companyId) throw new Error('Company ID is required');
      const response = await leadApi.updateMeeting(leadId, meetingId, data, user.companyId);
      return response.data.data as LeadMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-meetings', filters] });
      setEditingDescription(null);
      setEditingStatus(null);
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = filters.status !== '' || filters.startDate !== '' || filters.endDate !== '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Canceled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
          <h1 className="text-3xl font-bold text-slate-900">My Meetings</h1>
          <p className="text-slate-600 mt-1">View and manage your assigned meetings and related leads</p>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
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
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">My Assigned Meetings ({meetings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No meetings assigned to you</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Lead</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Meeting Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Meet URL</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting: any) => (
                    <tr key={meeting.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{meeting.title || '-'}</td>
                      <td className="py-3 px-4">
                        {meeting.lead ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => navigate(`/leads/${meeting.lead.id}`)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium flex items-center gap-1"
                            >
                              {meeting.lead.title}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
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
                      <td className="py-3 px-4 text-slate-700">{meeting.durationMinutes} min</td>
                      <td className="py-3 px-4">
                        {meeting.googleMeetUrl ? (
                          <a
                            href={meeting.googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                          >
                            Join Meet
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingStatus?.meetingId === meeting.id ? (
                          <select
                            value={editingStatus.status}
                            onChange={(e) =>
                              setEditingStatus({ meetingId: meeting.id, status: e.target.value as LeadMeetingStatus })
                            }
                            onBlur={() => {
                              if (
                                editingStatus.status !== meeting.status &&
                                meeting.leadId
                              ) {
                                updateMeetingMutation.mutate({
                                  leadId: meeting.leadId,
                                  meetingId: meeting.id,
                                  data: { status: editingStatus.status },
                                });
                              } else {
                                setEditingStatus(null);
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Canceled">Canceled</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingStatus({ meetingId: meeting.id, status: meeting.status })}
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80',
                              getStatusColor(meeting.status)
                            )}
                            title="Click to change status"
                          >
                            {meeting.status}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingDescription?.meetingId === meeting.id ? (
                          <div className="space-y-2 min-w-[200px]">
                            <Textarea
                              value={editingDescription.description}
                              onChange={(e) =>
                                setEditingDescription({ meetingId: meeting.id, description: e.target.value })
                              }
                              placeholder="Add meeting notes..."
                              className="text-sm min-h-[60px]"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (meeting.leadId) {
                                    updateMeetingMutation.mutate({
                                      leadId: meeting.leadId,
                                      meetingId: meeting.id,
                                      data: { description: editingDescription.description },
                                    });
                                  } else {
                                    setEditingDescription(null);
                                  }
                                }}
                                disabled={updateMeetingMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingDescription(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {meeting.description ? (
                              <div
                                className="text-sm text-slate-600 max-w-xs"
                                title={meeting.description}
                              >
                                {meeting.description.length > 50
                                  ? `${meeting.description.substring(0, 50)}...`
                                  : meeting.description}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">No notes</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingDescription({
                                  meetingId: meeting.id,
                                  description: meeting.description || '',
                                })
                              }
                              className="text-xs h-6 px-2"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {meeting.description ? 'Edit' : 'Add'} Note
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {meeting.lead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/leads/${meeting.lead.id}`)}
                              title="View and manage lead"
                              className="text-xs"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Lead
                            </Button>
                          )}
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
