import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftRight, ArrowRight, CheckCircle, Clock, XCircle, RefreshCw, Send, Copy, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/apiClient';
import { getImageUrl } from '@/lib/imageUtils';

const exchangeClientApi = {
  getRates: async () => (await apiClient.get('/exchange/rates')).data,
  createOrder: async (data: FormData) => (await apiClient.post('/exchange/orders', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })).data,
  getMyOrders: async () => (await apiClient.get('/exchange/orders/my')).data,
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
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'exchange' | 'orders'>('exchange');
  const [sendCurrency, setSendCurrency] = useState('');
  const [receiveCurrency, setReceiveCurrency] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

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
    mutationFn: (data: FormData) => exchangeClientApi.createOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-my-orders'] });
      setSubmitSuccess(true);
      setSendAmount(''); setReceiverAccount(''); setTransactionId(''); setProofImage(null);
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
    if (!sendCurrency || !receiveCurrency || !sendAmount || !receiverAccount || !transactionId) {
      setSubmitError('Please fill all required fields including Transaction ID.'); return;
    }
    if (activeRate && Number(sendAmount) < Number(activeRate.minAmount)) {
      setSubmitError(`Minimum amount is ${activeRate.minAmount}`); return;
    }
    if (activeRate && Number(sendAmount) > Number(activeRate.maxAmount)) {
      setSubmitError(`Maximum amount is ${activeRate.maxAmount}`); return;
    }

    const formData = new FormData();
    formData.append('sendCurrency', sendCurrency);
    formData.append('receiveCurrency', receiveCurrency);
    formData.append('sendAmount', sendAmount);
    formData.append('receiverAccount', receiverAccount);
    formData.append('transactionId', transactionId);
    if (proofImage) {
      formData.append('proofImage', proofImage);
    }

    createOrderMutation.mutate(formData);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-400/50 transition-colors';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-blue-500/20 p-8 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)]"
          style={{ background: 'linear-gradient(135deg, #0a0f2c 0%, #0c1a3e 50%, #0a0f2c 100%)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_60%)] pointer-events-none"/>
          
          {/* Ambient SVG Animation */}
          <svg className="absolute top-0 right-0 w-64 h-64 text-blue-500/5 pointer-events-none" viewBox="0 0 100 100">
            <motion.circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" fill="none"
              animate={{ r: [35, 45, 35], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>

          <div className="relative z-10 flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
              <ArrowLeftRight className="w-7 h-7 text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Dollar Exchange</h1>
              <div className="flex items-center gap-2">
                <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                />
                <p className="text-blue-200/60 text-sm mt-0.5 font-medium leading-none">Fast & secure currency engine</p>
              </div>
            </div>
          </div>
        </motion.div>

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
            <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <h2 className="text-xs font-bold text-blue-300 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <span className="w-1 h-3 bg-blue-500 rounded-full"/>
                Live Exchange Rates
              </h2>
              {ratesLoading ? (
                <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl"/>)}</div>
              ) : rates.length === 0 ? (
                <div className="text-center py-10 text-white/20 text-sm border border-dashed border-white/10 rounded-2xl">No active protocols</div>
              ) : (
                <div className="space-y-3">
                  {rates.map((rate: any) => (
                    <motion.div key={rate.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSendCurrency(rate.sendCurrency); setReceiveCurrency(rate.receiveCurrency); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border group relative overflow-hidden ${
                        sendCurrency === rate.sendCurrency && receiveCurrency === rate.receiveCurrency
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-100 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70'
                      }`}>
                      {sendCurrency === rate.sendCurrency && receiveCurrency === rate.receiveCurrency && (
                        <motion.div 
                          layoutId="active-bg"
                          className="absolute inset-0 bg-blue-500/5 z-0"
                          initial={false}
                        />
                      )}
                      <div className="text-xs relative z-10">
                        <span className="font-bold tracking-tight text-sm">{rate.sendCurrency}</span>
                        <span className="mx-2 text-white/20">→</span>
                        <span className="font-bold tracking-tight text-sm">{rate.receiveCurrency}</span>
                      </div>
                      <div className="text-right relative z-10">
                        <div className="text-sm font-black text-blue-400 group-hover:text-blue-300 transition-colors">
                          {Number(rate.rate).toFixed(2)}
                        </div>
                        {rate.note && <div className="text-[10px] text-white/30 uppercase tracking-tighter mt-0.5">{rate.note}</div>}
                      </div>
                    </motion.div>
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
                  {activeRate?.adminReceiveAccount && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 relative overflow-hidden group shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
                    >
                      {/* Scanning Line Animation */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent z-0"
                      />

                      <Label className="text-blue-300 text-[10px] mb-2 block uppercase tracking-[0.2em] font-bold">Instruction: Send {sendCurrency} To</Label>
                      <div className="flex items-center justify-between gap-3 relative z-10">
                        <div className="text-xl font-mono font-black text-white selection:bg-blue-500/30 tracking-tight">
                          {activeRate.adminReceiveAccount}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(activeRate.adminReceiveAccount)}
                          className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 hover:bg-blue-500/30 hover:text-white transition-all shadow-lg"
                        >
                          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                        </motion.button>
                      </div>

                      {activeRate.adminReceiveQrCode && (
                        <div className="mt-4 flex flex-col items-center p-3 bg-blue-900/40 rounded-xl border border-blue-500/20">
                          <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mb-2">Scan to Pay</p>
                          <img 
                            src={getImageUrl(activeRate.adminReceiveQrCode)} 
                            alt="Payment QR Code" 
                            onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                            className="w-32 h-32 object-cover rounded-lg border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                          />
                        </div>
                      )}
                      
                      
                      {/* Success Badge */}
                      <AnimatePresence>
                        {copied && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-2 left-5 text-[9px] text-emerald-400 font-bold uppercase tracking-widest"
                          >
                            Copied to clipboard
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                  <div className={activeRate?.adminReceiveAccount ? "" : "md:col-span-2"}>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider font-semibold">Your Receiving Account</Label>
                    <Input value={receiverAccount} onChange={e => setReceiverAccount(e.target.value)}
                      placeholder={receiveCurrency ? `Where should we send your ${receiveCurrency}?` : 'e.g. 01XXXXXXXXX'}
                      className={`${inputCls} h-14 text-base px-5 font-medium`} required/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider font-semibold text-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">Transaction ID / Payment Reference</Label>
                    <Input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                      placeholder="Paste your TxID here"
                      className={`${inputCls} border-amber-500/30 focus:border-amber-400`} required/>
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs mb-2 block uppercase tracking-wider font-semibold text-blue-400">Payment Proof (Image)</Label>
                    <div className="relative group/file">
                      <Input type="file" accept="image/*" onChange={e => setProofImage(e.target.files?.[0] || null)}
                        className={`${inputCls} border-blue-500/20 hover:border-blue-500/40 cursor-pointer pt-2 group-hover/file:bg-white/10`} />
                      {proofImage && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] text-emerald-400 font-bold uppercase truncate max-w-[80px]">{proofImage.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button type="submit" disabled={createOrderMutation.isPending || !sendCurrency || !receiveCurrency}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] border border-blue-400/20">
                    {createOrderMutation.isPending ? (
                      <><RefreshCw className="w-5 h-5 mr-2 animate-spin"/>Processing...</>
                    ) : (
                      <><Send className="w-5 h-5 mr-2 drop-shadow-lg"/>Submit Exchange Protocol</>
                    )}
                  </Button>
                </motion.div>
              </form>
            </div>
          </div>
        )}

        {/* MY ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-bold">My Exchange Orders</h2>
              <Button variant="ghost" size="sm" onClick={() => refetchOrders()}
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
                  <div key={order.id} 
                       className="p-5 hover:bg-white/5 transition-colors cursor-pointer"
                       onClick={() => navigate(`/client/exchange/order/${order.id}`)}
                  >
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
                      <div className="flex flex-col items-end gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/client/exchange/order/${order.id}`); }}
                          className="text-white/40 hover:text-blue-400 hover:bg-blue-500/10 h-10 px-4 rounded-xl border border-transparent hover:border-blue-400/30">
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </Button>
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
