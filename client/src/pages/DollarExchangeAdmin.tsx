import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const exchangeAdminApi = {
  getRates: async () => (await apiClient.get('/exchange/admin/rates')).data,
  createRate: async (data: any) => (await apiClient.post('/exchange/admin/rates', data)).data,
  updateRate: async (id: number, data: any) => (await apiClient.put(`/exchange/admin/rates/${id}`, data)).data,
  deleteRate: async (id: number) => (await apiClient.delete(`/exchange/admin/rates/${id}`)).data,
  getOrders: async (status?: string) => (await apiClient.get(`/exchange/admin/orders${status ? `?status=${status}` : ''}`)).data,
  updateOrderStatus: async (id: number, status: string, adminNote?: string) => (await apiClient.patch(`/exchange/admin/orders/${id}/status`, { status, adminNote })).data,
  getStats: async () => (await apiClient.get('/exchange/admin/stats')).data,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  PROCESSING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const emptyRate = { sendCurrency: '', receiveCurrency: '', rate: '', minAmount: '1', maxAmount: '99999', reserves: '0', adminReceiveAccount: '', note: '', isActive: true };

export default function DollarExchangeAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      adminReceiveAccount: rate.adminReceiveAccount || '',
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between p-6 rounded-2xl border border-amber-500/20 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"/>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-4 tracking-tighter">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <ArrowLeftRight className="h-9 w-9 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </motion.div>
            Dollar Exchange Protocol
          </h1>
          <p className="text-amber-200/40 mt-1 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse"/>
            Core Liquidity & Order Processing Engine
          </p>
        </div>
        <div className="flex gap-2 relative z-10">
          <motion.div whileHover={{ rotate: 180 }} transition={{ type: "spring", stiffness: 200 }}>
            <Button variant="outline" onClick={() => { refetchRates(); refetchOrders(); }} className="h-12 w-12 rounded-xl border-amber-500/20 bg-slate-800/40 text-amber-400 hover:bg-amber-500/10 backdrop-blur-md">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl border border-amber-500/10 bg-slate-900/40 w-fit backdrop-blur-sm">
        {(['orders', 'rates', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all relative ${
              activeTab === tab ? 'text-amber-400' : 'text-amber-200/40 hover:text-amber-200/80'
            }`}
          >
            {activeTab === tab && (
              <motion.div 
                layoutId="admin-tab-bg"
                className="absolute inset-0 bg-amber-500/10 border border-amber-500/30 rounded-xl z-0 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]"
              />
            )}
            <span className="relative z-10">
              {tab === 'rates' ? 'Exchange Rates' : tab === 'orders' ? 'Orders Feed' : 'Network Stats'}
            </span>
          </button>
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
              <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-amber-500/5 rounded-2xl"/>)}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 text-amber-200/20 border border-dashed border-amber-500/10 rounded-2xl">No orders detected in the protocol</div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-500/10">
                      <th className={thCls}>Sequence</th>
                      <th className={thCls}>Entity</th>
                      <th className={thCls}>Route</th>
                      <th className={thCls}>Payload</th>
                      <th className={thCls}>Applied Rate</th>
                      <th className={thCls}>Destination</th>
                      <th className={thCls}>Protocol Status</th>
                      <th className={thCls}>Timestamp</th>
                      <th className={thCls}>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode='popLayout'>
                      {orders.map((order: any) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={order.id} 
                          className="border-b border-amber-500/5 hover:bg-amber-500/5 transition-colors group"
                        >
                          <td className={`${tdCls} font-mono text-xs text-amber-500/80 group-hover:text-amber-400 transition-colors`}>{order.orderNumber}</td>
                          <td className={tdCls}>
                            <div className="text-xs font-bold text-white/80">{order.client?.email || order.clientId}</div>
                          </td>
                          <td className={tdCls}>
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-900 border border-amber-500/10 text-[10px] uppercase font-black tracking-widest leading-none">
                              <span className="text-amber-500">{order.sendCurrency}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-white/20"/>
                              <span className="text-emerald-500">{order.receiveCurrency}</span>
                            </div>
                          </td>
                          <td className={tdCls}>
                            <div className="text-xs space-y-0.5">
                              <div className="text-amber-200/70">S: <span className="font-bold text-white">{Number(order.sendAmount).toLocaleString()}</span></div>
                              <div className="text-emerald-400/70">R: <span className="font-bold text-white">{Number(order.receiveAmount).toLocaleString()}</span></div>
                            </div>
                          </td>
                          <td className={`${tdCls} font-mono text-xs font-bold text-amber-400/80 group-hover:text-amber-300 transition-colors`}>{Number(order.appliedRate).toFixed(4)}</td>
                          <td className={`${tdCls} text-xs font-mono text-white/60 group-hover:text-white/90 transition-colors`} title={order.receiverAccount}>
                             <div className="max-w-[120px] truncate">{order.receiverAccount}</div>
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[order.status] || ''} shadow-[0_0_10px_rgba(245,158,11,0.05)]`}>
                              {order.status}
                            </span>
                          </td>
                          <td className={`${tdCls} text-[10px] text-white/30 uppercase font-bold tracking-wider`}>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className={tdCls}>
                            <div className="flex gap-2">
                              {order.status === 'PENDING' && (
                                <>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button size="icon" className="h-8 w-8 bg-blue-500/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 shadow-lg shadow-blue-500/10"
                                      onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'PROCESSING' })}>
                                      <Clock className="w-4 h-4"/>
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20"
                                      onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'REJECTED' })}>
                                      <XCircle className="w-4 h-4"/>
                                    </Button>
                                  </motion.div>
                                </>
                              )}
                              {order.status === 'PROCESSING' && (
                                <>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button size="icon" className="h-8 w-8 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                                      onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'COMPLETED' })}>
                                      <CheckCircle className="w-4 h-4"/>
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button size="icon" className="h-8 w-8 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20"
                                      onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'REJECTED' })}>
                                      <XCircle className="w-4 h-4"/>
                                    </Button>
                                  </motion.div>
                                </>
                              )}
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="icon" className="h-8 w-8 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black border border-amber-500/20 shadow-lg shadow-amber-500/5"
                                  onClick={() => navigate(`/dollar-exchange/order/${order.id}`)}>
                                  <Eye className="w-4 h-4"/>
                                </Button>
                              </motion.div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
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
                  <Label className="text-amber-200/80 text-xs mb-1 block">Your Receiving Account (For Customers)</Label>
                  <Input placeholder="e.g. 017XXXXXXX (Personal)" value={rateForm.adminReceiveAccount} onChange={e => setRateForm(f => ({...f, adminReceiveAccount: e.target.value}))} className={inputCls}/>
                </div>
                <div className="md:col-span-3 flex gap-4 items-end">
                  <div className="flex-1">
                    <Label className="text-amber-200/80 text-xs mb-1 block">Note (optional)</Label>
                    <Input placeholder="Any note for clients..." value={rateForm.note} onChange={e => setRateForm(f => ({...f, note: e.target.value}))} className={inputCls}/>
                  </div>
                  <label className="flex items-center gap-2 mb-3 text-sm text-amber-200/80 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={rateForm.isActive} onChange={e => setRateForm(f => ({...f, isActive: e.target.checked}))} className="w-5 h-5 accent-amber-500 rounded focus:ring-amber-500/30"/>
                    <span className="font-bold">Is Active</span>
                  </label>
                </div>
                <div className="md:col-span-3 flex gap-2 pt-2 border-t border-amber-500/20">
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                    {editingRate ? 'Update Rate' : 'Create Rate'}
                  </Button>
                  <Button type="button" variant="outline" className="border-amber-500/30 text-amber-400" onClick={() => { setShowRateForm(false); setEditingRate(null); }}>Cancel</Button>
                </div>
              </form>
            )}

            {ratesLoading ? (
              <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-amber-500/5 rounded-2xl"/>)}</div>
            ) : rates.length === 0 ? (
              <div className="text-center py-20 text-amber-200/20 border border-dashed border-amber-500/10 rounded-2xl">No active liquidity routes configured</div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-amber-500/10">
                      <th className={thCls}>Source</th>
                      <th className={thCls}>Target</th>
                      <th className={thCls}>Unit Rate</th>
                      <th className={thCls}>Volume Range</th>
                      <th className={thCls}>Reserves</th>
                      <th className={thCls}>Entry Point</th>
                      <th className={thCls}>State</th>
                      <th className={thCls}>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode='popLayout'>
                      {rates.map((rate: any, i: number) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={rate.id} 
                          className="border-b border-amber-500/5 hover:bg-amber-500/5 group"
                        >
                          <td className={`${tdCls} font-black text-amber-400/90 tracking-tight`}>{rate.sendCurrency}</td>
                          <td className={`${tdCls} font-black text-emerald-400/90 tracking-tight`}>{rate.receiveCurrency}</td>
                          <td className={`${tdCls} font-mono font-black text-white/90`}>{Number(rate.rate).toFixed(6)}</td>
                          <td className={`${tdCls} text-xs text-white/40 font-medium`}>{Number(rate.minAmount).toLocaleString()} – {Number(rate.maxAmount).toLocaleString()}</td>
                          <td className={`${tdCls} font-bold text-blue-400`}>{Number(rate.reserves).toLocaleString()}</td>
                          <td className={`${tdCls} text-xs font-mono text-white/50 group-hover:text-amber-200/80 transition-colors`} title={rate.adminReceiveAccount}>
                            <div className="max-w-[120px] truncate">{rate.adminReceiveAccount || '—'}</div>
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-widest ${rate.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              {rate.isActive ? 'ACTIVE' : 'OFFLINE'}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <div className="flex gap-2">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="icon" variant="outline" className="h-8 w-8 p-0 border-amber-500/20 bg-slate-900/40 text-amber-400 hover:bg-amber-500 hover:text-white" onClick={() => startEditRate(rate)}>
                                  <Edit3 className="w-4 h-4"/>
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="icon" variant="outline" className="h-8 w-8 p-0 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white"
                                  onClick={() => { if(confirm('Purge this record?')) deleteRateMutation.mutate(rate.id); }}>
                                  <Trash2 className="w-4 h-4"/>
                                </Button>
                              </motion.div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GamePanel>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { label: 'Network Throughput', value: stats.total, icon: Package, color: 'text-amber-300', blur: 'bg-amber-500/10' },
            { label: 'Protocols Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', blur: 'bg-amber-500/10' },
            { label: 'Active Processing', value: stats.processing, icon: TrendingUp, color: 'text-blue-400', blur: 'bg-blue-500/10' },
            { label: 'Valid Executions', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400', blur: 'bg-emerald-500/10' },
            { label: 'Failed Handshakes', value: stats.rejected, icon: XCircle, color: 'text-red-400', blur: 'bg-red-500/10' },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
            >
              <GameCard index={i}>
                <div className={`p-6 relative overflow-hidden group h-full ${stat.blur} backdrop-blur-md border border-white/5 hover:border-white/10 transition-all`}>
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <stat.icon className="w-20 h-20 rotate-12"/>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                      <stat.icon className={`w-6 h-6 ${stat.color} drop-shadow-[0_0_8px_currentColor]`}/>
                    </div>
                  </div>
                  {/* Bottom neon line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.color} opacity-20 shadow-[0_0_10px_currentColor]`}/>
                </div>
              </GameCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
