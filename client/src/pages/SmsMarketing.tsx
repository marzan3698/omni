import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { leadApi, leadCategoryApi, leadInterestApi, leadPriorityApi, leadLabelApi, leadStatusConfigApi, campaignApi, smsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Filter, X, Send, Megaphone, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorAlert } from '@/components/ErrorAlert';

type LeadListView = 'all' | 'complete';

const defaultFilters = {
    search: '',
    statusId: '',
    priorityId: '',
    labelIds: '' as string,
    categoryId: '',
    interestId: '',
    campaignId: '',
    dateFrom: '',
    dateTo: '',
};

export default function SmsMarketing() {
    const { user } = useAuth();
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(defaultFilters);
    const [leadListView, setLeadListView] = useState<LeadListView>('all');
    const [activeTab, setActiveTab] = useState<'Inbox' | 'Website' | 'FacebookPixel' | 'Excel' | 'Custom'>('Inbox');

    const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
    const [smsMessage, setSmsMessage] = useState('');
    const [errorDialog, setErrorDialog] = useState<string | null>(null);

    const { data: leadsResponse, isLoading } = useQuery({
        queryKey: ['sms-leads', leadListView, activeTab, filters],
        queryFn: async () => {
            const params: any = {};
            params.convertedOnly = leadListView === 'complete' ? 'true' : 'false';
            params.source = activeTab;
            if (filters.search) params.search = filters.search;
            if (filters.statusId) params.statusId = parseInt(filters.statusId);
            if (filters.priorityId) params.priorityId = parseInt(filters.priorityId);
            if (filters.labelIds) params.labelIds = [parseInt(filters.labelIds)].filter((n) => !isNaN(n) && n > 0);
            if (filters.categoryId) params.categoryId = parseInt(filters.categoryId);
            if (filters.interestId) params.interestId = parseInt(filters.interestId);
            if (filters.campaignId) params.campaignId = parseInt(filters.campaignId);
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;

            const response = await leadApi.getAll(params);
            return response.data.data || [];
        },
    });

    const leads = leadsResponse || [];

    const { data: categories = [] } = useQuery({ queryKey: ['lead-categories'], queryFn: async () => (await leadCategoryApi.getAll()).data.data || [] });
    const { data: interests = [] } = useQuery({ queryKey: ['lead-interests'], queryFn: async () => (await leadInterestApi.getAll()).data.data || [] });
    const { data: priorities = [] } = useQuery({ queryKey: ['lead-priorities'], queryFn: async () => (await leadPriorityApi.getAll()).data.data || [] });
    const { data: statuses = [] } = useQuery({ queryKey: ['lead-statuses'], queryFn: async () => (await leadStatusConfigApi.getAll()).data.data || [] });
    const { data: campaigns = [] } = useQuery({
        queryKey: ['campaigns-for-filter', user?.companyId],
        queryFn: async () => {
            if (!user?.companyId) return [];
            return (await campaignApi.getAll(user.companyId)).data.data || [];
        },
        enabled: !!user?.companyId,
    });

    const sendSmsMutation = useMutation({
        mutationFn: async () => {
            if (selectedPhones.size === 0) throw new Error('No valid numbers selected');
            if (!smsMessage.trim()) throw new Error('Message cannot be empty');

            const payload = {
                phones: Array.from(selectedPhones),
                message: smsMessage
            };

            const { data } = await smsApi.sendBulkSms(payload);
            return data;
        },
        onSuccess: (data) => {
            alert(`Successfully dispatched bulk SMS! Valid processed numbers: ${data.data?.count}`);
            setSelectedPhones(new Set());
            setSmsMessage('');
        },
        onError: (err: any) => setErrorDialog(err.response?.data?.message || err.message)
    });

    // Toggle selection
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const validPhones = leads.filter((l: any) => l.phone).map((l: any) => l.phone as string);
            setSelectedPhones(new Set(validPhones));
        } else {
            setSelectedPhones(new Set());
        }
    };

    const togglePhone = (phone: string, checked: boolean) => {
        const next = new Set(selectedPhones);
        if (checked) next.add(phone);
        else next.delete(phone);
        setSelectedPhones(next);
    };

    const resetFilters = () => setFilters(defaultFilters);

    return (
        <div className="p-4 sm:p-6 pb-24 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-indigo-500" />
                        SMS Marketing
                    </h1>
                    <p className="text-slate-500 mt-1">Filter leads and send bulk SMS text messages.</p>
                </div>
            </div>

            {errorDialog && (
                <ErrorAlert error={new Error(errorDialog)} onClose={() => setErrorDialog(null)} />
            )}

            {/* TABS FOR SOURCE */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-2 min-w-max p-1 bg-slate-100 rounded-lg">
                    {(['Inbox', 'Website', 'FacebookPixel', 'Excel', 'Custom'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSelectedPhones(new Set()); }}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                                activeTab === tab
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            {tab === 'FacebookPixel' ? 'Meta/FB Pixel' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* FILTER BUTTON & VIEW */}
            <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex gap-2">
                    <button
                        onClick={() => setLeadListView('all')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200", leadListView === 'all' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                    >
                        All Filtered Leads ({leads.length})
                    </button>
                </div>

                <div className="flex gap-2 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search leads..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-9 w-[200px]"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(showFilters ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "")}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Advanced Filters
                    </Button>
                </div>
            </div>

            {/* ADVANCED FILTER PANEL */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase">Status</Label>
                        <select
                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50"
                            value={filters.statusId}
                            onChange={(e) => setFilters({ ...filters, statusId: e.target.value })}
                        >
                            <option value="">All Statuses</option>
                            {statuses.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase">Category</Label>
                        <select
                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50"
                            value={filters.categoryId}
                            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                        >
                            <option value="">All Categories</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase">Interest Level</Label>
                        <select
                            className="w-full text-sm border-slate-200 rounded-lg p-2.5 bg-slate-50"
                            value={filters.interestId}
                            onChange={(e) => setFilters({ ...filters, interestId: e.target.value })}
                        >
                            <option value="">All Levels</option>
                            {interests.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase">Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="text-sm bg-slate-50"
                            />
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="text-sm bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="col-span-full flex justify-end">
                        <Button variant="ghost" onClick={resetFilters} className="text-slate-500 hover:text-slate-900">
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                </div>
            )}

            {/* SMS COMPOSER */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-lg text-indigo-900 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Compose Bulk SMS
                </h3>
                <p className="text-sm text-indigo-700 mb-4">
                    Write an SMS to be sent to all selected numbers below. Notice that messages exceeding 160 characters scale automatically into multipart messages.
                </p>
                <Textarea
                    placeholder="Dear customer, we have a special offer for you..."
                    className="bg-white"
                    rows={3}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                />
                <div className="mt-4 flex justify-between items-center bg-white rounded-lg p-4 border border-indigo-100">
                    <div>
                        <span className="text-sm font-semibold block">Recipients</span>
                        <span className="text-indigo-600 font-bold">{selectedPhones.size} contact(s) selected</span>
                    </div>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="lg"
                        disabled={sendSmsMutation.isPending || selectedPhones.size === 0 || !smsMessage.trim()}
                        onClick={() => sendSmsMutation.mutate()}
                    >
                        {sendSmsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Bulk Blast
                    </Button>
                </div>
            </div>

            {/* LEADS DATA TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading leads...</div>
                ) : leads.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No Leads Found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            No leads match your current filter criteria. Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4" style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                            onChange={handleSelectAll}
                                            checked={
                                                leads.every((l: any) => l.phone && selectedPhones.has(l.phone)) &&
                                                leads.length > 0 && Array.from(selectedPhones).length > 0
                                            }
                                        />
                                    </th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">Name</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">Source</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">Status</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm whitespace-nowrap">Number</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map((lead: any) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            {lead.phone ? (
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={selectedPhones.has(lead.phone)}
                                                    onChange={(e) => togglePhone(lead.phone as string, e.target.checked)}
                                                />
                                            ) : (
                                                <span className="text-xs text-slate-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900">{lead.title || lead.customerName || 'No Name'}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {lead.source}
                                        </td>
                                        <td className="p-4">
                                            {lead.status && (
                                                <span
                                                    className="px-2.5 py-1 text-xs font-semibold rounded-full"
                                                    style={{
                                                        backgroundColor: `${lead.status.color}15`,
                                                        color: lead.status.color,
                                                        border: `1px solid ${lead.status.color}30`
                                                    }}
                                                >
                                                    {lead.status.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-medium">
                                            {lead.phone ? (
                                                <a href={`tel:${lead.phone}`} className="text-indigo-600 hover:text-indigo-800">
                                                    {lead.phone}
                                                </a>
                                            ) : (
                                                <span className="text-red-400">No Number</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
