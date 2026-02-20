import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { leadApi, leadCategoryApi, leadInterestApi, campaignApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Search, Filter, X, Eye, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type LeadListView = 'all' | 'complete';

const defaultFilters = {
  search: '',
  status: '',
  categoryId: '',
  interestId: '',
  campaignId: '',
  minValue: '',
  maxValue: '',
  dateFrom: '',
  dateTo: '',
  hasAssignments: '',
  hasProfit: '',
  platform: '',
};

export function Leads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leadListView, setLeadListView] = useState<LeadListView>('all');
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Website' | 'FacebookPixel'>('Inbox');
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch leads with filters
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['leads', leadListView, activeTab, filters],
    queryFn: async () => {
      const params: any = {};
      params.convertedOnly = leadListView === 'complete' ? 'true' : 'false';
      params.source = activeTab === 'Inbox' ? 'Inbox' : activeTab === 'Website' ? 'Website' : 'FacebookPixel';
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.categoryId) params.categoryId = parseInt(filters.categoryId);
      if (filters.interestId) params.interestId = parseInt(filters.interestId);
      if (filters.campaignId) params.campaignId = parseInt(filters.campaignId);
      if (filters.minValue) params.minValue = parseFloat(filters.minValue);
      if (filters.maxValue) params.maxValue = parseFloat(filters.maxValue);
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.hasAssignments === 'yes') params.hasAssignments = 'true';
      else if (filters.hasAssignments === 'no') params.hasAssignments = 'false';
      if (filters.hasProfit === 'yes') params.hasProfit = 'true';
      if (filters.platform) params.platform = filters.platform;

      const response = await leadApi.getAll(params);
      return response.data.data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['lead-categories'],
    queryFn: async () => {
      const response = await leadCategoryApi.getAll();
      return response.data.data || [];
    },
  });

  // Fetch interests
  const { data: interests = [] } = useQuery({
    queryKey: ['lead-interests'],
    queryFn: async () => {
      const response = await leadInterestApi.getAll();
      return response.data.data || [];
    },
  });

  // Fetch campaigns
  const { data: campaignsResponse } = useQuery({
    queryKey: ['campaigns-for-filter', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await campaignApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });
  const campaigns = campaignsResponse || [];

  const leads = leadsResponse || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won': return 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/20';
      case 'Lost': return 'bg-red-500/30 text-red-300 border border-red-500/20';
      case 'New': return 'bg-blue-500/30 text-blue-300 border border-blue-500/20';
      case 'Contacted': return 'bg-amber-500/30 text-amber-300 border border-amber-500/20';
      case 'Qualified': return 'bg-purple-500/30 text-purple-300 border border-purple-500/20';
      case 'Negotiation': return 'bg-orange-500/30 text-orange-300 border border-orange-500/20';
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

  const selectClass = 'w-full px-3 py-2 border border-amber-500/20 rounded-lg bg-slate-800/60 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm';

  return (
    <div className="space-y-4">
      {/* Header – no Add Lead button */}
      <div className="flex justify-between items-center p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-2">
            <Target className="w-8 h-8 text-amber-400" />
            Leads
          </h1>
          <p className="text-amber-200/80 mt-1">Manage your sales pipeline</p>
        </div>
        {/* Add Lead button removed as requested */}
      </div>

      {/* List view tabs */}
      <div className="flex flex-wrap gap-2">
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

      {/* Source tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'Inbox' as const, label: 'Omni Inbox' },
          { key: 'Website' as const, label: 'Website' },
          { key: 'FacebookPixel' as const, label: 'Facebook Pixel' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setFilters(prev => ({ ...prev }));
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

      {/* Search & Filters panel */}
      <div className="rounded-xl overflow-hidden game-panel">
        <div className="p-4 border-b border-amber-500/20">
          <div className="flex items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500/60 w-4 h-4" />
              <Input
                placeholder="টাইটেল, কাস্টমার নাম, ফোন বা বিবরণ দিয়ে খুঁজুন..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/50 focus-visible:ring-amber-500/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent flex items-center gap-2 shrink-0',
                hasActiveFilters && 'border-amber-400 bg-amber-500/10'
              )}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'ফিল্টার লুকান' : 'ফিল্টার দেখান'}
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-900 rounded-full text-[10px] font-bold px-1.5 py-0.5">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="p-4 border-b border-amber-500/10 bg-slate-800/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              {/* Status */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">স্ট্যাটাস (Status)</Label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={selectClass}>
                  <option value="">সব স্ট্যাটাস</option>
                  <option value="New">New – নতুন</option>
                  <option value="Contacted">Contacted – যোগাযোগ হয়েছে</option>
                  <option value="Qualified">Qualified – যোগ্য</option>
                  <option value="Negotiation">Negotiation – আলোচনা চলছে</option>
                  <option value="Won">Won – সফল</option>
                  <option value="Lost">Lost – ব্যর্থ</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">ক্যাটাগরি (Category)</Label>
                <select value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)} className={selectClass}>
                  <option value="">সব ক্যাটাগরি</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Interest */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">ইন্টারেস্ট (Interest)</Label>
                <select value={filters.interestId} onChange={(e) => handleFilterChange('interestId', e.target.value)} className={selectClass}>
                  <option value="">সব ইন্টারেস্ট</option>
                  {interests.map((int: any) => (
                    <option key={int.id} value={int.id}>{int.name}</option>
                  ))}
                </select>
              </div>

              {/* Campaign */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">ক্যাম্পেইন (Campaign)</Label>
                <select value={filters.campaignId} onChange={(e) => handleFilterChange('campaignId', e.target.value)} className={selectClass}>
                  <option value="">সব ক্যাম্পেইন</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Min Value */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">সর্বনিম্ন মূল্য (Min Value ৳)</Label>
                <Input
                  type="number"
                  placeholder="যেমন: 5000"
                  value={filters.minValue}
                  onChange={(e) => handleFilterChange('minValue', e.target.value)}
                  className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/40 text-sm"
                  min={0}
                />
              </div>

              {/* Max Value */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">সর্বোচ্চ মূল্য (Max Value ৳)</Label>
                <Input
                  type="number"
                  placeholder="যেমন: 50000"
                  value={filters.maxValue}
                  onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                  className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/40 text-sm"
                  min={0}
                />
              </div>

              {/* Date From */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">তারিখ থেকে (Date From)</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="bg-slate-800/60 border-amber-500/20 text-amber-100 text-sm"
                />
              </div>

              {/* Date To */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">তারিখ পর্যন্ত (Date To)</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="bg-slate-800/60 border-amber-500/20 text-amber-100 text-sm"
                />
              </div>

              {/* Has Assignments */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">অ্যাসাইন স্ট্যাটাস</Label>
                <select value={filters.hasAssignments} onChange={(e) => handleFilterChange('hasAssignments', e.target.value)} className={selectClass}>
                  <option value="">সব লিড</option>
                  <option value="yes">অ্যাসাইন করা আছে</option>
                  <option value="no">অ্যাসাইন করা নেই</option>
                </select>
              </div>

              {/* Has Profit */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">মুনাফা আছে?</Label>
                <select value={filters.hasProfit} onChange={(e) => handleFilterChange('hasProfit', e.target.value)} className={selectClass}>
                  <option value="">সব লিড</option>
                  <option value="yes">মুনাফা আছে</option>
                </select>
              </div>

              {/* Platform (conversation source) */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">প্ল্যাটফর্ম (Platform)</Label>
                <select value={filters.platform} onChange={(e) => handleFilterChange('platform', e.target.value)} className={selectClass}>
                  <option value="">সব প্ল্যাটফর্ম</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="facebook">📘 Facebook</option>
                </select>
              </div>

              {/* Clear button */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full border-red-500/50 text-red-300 hover:bg-red-500/20 bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    ফিল্টার মুছুন
                  </Button>
                </div>
              )}
            </div>

            {/* Active filter badges */}
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                    স্ট্যাটাস: {filters.status}
                    <button onClick={() => handleFilterChange('status', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.categoryId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                    ক্যাটাগরি: {categories.find((c: any) => String(c.id) === filters.categoryId)?.name}
                    <button onClick={() => handleFilterChange('categoryId', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.interestId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
                    ইন্টারেস্ট: {interests.find((i: any) => String(i.id) === filters.interestId)?.name}
                    <button onClick={() => handleFilterChange('interestId', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.campaignId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
                    ক্যাম্পেইন: {campaigns.find((c: any) => String(c.id) === filters.campaignId)?.name}
                    <button onClick={() => handleFilterChange('campaignId', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.minValue && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                    Min: ৳{filters.minValue}
                    <button onClick={() => handleFilterChange('minValue', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.maxValue && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                    Max: ৳{filters.maxValue}
                    <button onClick={() => handleFilterChange('maxValue', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs border border-sky-500/30">
                    থেকে: {filters.dateFrom}
                    <button onClick={() => handleFilterChange('dateFrom', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.dateTo && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs border border-sky-500/30">
                    পর্যন্ত: {filters.dateTo}
                    <button onClick={() => handleFilterChange('dateTo', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.hasAssignments && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs border border-orange-500/30">
                    অ্যাসাইন: {filters.hasAssignments === 'yes' ? 'আছে' : 'নেই'}
                    <button onClick={() => handleFilterChange('hasAssignments', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.hasProfit && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-lime-500/20 text-lime-300 text-xs border border-lime-500/30">
                    মুনাফা আছে
                    <button onClick={() => handleFilterChange('hasProfit', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.platform && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs border border-cyan-500/30">
                    {filters.platform === 'whatsapp' ? '💬 WhatsApp' : '📘 Facebook'}
                    <button onClick={() => handleFilterChange('platform', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="rounded-xl overflow-hidden game-panel">
        <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-100">
            {leadListView === 'complete'
              ? `কমপ্লিট লিড (${leads.length})`
              : `সকল লিড (${leads.length})`}
          </h3>
          {isLoading && <span className="text-amber-200/60 text-sm animate-pulse">লোড হচ্ছে...</span>}
        </div>
        <div className="overflow-x-auto">
          {!isLoading && leads.length === 0 ? (
            <div className="text-center py-12 text-amber-200/70">
              <Target className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
              <p>কোনো লিড পাওয়া যায়নি</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-amber-400 text-sm underline">ফিল্টার মুছুন</button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-500/20 bg-slate-800/60">
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Interest</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Assigned</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Created By</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Created At</th>
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: any, idx: number) => (
                  <tr
                    key={lead.id}
                    className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-amber-50 text-sm">{lead.title}</div>
                      {lead.description && (
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">{lead.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-amber-100 text-sm">{lead.customerName || '-'}</td>
                    <td className="py-3 px-4 text-amber-100 text-sm">{lead.phone || '-'}</td>
                    <td className="py-3 px-4">
                      {lead.category ? (
                        <span className="px-2 py-1 bg-blue-500/25 text-blue-300 text-xs rounded-lg">{lead.category.name}</span>
                      ) : <span className="text-slate-500 text-sm">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      {lead.interest ? (
                        <span className="px-2 py-1 bg-purple-500/25 text-purple-300 text-xs rounded-lg">{lead.interest.name}</span>
                      ) : <span className="text-slate-500 text-sm">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(lead.status)}`}>{lead.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getSourceColor(lead.source)}`}>{lead.source}</span>
                    </td>
                    <td className="py-3 px-4">
                      {lead.value ? (
                        <span className="font-medium text-emerald-400 text-sm">৳{Number(lead.value).toLocaleString()}</span>
                      ) : <span className="text-slate-500 text-sm">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      {lead.profit !== null && lead.profit !== undefined ? (
                        <span className={cn('font-medium text-sm', Number(lead.profit) > 0 ? 'text-emerald-400' : Number(lead.profit) < 0 ? 'text-red-400' : 'text-slate-400')}>
                          ৳{Number(lead.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : <span className="text-slate-400 text-sm">-</span>}
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
                                <img src={a.employee.user.profileImage} alt="" className="w-4 h-4 rounded-full" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-amber-600 text-amber-950 flex items-center justify-center text-[9px] font-bold">
                                  {a.employee?.user?.email?.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                              {a.employee?.user?.email?.split('@')[0] || '-'}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                        {lead.assignments?.length > 3 && (
                          <span className="text-xs text-slate-500">+{lead.assignments.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-amber-100">{lead.createdByUser?.email || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-amber-200/80">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          title="View lead details"
                          className="text-amber-200 hover:bg-amber-500/20 hover:text-white p-1.5"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit lead" className="text-amber-200 hover:bg-amber-500/20 hover:text-white p-1.5">
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
