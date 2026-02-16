import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
      case 'Won': return 'bg-emerald-500/30 text-emerald-300';
      case 'Lost': return 'bg-red-500/30 text-red-300';
      case 'New': return 'bg-blue-500/30 text-blue-300';
      case 'Contacted': return 'bg-amber-500/30 text-amber-300';
      case 'Qualified': return 'bg-purple-500/30 text-purple-300';
      case 'Negotiation': return 'bg-orange-500/30 text-orange-300';
      default: return 'bg-slate-600/50 text-slate-300';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Inbox': return 'bg-amber-500/25 text-amber-200';
      case 'Website': return 'bg-blue-500/30 text-blue-300';
      case 'SocialMedia': return 'bg-pink-500/30 text-pink-300';
      case 'FacebookPixel': return 'bg-sky-500/30 text-sky-300';
      default: return 'bg-slate-600/50 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100">Leads</h1>
          <p className="text-amber-200/80 mt-1">Manage your sales pipeline</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50 font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* All Leads vs Complete Leads - game style */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setLeadListView('all')}
          className={cn(
            'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
            leadListView === 'all'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/50'
              : 'bg-slate-700/60 text-amber-100 hover:bg-amber-500/25 hover:text-white border border-amber-500/30'
          )}
        >
          সকল লিড (All Leads)
        </button>
        <button
          type="button"
          onClick={() => setLeadListView('complete')}
          className={cn(
            'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
            leadListView === 'complete'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/50'
              : 'bg-slate-700/60 text-amber-100 hover:bg-emerald-500/25 hover:text-white border border-amber-500/30'
          )}
        >
          কমপ্লিট লিড (Complete Leads)
        </button>
      </div>

      {/* Source Tabs - game style */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'Inbox' as const, label: 'Omni Inbox' },
          { key: 'Website' as const, label: 'Website' },
          { key: 'FacebookPixel' as const, label: 'Facebook Pixel' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setFilters(prev => ({ ...prev, source: tab.key }));
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20 border border-amber-400/50'
                : 'bg-slate-700/60 text-amber-100 hover:bg-amber-500/20 hover:text-white border border-amber-500/30'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters - game style */}
      <div className="rounded-xl overflow-hidden game-panel">
        <div className="p-4 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-100">Search & Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500/60 w-4 h-4" />
              <Input
                placeholder="Search by title, customer name, phone, or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 focus-visible:ring-amber-500/50"
              />
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-amber-500/20">
                <div>
                  <Label htmlFor="status-filter" className="text-amber-200/90">Status</Label>
                  <select
                    id="status-filter"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-500/20 rounded-lg bg-slate-800/60 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
                  <Label htmlFor="category-filter" className="text-amber-200/90">Category</Label>
                  <select
                    id="category-filter"
                    value={filters.categoryId}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-500/20 rounded-lg bg-slate-800/60 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
                  <Label htmlFor="interest-filter" className="text-amber-200/90">Interest</Label>
                  <select
                    id="interest-filter"
                    value={filters.interestId}
                    onChange={(e) => handleFilterChange('interestId', e.target.value)}
                    className="w-full px-3 py-2 border border-amber-500/20 rounded-lg bg-slate-800/60 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
                      className="w-full border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table - game style */}
      <div className="rounded-xl overflow-hidden game-panel">
        <div className="p-4 border-b border-amber-500/20">
          <h3 className="text-lg font-semibold text-amber-100">
            {leadListView === 'complete'
              ? `কমপ্লিট লিড (Complete Leads) (${leads.length})`
              : `সকল লিড (All Leads) (${leads.length})`}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-amber-200/80">Loading leads...</div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-amber-200/70">
              No leads found
            </div>
          ) : (
            <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20 bg-slate-800/60">
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Interest</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Value</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Profit</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Assigned</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Created By</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Created At</th>
                    <th className="text-left py-3 px-4 font-semibold text-amber-200/90">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any, idx: number) => (
                    <tr
                      key={lead.id}
                      className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors animate-game-item-reveal"
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms`, animationFillMode: 'both' }}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-amber-50">{lead.title}</div>
                        {lead.description && (
                          <div className="text-sm text-slate-400 truncate max-w-xs">
                            {lead.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-amber-100">
                        {lead.customerName || '-'}
                      </td>
                      <td className="py-3 px-4 text-amber-100">
                        {lead.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {lead.category ? (
                          <span className="px-2 py-1 bg-blue-500/25 text-blue-300 text-xs rounded-lg">
                            {lead.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {lead.interest ? (
                          <span className="px-2 py-1 bg-purple-500/25 text-purple-300 text-xs rounded-lg">
                            {lead.interest.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSourceColor(lead.source)}`}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lead.value ? (
                          <span className="font-medium text-emerald-400">
                            ৳{Number(lead.value).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-amber-100">
                        {lead.profit !== null && lead.profit !== undefined ? (
                          <span className={cn(
                            "font-medium",
                            Number(lead.profit) > 0 ? "text-emerald-400" : Number(lead.profit) < 0 ? "text-red-400" : "text-slate-400"
                          )}>
                            ৳{Number(lead.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {lead.assignments && lead.assignments.length > 0 ? (
                            lead.assignments.slice(0, 3).map((a: any) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium"
                                title={a.employee?.user?.email}
                              >
                                {a.employee?.user?.profileImage ? (
                                  <img src={a.employee.user.profileImage} alt="" className="w-5 h-5 rounded-full" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-amber-600 text-amber-950 flex items-center justify-center text-[10px] font-bold">
                                    {a.employee?.user?.email?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                )}
                                {a.employee?.user?.email?.split('@')[0] || '-'}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                          {lead.assignments?.length > 3 && (
                            <span className="text-xs text-slate-500">+{lead.assignments.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-amber-100">
                          {lead.createdByUser?.email || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-amber-200/80">
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
                            className="text-amber-200 hover:bg-amber-500/20 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit lead" className="text-amber-200 hover:bg-amber-500/20 hover:text-white">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
      </div>
    </div>
  );
}
