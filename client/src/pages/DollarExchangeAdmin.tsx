import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Package,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const exchangeAdminApi = {
  getRates: async () => (await axios.get(`${API}/api/exchange/admin/rates`, { withCredentials: true })).data,
  createRate: async (data: any) => (await axios.post(`${API}/api/exchange/admin/rates`, data, { withCredentials: true })).data,
  updateRate: async (id: number, data: any) => (await axios.put(`${API}/api/exchange/admin/rates/${id}`, data, { withCredentials: true })).data,
  deleteRate: async (id: number) => (await axios.delete(`${API}/api/exchange/admin/rates/${id}`, { withCredentials: true })).data,
  getOrders: async (status?: string) => (await axios.get(`${API}/api/exchange/admin/orders${status ? `?status=${status}` : ''}`, { withCredentials: true })).data,
  updateOrderStatus: async (id: number, status: string, adminNote?: string) => (await axios.patch(`${API}/api/exchange/admin/orders/${id}/status`, { status, adminNote }, { withCredentials: true })).data,
  getStats: async () => (await axios.get(`${API}/api/exchange/admin/stats`, { withCredentials: true })).data,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  PROCESSING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const emptyRate = { sendCurrency: '', receiveCurrency: '', rate: '', minAmount: '1', maxAmount: '99999', reserves: '0', note: '', isActive: true };

export default function DollarExchangeAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'rates' | 'orders' | 'stats'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [rateForm, setRateForm] = useState(emptyRate);
  const [showRateForm, setShowRateForm] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const { data: ratesData, isLoading: ratesLoading, refetch: refetchRates } = useQuery({
    queryKey: ['exchange-admin-rates'],
    queryFn: exchangeAdminApi.getRates,
    enabled: !!user,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['exchange-admin-orders', orderStatusFilter],
    queryFn: () => exchangeAdminApi.getOrders(orderStatusFilter || undefined),
    enabled: !!user,
  });

  const { data: statsData } = useQuery({
    queryKey: ['exchange-admin-stats'],
    queryFn: () => exchangeAdminApi.getStats(),
    enabled: !!user,
  });

  const createRateMutation = useMutation({
    mutationFn: (data: any) => exchangeAdminApi.createRate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exchange-admin-rates'] }); setShowRateForm(false); setRateForm(emptyRate); },
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => exchangeAdminApi.updateRate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exchange-admin-rates'] }); setEditingRate(null); setShowRateForm(false); setRateForm(emptyRate); },
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id: number) => exchangeAdminApi.deleteRate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exchange-admin-rates'] }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) => exchangeAdminApi.updateOrderStatus(id, status, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exchange-admin-orders'] }); qc.invalidateQueries({ queryKey: ['exchange-admin-stats'] }); },
  });

  const startEditRate = (rate: any) => {
    setEditingRate(rate);
    setRateForm({
      sendCurrency: rate.sendCurrency,
      receiveCurrency: rate.receiveCurrency,
      rate: String(rate.rate),
      minAmount: String(rate.minAmount),
      maxAmount: String(rate.maxAmount),
      reserves: String(rate.reserves),
      note: rate.note || '',
      isActive: rate.isActive,
    });
    setShowRateForm(true);
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...rateForm, rate: Number(rateForm.rate), minAmount: Number(rateForm.minAmount), maxAmount: Number(rateForm.maxAmount), reserves: Number(rateForm.reserves) };
    if (editingRate) { updateRateMutation.mutate({ id: editingRate.id, data: payload }); }
    else { createRateMutation.mutate(payload); }
  };

  const rates = ratesData?.data || [];
  const orders = ordersData?.data || [];
  const stats = statsData?.data;

  const inputCls = 'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder-amber-500/40';
  const thCls = 'text-left py-3 px-4 text-xs font-bold text-amber-500/80 uppercase tracking-wider';
  const tdCls = 'py-3 px-4 text-amber-100 text-sm';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <div>
          <h1 className="text-2xl font-bold text-amber-100 flex items-center gap-3">
            <ArrowLeftRight className="h-7 w-7 text-amber-400" />
            Dollar Buy / Sell Management
          </h1>
          <p className="text-amber-200/60 mt-0.5 text-sm">Manage exchange rates and process client orders</p>
        </div>
        <Button variant="outline" onClick={() => { refetchRates(); refetchOrders(); }} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-500/20 pb-1">
        {(['orders', 'rates', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/60 hover:text-amber-300'
            }`}
          >{tab === 'rates' ? 'Exchange Rates' : tab === 'orders' ? 'Client Orders' : 'Statistics'}</button>
        ))}
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-amber-100">Client Orders</h2>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="rounded-md border border-amber-500/20 bg-slate-800/60 px-3 py-2 text-sm text-amber-100"
              >
                <option value="">All Statuses</option>
                {['PENDING','PROCESSING','COMPLETED','REJECTED','CANCELLED'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {ordersLoading ? (
              <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-amber-500/10 rounded"/>)}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-amber-200/40">No orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-500/20">
                      <th className={thCls}>Order #</th>
                      <th className={thCls}>Client</th>
                      <th className={thCls}>Exchange</th>
                      <th className={thCls}>Amount</th>
                      <th className={thCls}>Rate</th>
                      <th className={thCls}>Receiver Acc.</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Date</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors">
                        <td className={`${tdCls} font-mono text-xs text-amber-400`}>{order.orderNumber}</td>
                        <td className={tdCls}>{order.client?.email || order.clientId}</td>
                        <td className={tdCls}>
                          <div className="text-xs">
                            <span className="text-amber-400">{order.sendCurrency}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="text-emerald-400">{order.receiveCurrency}</span>
                          </div>
                        </td>
                        <td className={tdCls}>
                          <div className="text-xs">
                            <div className="text-amber-200">Send: {Number(order.sendAmount).toLocaleString()}</div>
                            <div className="text-emerald-300">Recv: {Number(order.receiveAmount).toLocaleString()}</div>
                          </div>
                        </td>
                        <td className={`${tdCls} text-xs`}>{Number(order.appliedRate).toFixed(4)}</td>
                        <td className={`${tdCls} max-w-[140px] truncate text-xs`} title={order.receiverAccount}>{order.receiverAccount}</td>
                        <td className={tdCls}>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] || ''}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className={`${tdCls} text-xs text-slate-400`}>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className={tdCls}>
                          {order.status === 'PENDING' && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30"
                                onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'PROCESSING' })}>
                                <Clock className="w-3 h-3 mr-1"/>Process
                              </Button>
                              <Button size="sm" className="h-7 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30"
                                onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'REJECTED' })}>
                                <XCircle className="w-3 h-3"/>
                              </Button>
                            </div>
                          )}
                          {order.status === 'PROCESSING' && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30"
                                onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'COMPLETED' })}>
                                <CheckCircle className="w-3 h-3 mr-1"/>Done
                              </Button>
                              <Button size="sm" className="h-7 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30"
                                onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'REJECTED' })}>
                                <XCircle className="w-3 h-3"/>
                              </Button>
                            </div>
                          )}
                          {(order.status === 'COMPLETED' || order.status === 'REJECTED' || order.status === 'CANCELLED') && (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {/* RATES TAB */}
      {activeTab === 'rates' && (
        <GamePanel>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-amber-100">Exchange Rates</h2>
              <Button className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30"
                onClick={() => { setEditingRate(null); setRateForm(emptyRate); setShowRateForm(!showRateForm); }}>
                <Plus className="w-4 h-4 mr-2"/>Add Rate
              </Button>
            </div>

            {showRateForm && (
              <form onSubmit={handleRateSubmit} className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-slate-800/30 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-amber-200/80 text-xs mb-1 block">You Send (Currency/Method)</Label>
                  <Input placeholder="e.g. Binance USDT" value={rateForm.sendCurrency} onChange={e => setRateForm(f => ({...f, sendCurrency: e.target.value}))} className={inputCls} required/>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs mb-1 block">You Receive (Currency/Method)</Label>
                  <Input placeholder="e.g. bKash BDT" value={rateForm.receiveCurrency} onChange={e => setRateForm(f => ({...f, receiveCurrency: e.target.value}))} className={inputCls} required/>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs mb-1 block">Rate (1 Send = ? Receive)</Label>
                  <Input type="number" step="0.000001" placeholder="e.g. 117.50" value={rateForm.rate} onChange={e => setRateForm(f => ({...f, rate: e.target.value}))} className={inputCls} required/>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs mb-1 block">Min Amount</Label>
                  <Input type="number" value={rateForm.minAmount} onChange={e => setRateForm(f => ({...f, minAmount: e.target.value}))} className={inputCls}/>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs mb-1 block">Max Amount</Label>
                  <Input type="number" value={rateForm.maxAmount} onChange={e => setRateForm(f => ({...f, maxAmount: e.target.value}))} className={inputCls}/>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs mb-1 block">Reserves</Label>
                  <Input type="number" value={rateForm.reserves} onChange={e => setRateForm(f => ({...f, reserves: e.target.value}))} className={inputCls}/>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-amber-200/80 text-xs mb-1 block">Note (optional)</Label>
                  <Input placeholder="Any note for clients..." value={rateForm.note} onChange={e => setRateForm(f => ({...f, note: e.target.value}))} className={inputCls}/>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-amber-200/80 cursor-pointer">
                    <input type="checkbox" checked={rateForm.isActive} onChange={e => setRateForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-amber-500"/>
                    Active
                  </label>
                </div>
                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                    {editingRate ? 'Update Rate' : 'Create Rate'}
                  </Button>
                  <Button type="button" variant="outline" className="border-amber-500/30 text-amber-400" onClick={() => { setShowRateForm(false); setEditingRate(null); }}>Cancel</Button>
                </div>
              </form>
            )}

            {ratesLoading ? (
              <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-amber-500/10 rounded"/>)}</div>
            ) : rates.length === 0 ? (
              <div className="text-center py-10 text-amber-200/40">No rates configured yet. Add your first rate above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-500/20">
                      <th className={thCls}>You Send</th>
                      <th className={thCls}>You Receive</th>
                      <th className={thCls}>Rate</th>
                      <th className={thCls}>Range</th>
                      <th className={thCls}>Reserves</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate: any) => (
                      <tr key={rate.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                        <td className={`${tdCls} font-semibold text-amber-300`}>{rate.sendCurrency}</td>
                        <td className={`${tdCls} font-semibold text-emerald-300`}>{rate.receiveCurrency}</td>
                        <td className={`${tdCls} font-mono font-bold`}>{Number(rate.rate).toFixed(6)}</td>
                        <td className={`${tdCls} text-xs text-slate-400`}>{Number(rate.minAmount).toLocaleString()} – {Number(rate.maxAmount).toLocaleString()}</td>
                        <td className={tdCls}>{Number(rate.reserves).toLocaleString()}</td>
                        <td className={tdCls}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${rate.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                            {rate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className={tdCls}>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-amber-500/30 text-amber-400" onClick={() => startEditRate(rate)}>
                              <Edit3 className="w-3 h-3"/>
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              onClick={() => { if(confirm('Delete this rate?')) deleteRateMutation.mutate(rate.id); }}>
                              <Trash2 className="w-3 h-3"/>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, icon: Package, color: 'text-amber-300' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
            { label: 'Processing', value: stats.processing, icon: TrendingUp, color: 'text-blue-300' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-300' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-300' },
          ].map((stat, i) => (
            <GameCard key={i} index={i}>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-200/60 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-amber-100">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`}/>
              </div>
            </GameCard>
          ))}
        </div>
      )}
    </div>
  );
}
