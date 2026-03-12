import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { leadApi, leadCategoryApi, leadInterestApi, leadPriorityApi, leadLabelApi, leadStatusConfigApi, campaignApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Search, Filter, X, Eye, Edit, ChevronDown, ChevronUp, Download, Upload, Users, Code2, Plus, CheckCircle2 } from 'lucide-react';
import { ErrorAlert } from '@/components/ErrorAlert';
import { EmployeeSelector } from '@/components/EmployeeSelector';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type LeadListView = 'all' | 'complete';

const defaultFilters = {
  search: '',
  statusId: '',
  priorityId: '',
  labelIds: '' as string,
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
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [leadListView, setLeadListView] = useState<LeadListView>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set());
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkAssignEmployeeIds, setBulkAssignEmployeeIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Website' | 'FacebookPixel' | 'Excel' | 'Custom'>('Inbox');
  const [customLeadSuccess, setCustomLeadSuccess] = useState(false);
  const [customLeadError, setCustomLeadError] = useState<string | null>(null);
  const [showCustomLeadModal, setShowCustomLeadModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    title: '',
    customerName: '',
    phone: '',
    description: '',
    categoryId: '',
    interestId: '',
    statusId: '',
    priorityId: '',
    campaignId: '',
    value: '',
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors?: { row: number; message: string }[] } | null>(null);
  const [errorDialog, setErrorDialog] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch leads with filters
  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['leads', leadListView, activeTab, filters],
    queryFn: async () => {
      const params: any = {};
      params.convertedOnly = leadListView === 'complete' ? 'true' : 'false';
      params.source = activeTab === 'Inbox' ? 'Inbox' : activeTab === 'Website' ? 'Website' : activeTab === 'FacebookPixel' ? 'FacebookPixel' : activeTab === 'Custom' ? 'Custom' : 'Excel';
      if (filters.search) params.search = filters.search;
      if (filters.statusId) params.statusId = parseInt(filters.statusId);
      if (filters.priorityId) params.priorityId = parseInt(filters.priorityId);
      if (filters.labelIds) params.labelIds = [parseInt(filters.labelIds)].filter((n) => !isNaN(n) && n > 0);
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

  const { data: interests = [] } = useQuery({
    queryKey: ['lead-interests'],
    queryFn: async () => {
      const response = await leadInterestApi.getAll();
      return response.data.data || [];
    },
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['lead-priorities'],
    queryFn: async () => {
      const response = await leadPriorityApi.getAll();
      return response.data.data || [];
    },
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['lead-labels'],
    queryFn: async () => {
      const response = await leadLabelApi.getAll();
      return response.data.data || [];
    },
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['lead-statuses'],
    queryFn: async () => {
      const response = await leadStatusConfigApi.getAll();
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

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const res = await leadApi.downloadTemplate();
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'omni-lead-import-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorDialog(err);
    }
  };

  // Import Excel mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => leadApi.importFromExcel(file),
    onSuccess: (res) => {
      const data = res.data.data;
      setImportResult({
        successCount: data.successCount ?? 0,
        errorCount: data.errorCount ?? 0,
        errors: data.errors,
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: any) => {
      setImportResult(null);
      setErrorDialog(err);
    },
  });

  // Create Custom Lead mutation
  const createLeadMutation = useMutation({
    mutationFn: (data: any) => leadApi.create(data),
    onSuccess: () => {
      setCustomLeadSuccess(true);
      setCustomLeadError(null);
      setCustomForm({ title: '', customerName: '', phone: '', description: '', categoryId: '', interestId: '', statusId: '', priorityId: '', campaignId: '', value: '' });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setTimeout(() => { setCustomLeadSuccess(false); setShowCustomLeadModal(false); }, 1500);
    },
    onError: (err: any) => {
      setCustomLeadError(err?.response?.data?.message || 'লিড তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    },
  });

  const handleCustomLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomLeadError(null);
    if (!customForm.title.trim()) {
      setCustomLeadError('লিডের শিরোনাম (Title) দেওয়া আবশ্যক।');
      return;
    }
    const payload: any = {
      title: customForm.title.trim(),
      source: 'Custom',
    };
    if (customForm.customerName) payload.customerName = customForm.customerName;
    if (customForm.phone) payload.phone = customForm.phone;
    if (customForm.description) payload.description = customForm.description;
    if (customForm.categoryId) payload.categoryId = parseInt(customForm.categoryId);
    if (customForm.interestId) payload.interestId = parseInt(customForm.interestId);
    if (customForm.statusId) payload.statusId = parseInt(customForm.statusId);
    if (customForm.priorityId) payload.priorityId = parseInt(customForm.priorityId);
    if (customForm.campaignId) payload.campaignId = parseInt(customForm.campaignId);
    if (customForm.value !== '') {
      const parsed = parseFloat(customForm.value);
      if (!isNaN(parsed) && parsed >= 0) payload.value = parsed;
    }
    createLeadMutation.mutate(payload);
  };

  const handleCustomFormChange = (key: string, value: string) => {
    setCustomForm(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportResult(null);
      importMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === leads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(leads.map((l: any) => l.id)));
    }
  };

  const canBulkAssign = (user?.roleName === 'SuperAdmin' || hasPermission?.('can_manage_leads')) && !!user?.companyId;

  const bulkAssignMutation = useMutation({
    mutationFn: ({ leadIds, employeeIds }: { leadIds: number[]; employeeIds: number[] }) =>
      leadApi.bulkAssign(leadIds, employeeIds, user!.companyId!),
    onSuccess: (res) => {
      const data = res.data.data;
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setBulkAssignModalOpen(false);
      setSelectedLeadIds(new Set());
      setBulkAssignEmployeeIds([]);
      setImportResult(null);
    },
    onError: (err: any) => {
      setErrorDialog(err);
    },
  });

  const handleBulkAssignConfirm = () => {
    if (bulkAssignEmployeeIds.length === 0 || selectedLeadIds.size === 0 || !user?.companyId) return;
    bulkAssignMutation.mutate({
      leadIds: Array.from(selectedLeadIds),
      employeeIds: bulkAssignEmployeeIds,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const getStatusColor = (status: { code?: string; name?: string } | string) => {
    const code = typeof status === 'object' ? status?.code : status;
    switch (code) {
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
      case 'Excel': return 'bg-emerald-500/30 text-emerald-300';
      case 'Custom': return 'bg-violet-500/30 text-violet-300';
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
          { key: 'Excel' as const, label: 'Excel' },
          { key: 'Custom' as const, label: 'Custom Leads' },
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

      {/* Website tab: Link to Lead Form Config / Embed code */}
      {activeTab === 'Website' && hasPermission?.('can_manage_lead_config') && (
        <div className="rounded-xl border border-blue-500/20 bg-slate-800/40 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={() => navigate('/lead-form-config')}
              className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              Lead Form Configuration
            </Button>
            <span className="text-slate-400 text-sm">Configure the form, get embed code, and customize fields.</span>
          </div>
        </div>
      )}

      {/* Custom Leads tab: just shows the list below (same as other tabs) */}

      {/* Excel tab: Download template + Upload */}
      {activeTab === 'Excel' && (
        <div className="rounded-xl border border-amber-500/20 bg-slate-800/40 p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={handleDownloadTemplate}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              টেমপ্লেট ডাউনলোড করুন
            </Button>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
                variant="outline"
                className="border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/20 bg-transparent flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {importMutation.isPending ? 'আপলোড হচ্ছে...' : 'Excel ফাইল আপলোড করুন'}
              </Button>
            </div>
          </div>
          {importResult && (
            <div className={cn(
              'p-3 rounded-lg border text-sm',
              importResult.errorCount > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            )}>
              <p><strong>সফল:</strong> {importResult.successCount} | <strong>ত্রুটি:</strong> {importResult.errorCount}</p>
              {importResult.errors && importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.message}</li>
                  ))}
                  {importResult.errors.length > 5 && <li>... আরো {importResult.errors.length - 5} টি ত্রুটি</li>}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

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
            {activeTab === 'Custom' && (
              <Button
                size="sm"
                onClick={() => { setCustomLeadError(null); setCustomLeadSuccess(false); setShowCustomLeadModal(true); }}
                className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white border border-violet-400/50 shadow-sm shadow-violet-500/20 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                + কাস্টম লিড যোগ করুন
              </Button>
            )}
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="p-4 border-b border-amber-500/10 bg-slate-800/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

              {/* Status */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">স্ট্যাটাস (Status)</Label>
                <select value={filters.statusId} onChange={(e) => handleFilterChange('statusId', e.target.value)} className={selectClass}>
                  <option value="">সব স্ট্যাটাস</option>
                  {(statuses as { id: number; name: string; code: string }[]).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">প্রায়োরিটি (Priority)</Label>
                <select value={filters.priorityId} onChange={(e) => handleFilterChange('priorityId', e.target.value)} className={selectClass}>
                  <option value="">সব প্রায়োরিটি</option>
                  {(priorities as { id: number; name: string }[]).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Label */}
              <div>
                <Label className="text-amber-200/90 text-xs mb-1 block">লেবেল (Label)</Label>
                <select value={filters.labelIds} onChange={(e) => handleFilterChange('labelIds', e.target.value)} className={selectClass}>
                  <option value="">সব লেবেল</option>
                  {(labels as { id: number; name: string }[]).map((l) => (
                    <option key={l.id} value={String(l.id)}>{l.name}</option>
                  ))}
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
                {filters.statusId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                    স্ট্যাটাস: {filters.statusId}
                    <button onClick={() => handleFilterChange('statusId', '')} className="hover:text-white"><X className="w-3 h-3" /></button>
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

      {/* Bulk action bar */}
      {canBulkAssign && selectedLeadIds.size > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between">
          <span className="text-amber-100 text-sm font-medium">
            {selectedLeadIds.size} লিড সিলেক্ট করা হয়েছে
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLeadIds(new Set())}
              className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
            >
              সিলেকশন ক্লিয়ার করুন
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkAssignModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white flex gap-2"
            >
              <Users className="w-4 h-4" />
              বাল্ক অ্যাসাইন করুন
            </Button>
          </div>
        </div>
      )}

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
                  {canBulkAssign && (
                    <th className="w-10 py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={leads.length > 0 && selectedLeadIds.size === leads.length}
                        onChange={toggleSelectAll}
                        className="rounded border-amber-500/50 bg-slate-800 text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                  )}
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
                  <th className="text-left py-3 px-4 font-semibold text-amber-200/90 text-sm">{activeTab === 'Excel' ? 'আপলোড করেছেন' : 'Created By'}</th>
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
                    {canBulkAssign && (
                      <td className="w-10 py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="rounded border-amber-500/50 bg-slate-800 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                    )}
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
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(lead.status || lead)}`}>{typeof lead.status === 'object' ? lead.status?.name : (lead as any).status}</span>
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
                      <div className="text-xs text-amber-100">{lead.createdByUser?.name || lead.createdByUser?.email || '-'}</div>
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
                        <Button variant="ghost" size="sm" title="Edit lead" className="text-amber-200 hover:bg-amber-500/20 hover:text-white hover:bg-amber-500/20 p-1.5">
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
      {/* Bulk Assign Modal */}
      {bulkAssignModalOpen && user?.companyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-amber-500/20 shadow-xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-amber-100">বাল্ক অ্যাসাইন করুন</h3>
              <Button variant="ghost" size="icon" onClick={() => setBulkAssignModalOpen(false)} className="text-amber-200 hover:bg-amber-500/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-amber-200/80 text-sm mb-4">
                {selectedLeadIds.size} টি লিডে অ্যাসাইন করা হবে। এমপ্লয়ী নির্বাচন করুন:
              </p>
              <EmployeeSelector
                companyId={user.companyId}
                selectedEmployeeIds={bulkAssignEmployeeIds}
                onSelectionChange={setBulkAssignEmployeeIds}
                variant="default"
              />
            </div>
            <div className="p-4 border-t border-amber-500/20 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkAssignModalOpen(false)}
                className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
              >
                বাতিল
              </Button>
              <Button
                onClick={handleBulkAssignConfirm}
                disabled={bulkAssignEmployeeIds.length === 0 || bulkAssignMutation.isPending}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                {bulkAssignMutation.isPending ? 'অ্যাসাইন হচ্ছে...' : 'অ্যাসাইন করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {errorDialog && (
        <ErrorAlert error={errorDialog} onClose={() => setErrorDialog(null)} />
      )}

      {/* Custom Lead Modal */}
      {showCustomLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowCustomLeadModal(false); setCustomLeadError(null); }}
          />
          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/30 bg-slate-900 shadow-2xl shadow-violet-500/20">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-violet-500/20 bg-slate-900/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
                  <Plus className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-violet-200 font-semibold text-lg">নতুন কাস্টম লিড তৈরি করুন</h3>
                  <p className="text-slate-400 text-xs">ফর্ম পূরণ করে নতুন লিড যোগ করুন</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCustomLeadModal(false); setCustomLeadError(null); }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {customLeadSuccess && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">✅ লিড সফলভাবে তৈরি হয়েছে! মডাল বন্ধ হচ্ছে...</span>
                </div>
              )}
              {customLeadError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                  ❌ {customLeadError}
                </div>
              )}

              <form onSubmit={handleCustomLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-amber-200/90 text-xs mb-1 block">শিরোনাম (Title) <span className="text-red-400">*</span></Label>
                    <Input required placeholder="লিডের শিরোনাম লিখুন..." value={customForm.title} onChange={(e) => handleCustomFormChange('title', e.target.value)} className="bg-slate-800/60 border-violet-500/30 text-amber-100 placeholder-slate-500 focus-visible:ring-violet-500/50" />
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">কাস্টমার নাম (Customer Name)</Label>
                    <Input placeholder="কাস্টমারের নাম..." value={customForm.customerName} onChange={(e) => handleCustomFormChange('customerName', e.target.value)} className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-slate-500 focus-visible:ring-amber-500/50" />
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">ফোন নম্বর (Phone)</Label>
                    <Input type="tel" placeholder="01XXXXXXXXX" value={customForm.phone} onChange={(e) => handleCustomFormChange('phone', e.target.value)} className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-slate-500 focus-visible:ring-amber-500/50" />
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">ক্যাটাগরি (Category)</Label>
                    <select value={customForm.categoryId} onChange={(e) => handleCustomFormChange('categoryId', e.target.value)} className={selectClass}>
                      <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                      {(categories as any[]).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">ইন্টারেস্ট (Interest)</Label>
                    <select value={customForm.interestId} onChange={(e) => handleCustomFormChange('interestId', e.target.value)} className={selectClass}>
                      <option value="">ইন্টারেস্ট নির্বাচন করুন</option>
                      {(interests as any[]).map((int) => <option key={int.id} value={int.id}>{int.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">স্ট্যাটাস (Status)</Label>
                    <select value={customForm.statusId} onChange={(e) => handleCustomFormChange('statusId', e.target.value)} className={selectClass}>
                      <option value="">স্ট্যাটাস নির্বাচন করুন</option>
                      {(statuses as any[]).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">প্রায়োরিটি (Priority)</Label>
                    <select value={customForm.priorityId} onChange={(e) => handleCustomFormChange('priorityId', e.target.value)} className={selectClass}>
                      <option value="">প্রায়োরিটি নির্বাচন করুন</option>
                      {(priorities as any[]).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">ক্যাম্পেইন (Campaign) <span className="text-slate-500 text-xs">(ঐচ্ছিক)</span></Label>
                    <select value={customForm.campaignId} onChange={(e) => handleCustomFormChange('campaignId', e.target.value)} className={selectClass}>
                      <option value="">ক্যাম্পেইন নির্বাচন করুন</option>
                      {(campaigns as any[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-amber-200/90 text-xs mb-1 block">মূল্য (Value ৳) <span className="text-slate-500 text-xs">(ঐচ্ছিক)</span></Label>
                    <Input type="number" placeholder="যেমন: 5000" value={customForm.value} onChange={(e) => handleCustomFormChange('value', e.target.value)} min={0} className="bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-slate-500 focus-visible:ring-amber-500/50" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-amber-200/90 text-xs mb-1 block">বিবরণ (Description)</Label>
                    <textarea rows={3} placeholder="লিড সম্পর্কে বিস্তারিত লিখুন..." value={customForm.description} onChange={(e) => handleCustomFormChange('description', e.target.value)} className="w-full px-3 py-2 border border-amber-500/20 rounded-lg bg-slate-800/60 text-amber-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm resize-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-violet-500/20">
                  <Button type="button" variant="outline" onClick={() => { setCustomForm({ title: '', customerName: '', phone: '', description: '', categoryId: '', interestId: '', statusId: '', priorityId: '', campaignId: '', value: '' }); setCustomLeadError(null); }} className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent">
                    রিসেট করুন
                  </Button>
                  <Button type="submit" disabled={createLeadMutation.isPending} className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white border border-violet-400/50 shadow-lg shadow-violet-500/25 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {createLeadMutation.isPending ? 'তৈরি হচ্ছে...' : '+ লিড তৈরি করুন'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
