import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { callApi, leadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Filter, X, Clock, User, Eye, FileText, Edit, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { LeadCall, LeadCallStatus } from '@/types';

export function MyCalls() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingCallNote, setEditingCallNote] = useState<{ callId: number; note: string } | null>(null);
  const [editingCallStatus, setEditingCallStatus] = useState<{ callId: number; status: LeadCallStatus } | null>(null);

  // Fetch calls assigned to current employee
  // The backend getAllCalls already filters by assignedTo for non-admin users
  const { data: callsResponse, isLoading } = useQuery({
    queryKey: ['my-calls', filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await callApi.getAll(params);
      return (response.data.data as LeadCall[]) || [];
    },
    refetchInterval: 60000, // Refresh every 1 minute
  });

  const calls = callsResponse || [];

  // Mutation for adding/updating call notes
  const addCallNoteMutation = useMutation({
    mutationFn: async ({ callId, note, leadId }: { callId: number; note: string; leadId: number }) => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }
      const response = await leadApi.addCallNote(leadId, callId, note, user.companyId);
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calls', filters] });
      setEditingCallNote(null);
    },
  });

  // Mutation for updating call status
  const updateCallStatusMutation = useMutation({
    mutationFn: async ({ callId, status, leadId }: { callId: number; status: LeadCallStatus; leadId: number }) => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }
      const response = await leadApi.updateCall(leadId, callId, { status }, user.companyId);
      return response.data.data as LeadCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calls', filters] });
      setEditingCallStatus(null);
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = filters.status !== '' || filters.startDate !== '' || filters.endDate !== '';

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
          <h1 className="text-3xl font-bold text-slate-900">My Calls</h1>
          <p className="text-slate-600 mt-1">View and manage your assigned calls and related leads</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
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
            My Assigned Calls ({calls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading calls...</div>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No calls assigned to you
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Call Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Lead</th>
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
                            <div className="space-y-1">
                              <button
                                onClick={() => navigate(`/leads/${call.lead.id}`)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium flex items-center gap-1"
                              >
                                {call.lead.title}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              {call.lead.phone && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {call.lead.phone}
                                </div>
                              )}
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
                              <a href={`tel:${call.phoneNumber}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                {call.phoneNumber}
                              </a>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingCallStatus?.callId === call.id ? (
                            <select
                              value={editingCallStatus.status}
                              onChange={(e) => setEditingCallStatus({ callId: call.id, status: e.target.value as LeadCallStatus })}
                              onBlur={() => {
                                if (editingCallStatus.status !== call.status && call.leadId) {
                                  updateCallStatusMutation.mutate({
                                    callId: call.id,
                                    status: editingCallStatus.status,
                                    leadId: call.leadId,
                                  });
                                } else {
                                  setEditingCallStatus(null);
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Completed">Completed</option>
                              <option value="Canceled">Canceled</option>
                              <option value="NoAnswer">No Answer</option>
                              <option value="Busy">Busy</option>
                              <option value="LeftVoicemail">Left Voicemail</option>
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingCallStatus({ callId: call.id, status: call.status })}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80",
                                getStatusColor(call.status)
                              )}
                              title="Click to change status"
                            >
                              {call.status}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingCallNote?.callId === call.id ? (
                            <div className="space-y-2 min-w-[200px]">
                              <Textarea
                                value={editingCallNote.note}
                                onChange={(e) => setEditingCallNote({ callId: call.id, note: e.target.value })}
                                placeholder="Add call notes..."
                                className="text-sm min-h-[60px]"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (editingCallNote.note.trim() && call.leadId) {
                                      addCallNoteMutation.mutate({
                                        callId: call.id,
                                        note: editingCallNote.note,
                                        leadId: call.leadId,
                                      });
                                    } else {
                                      setEditingCallNote(null);
                                    }
                                  }}
                                  disabled={addCallNoteMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCallNote(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {call.notes ? (
                                <div className="text-sm text-slate-600 max-w-xs" title={call.notes}>
                                  {call.notes.length > 50 ? `${call.notes.substring(0, 50)}...` : call.notes}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">No notes</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCallNote({ callId: call.id, note: call.notes || '' })}
                                className="text-xs h-6 px-2"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                {call.notes ? 'Edit' : 'Add'} Note
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {call.lead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/leads/${call.lead.id}`)}
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
