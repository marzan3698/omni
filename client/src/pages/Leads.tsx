import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { leadApi, leadCategoryApi, leadInterestApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Plus, Search, Filter, X, Edit, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type LeadListView = 'all' | 'complete';

export function Leads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leadListView, setLeadListView] = useState<LeadListView>('all');
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Website' | 'FacebookPixel'>('Inbox');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: 'Inbox',
    categoryId: '',
    interestId: '',
    createdBy: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch leads with filters (All Leads excludes converted; Complete Leads shows only converted)
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['leads', leadListView, activeTab, filters],
    queryFn: async () => {
      const params: any = {};
      params.convertedOnly = leadListView === 'complete' ? 'true' : 'false';
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      params.source =
        activeTab === 'Inbox'
          ? 'Inbox'
          : activeTab === 'Website'
          ? 'Website'
          : 'FacebookPixel';
      if (filters.categoryId) params.categoryId = parseInt(filters.categoryId);
      if (filters.interestId) params.interestId = parseInt(filters.interestId);
      if (filters.createdBy) params.createdBy = filters.createdBy;

      const response = await leadApi.getAll(params);
      return response.data.data || [];
    },
  });

  // Fetch categories and interests for filters
  const { data: categories = [] } = useQuery({
    queryKey: ['lead-categories'],
    queryFn: async () => {
      const response = await leadCategoryApi.getAll();
      return response.data.data || [];
    },
  });

  const { data: interests = [] } = useQuery({
    queryKey: ['lead-interests'],
    queryFn: async () => {
      const response = await leadInterestApi.getAll();
      return response.data.data || [];
    },
  });

  const leads = leadsResponse || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      source: activeTab,
      categoryId: '',
      interestId: '',
      createdBy: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won': return 'bg-green-100 text-green-700';
      case 'Lost': return 'bg-red-100 text-red-700';
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-yellow-100 text-yellow-700';
      case 'Qualified': return 'bg-purple-100 text-purple-700';
      case 'Negotiation': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Inbox': return 'bg-indigo-100 text-indigo-700';
      case 'Website': return 'bg-blue-100 text-blue-700';
      case 'SocialMedia': return 'bg-pink-100 text-pink-700';
      case 'FacebookPixel': return 'bg-sky-100 text-sky-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600 mt-1">Manage your sales pipeline</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* All Leads vs Complete Leads */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setLeadListView('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium border',
            leadListView === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          সকল লিড (All Leads)
        </button>
        <button
          type="button"
          onClick={() => setLeadListView('complete')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium border',
            leadListView === 'complete'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          কমপ্লিট লিড (Complete Leads)
        </button>
      </div>

      {/* Source Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('Inbox');
            setFilters(prev => ({ ...prev, source: 'Inbox' }));
          }}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium border',
            activeTab === 'Inbox'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          Omni Inbox
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('Website');
            setFilters(prev => ({ ...prev, source: 'Website' }));
          }}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium border',
            activeTab === 'Website'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          Website
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('FacebookPixel');
            setFilters(prev => ({ ...prev, source: 'FacebookPixel' }));
          }}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium border',
            activeTab === 'FacebookPixel'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          Facebook Pixel
        </button>
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
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by title, customer name, phone, or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <select
                    id="status-filter"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {/* Source is controlled by tabs, so we keep it implicit here */}

                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <select
                    id="category-filter"
                    value={filters.categoryId}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="interest-filter">Interest</Label>
                  <select
                    id="interest-filter"
                    value={filters.interestId}
                    onChange={(e) => handleFilterChange('interestId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Interests</option>
                    {interests.map((int: any) => (
                      <option key={int.id} value={int.id}>
                        {int.name}
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
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">
            {leadListView === 'complete'
              ? `কমপ্লিট লিড (Complete Leads) (${leads.length})`
              : `সকল লিড (All Leads) (${leads.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading leads...</div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No leads found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Interest</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Value</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Profit</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Created By</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Created At</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{lead.title}</div>
                        {lead.description && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">
                            {lead.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {lead.customerName || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {lead.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {lead.category ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {lead.category.name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {lead.interest ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {lead.interest.name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceColor(lead.source)}`}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lead.value ? (
                          <span className="font-medium text-green-600">
                            ৳{Number(lead.value).toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {lead.profit !== null && lead.profit !== undefined ? (
                          <span className={cn(
                            "font-medium",
                            Number(lead.profit) > 0 ? "text-green-600" : Number(lead.profit) < 0 ? "text-red-600" : "text-slate-600"
                          )}>
                            ৳{Number(lead.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-600">
                          {lead.createdByUser?.email || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-500">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            title="View lead details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit lead">
                            <Edit className="w-4 h-4" />
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
