import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftRight, ArrowRight, CheckCircle, Clock, XCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const exchangeClientApi = {
  getRates: async () => (await axios.get(`${API}/api/exchange/rates`, { withCredentials: true })).data,
  createOrder: async (data: any) => (await axios.post(`${API}/api/exchange/orders`, data, { withCredentials: true })).data,
  getMyOrders: async () => (await axios.get(`${API}/api/exchange/orders/my`, { withCredentials: true })).data,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  PROCESSING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  PENDING: <Clock className="w-3 h-3" />,
  PROCESSING: <RefreshCw className="w-3 h-3 animate-spin" />,
  COMPLETED: <CheckCircle className="w-3 h-3" />,
  REJECTED: <XCircle className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
};

export default function DollarExchangeClient() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'exchange' | 'orders'>('exchange');
  const [sendCurrency, setSendCurrency] = useState('');
  const [receiveCurrency, setReceiveCurrency] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates-client'],
    queryFn: exchangeClientApi.getRates,
    enabled: !!user,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['exchange-my-orders'],
    queryFn: exchangeClientApi.getMyOrders,
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: exchangeClientApi.createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-my-orders'] });
      setSubmitSuccess(true);
      setSendAmount(''); setSenderAccount(''); setReceiverAccount(''); setTransactionId('');
      setTimeout(() => { setSubmitSuccess(false); setActiveTab('orders'); }, 2500);
    },
    onError: (err: any) => setSubmitError(err?.response?.data?.message || 'Failed to submit order.'),
  });

  const rates: any[] = ratesData?.data || [];
  const orders: any[] = ordersData?.data || [];

  // Get unique send currencies
  const sendOptions = [...new Set(rates.map((r: any) => r.sendCurrency))];
  // Get receive options for selected send currency
  const receiveOptions = rates.filter((r: any) => r.sendCurrency === sendCurrency).map((r: any) => r.receiveCurrency);

  // Get active rate
  const activeRate = rates.find((r: any) => r.sendCurrency === sendCurrency && r.receiveCurrency === receiveCurrency);
  const receiveAmount = activeRate && sendAmount ? (Number(sendAmount) * Number(activeRate.rate)).toFixed(2) : '';

  useEffect(() => { setReceiveCurrency(''); }, [sendCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!sendCurrency || !receiveCurrency || !sendAmount || !senderAccount || !receiverAccount) {
      setSubmitError('Please fill all required fields.'); return;
    }
    if (activeRate && Number(sendAmount) < Number(activeRate.minAmount)) {
      setSubmitError(`Minimum amount is ${activeRate.minAmount}`); return;
    }
    if (activeRate && Number(sendAmount) > Number(activeRate.maxAmount)) {
      setSubmitError(`Maximum amount is ${activeRate.maxAmount}`); return;
    }
    createOrderMutation.mutate({ sendCurrency, receiveCurrency, sendAmount: Number(sendAmount), senderAccount, receiverAccount, transactionId });
  };

  const inputCls = 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-400/50 transition-colors';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 p-8"
          style={{ background: 'linear-gradient(135deg, #0a0f2c 0%, #0c1a3e 50%, #0a0f2c 100%)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_60%)] pointer-events-none"/>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/20 border border-blue-500/30">
              <ArrowLeftRight className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dollar Exchange</h1>
              <p className="text-blue-200/60 text-sm mt-0.5">Fast & secure currency exchange</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/5 w-fit">
          {(['exchange', 'orders'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-blue-500/30 text-blue-300 shadow-sm border border-blue-500/30' : 'text-white/50 hover:text-white/80'
              }`}>
              {tab === 'exchange' ? '🔄 Exchange' : `📋 My Orders (${orders.length})`}
            </button>
          ))}
        </div>

        {/* EXCHANGE TAB */}
        {activeTab === 'exchange' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rate Table */}
            <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Live Rates</h2>
              {ratesLoading ? (
                <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded"/>)}</div>
              ) : rates.length === 0 ? (
                <div className="text-center py-6 text-white/30 text-sm">No active rates available</div>
              ) : (
                <div className="space-y-2">
                  {rates.map((rate: any) => (
                    <div key={rate.id}
                      onClick={() => { setSendCurrency(rate.sendCurrency); setReceiveCurrency(rate.receiveCurrency); }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                        sendCurrency === rate.sendCurrency && receiveCurrency === rate.receiveCurrency
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70'
                      }`}>
                      <div className="text-xs">
                        <span className="font-semibold">{rate.sendCurrency}</span>
                        <span className="mx-1.5 text-white/30">→</span>
                        <span className="font-semibold">{rate.receiveCurrency}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold">{Number(rate.rate).toFixed(2)}</div>
                        {rate.note && <div className="text-xs text-white/30">{rate.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Form */}
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
              <h2 className="text-white font-bold text-lg">Place Order</h2>

              {submitSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle className="w-5 h-5 flex-shrink-0"/>
                  <span className="text-sm font-medium">Order submitted successfully! Redirecting to your orders...</span>
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300">
                  <XCircle className="w-5 h-5 flex-shrink-0"/>
                  <span className="text-sm">{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">You Send</Label>
                    <select value={sendCurrency} onChange={e => setSendCurrency(e.target.value)} required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400/50 focus:outline-none">
                      <option value="" className="bg-slate-900">Select currency...</option>
                      {sendOptions.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">You Receive</Label>
                    <select value={receiveCurrency} onChange={e => setReceiveCurrency(e.target.value)} required disabled={!sendCurrency}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400/50 focus:outline-none disabled:opacity-40">
                      <option value="" className="bg-slate-900">Select currency...</option>
                      {receiveOptions.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                    </select>
                  </div>
                </div>

                {activeRate && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                    <ArrowLeftRight className="w-4 h-4"/>
                    <span>Rate: <strong>1 {sendCurrency} = {Number(activeRate.rate).toFixed(4)} {receiveCurrency}</strong></span>
                    <span className="ml-auto text-xs text-white/30">Range: {Number(activeRate.minAmount).toLocaleString()} – {Number(activeRate.maxAmount).toLocaleString()}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">Send Amount</Label>
                    <Input type="number" step="any" min="0" value={sendAmount} onChange={e => setSendAmount(e.target.value)}
                      placeholder={activeRate ? `${Number(activeRate.minAmount)} – ${Number(activeRate.maxAmount)}` : 'Enter amount'}
                      className={inputCls} required/>
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">You Will Receive</Label>
                    <Input value={receiveAmount ? `${receiveAmount}` : ''} readOnly placeholder="Calculated automatically"
                      className="bg-white/5 border-white/10 text-emerald-300 font-bold cursor-not-allowed"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">Your Sending Account</Label>
                    <Input value={senderAccount} onChange={e => setSenderAccount(e.target.value)}
                      placeholder={sendCurrency ? `Your ${sendCurrency} account/address` : 'e.g. 01XXXXXXXXX'}
                      className={inputCls} required/>
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">Receiving Account</Label>
                    <Input value={receiverAccount} onChange={e => setReceiverAccount(e.target.value)}
                      placeholder={receiveCurrency ? `Your ${receiveCurrency} account/address` : 'e.g. 01XXXXXXXXX'}
                      className={inputCls} required/>
                  </div>
                </div>

                <div>
                  <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">Transaction ID / Payment Proof (optional)</Label>
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                    placeholder="Paste your TxID or payment reference here"
                    className={inputCls}/>
                </div>

                <Button type="submit" disabled={createOrderMutation.isPending || !sendCurrency || !receiveCurrency}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base rounded-xl transition-all disabled:opacity-50">
                  {createOrderMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin"/>Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2"/>Submit Exchange Order</>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* MY ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-bold">My Exchange Orders</h2>
              <Button variant="outline" size="sm" onClick={() => refetchOrders()}
                className="border-white/20 text-white/60 hover:text-white hover:bg-white/10 h-8">
                <RefreshCw className="w-3 h-3 mr-1"/>Refresh
              </Button>
            </div>

            {ordersLoading ? (
              <div className="p-6 animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl"/>)}</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-white/30">
                <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30"/>
                <p>No orders yet. Place your first exchange order!</p>
                <Button className="mt-4 bg-blue-500/20 text-blue-300 border border-blue-500/30" onClick={() => setActiveTab('exchange')}>
                  Start Exchange
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {orders.map((order: any) => (
                  <div key={order.id} className="p-5 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-mono text-xs text-blue-400">{order.orderNumber}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status]}`}>
                            {STATUS_ICONS[order.status]}{order.status}
                          </span>
                          <span className="text-xs text-white/30">{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <span className="text-amber-300">{Number(order.sendAmount).toLocaleString()} {order.sendCurrency}</span>
                          <ArrowRight className="w-4 h-4 text-white/30"/>
                          <span className="text-emerald-300">{Number(order.receiveAmount).toLocaleString()} {order.receiveCurrency}</span>
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          Rate: {Number(order.appliedRate).toFixed(4)} · Receiver: {order.receiverAccount}
                          {order.transactionId && ` · TxID: ${order.transactionId}`}
                        </div>
                        {order.adminNote && (
                          <div className="mt-2 text-xs text-amber-300/70 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                            <strong>Admin Note:</strong> {order.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
