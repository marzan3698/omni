import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  AlertCircle, 
  XCircle,
  Hash,
  User,
  Mail,
  Phone,
  Calendar,
  Zap,
  Shield,
  CreditCard,
  Share2,
  ArrowRight, 
  Eye
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUtils';

const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
    PROCESSING: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Zap },
    COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
    CANCELLED: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: AlertCircle },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border} text-xs font-black tracking-widest uppercase`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </div>
  );
};

const DetailRow = ({ label, value, icon: Icon, color = 'text-white/90' }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
    <div className="flex items-center gap-3 text-white/40">
      {Icon && <Icon className="w-4 h-4 group-hover:text-amber-400 transition-colors" />}
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-sm font-bold tracking-tight ${color}`}>{value || '—'}</span>
  </div>
);

const OrderTimeline = ({ status, createdAt, processedAt }: { status: string, createdAt: string, processedAt?: string }) => {
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';
  const steps = ['PENDING', 'PROCESSING', isRejected ? status : 'COMPLETED'];
  
  let currentIndex = 0;
  if (status === 'PROCESSING') currentIndex = 1;
  if (status === 'COMPLETED' || isRejected) currentIndex = 2;

  return (
    <div className="p-8 md:p-12 border-b border-white/5 bg-gradient-to-r from-black/60 to-black/40 no-print overflow-hidden relative">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 mb-12 flex items-center gap-2">
        <Zap className="w-4 h-4" />
        Transaction Lifecycle
      </h3>
      
      <div className="relative flex items-center justify-between max-w-2xl mx-auto z-10">
        {/* Animated Background Line */}
        <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-white/10 -translate-y-1/2 rounded-full overflow-hidden">
           <motion.div 
             className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500"
             initial={{ width: '0%' }}
             animate={{ width: `${(currentIndex / 2) * 100}%` }}
             transition={{ duration: 1.5, ease: "easeInOut" }}
           />
        </div>
        
        {/* SVG Pulse Animation along the line */}
        <svg className="absolute top-1/2 left-[10%] right-[10%] h-20 -translate-y-1/2 overflow-visible pointer-events-none" preserveAspectRatio="none">
          <defs>
             <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="0">
               <stop offset="0%" stopColor="transparent" />
               <stop offset="50%" stopColor="#3b82f6" opacity="0.8" />
               <stop offset="100%" stopColor="transparent" />
             </linearGradient>
          </defs>
          <motion.path
            d="M 0,40 L 1000,40"
            stroke="url(#pulseGrad)"
            strokeWidth="3"
            strokeDasharray="100 900"
            fill="none"
            initial={{ strokeDashoffset: 1000 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex && !isRejected;
          const colorClass = isActive 
            ? (index === 0 ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
               : index === 1 ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
               : isRejected ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
               : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]')
            : 'bg-white/5 border-white/10 text-white/20';

          return (
            <div key={index} className="relative z-10 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isActive ? 1 : 0.8, opacity: isActive ? 1 : 0.5 }}
                transition={{ delay: index * 0.3 }}
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center backdrop-blur-md ${colorClass}`}
              >
                 {index === 0 && <Clock className="w-5 h-5" />}
                 {index === 1 && <RefreshCw className={`w-5 h-5 ${isCurrent ? 'animate-spin' : ''}`} />}
                 {index === 2 && (isRejected ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />)}
              </motion.div>
              <div className="absolute top-16 w-32 -left-10 text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white/90 drop-shadow-md' : 'text-white/30'}`}>
                  {step}
                </p>
                {index === 0 && <p className="text-[9px] text-white/40 mt-1">{new Date(createdAt).toLocaleDateString()}</p>}
                {index === 2 && processedAt && <p className="text-[9px] text-white/40 mt-1">{new Date(processedAt).toLocaleDateString()}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DollarExchangeOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [headerSettings, setHeaderSettings] = useState<any>(null);
  const [themeSettings, setThemeSettings] = useState<any>(null);

  useEffect(() => {
    fetchOrder();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const [hRes, tRes] = await Promise.all([
        apiClient.get('/theme/header/settings'),
        apiClient.get('/theme/settings')
      ]);
      if (hRes.data.success) setHeaderSettings(hRes.data.data);
      if (tRes.data.success) setThemeSettings(tRes.data.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/exchange/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const siteName = themeSettings?.siteName || order?.company?.name || 'Omni Exchange';
  const siteLogo = headerSettings?.logo;

  if (loading) {
// ... loading state ... wait, I should include the loading logic properly
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-amber-500/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white">
        <AlertCircle className="w-12 h-12 text-red-500 opacity-50" />
        <h2 className="text-xl font-bold text-white/80">Order Not Found</h2>
        <Button variant="outline" onClick={() => navigate(-1)} className="border-white/10 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 font-sans p-4 md:p-8 checkout-page">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden no-print">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[0%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Top Actions */}
        <div className="flex items-center justify-between mb-8 no-print">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Exchange
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="border-white/5 bg-white/5 text-white/60 hover:text-white" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-white/5 bg-white/5 text-white/60 hover:text-white">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* The Invoice Card */}
        <div className="relative group">
          {/* Neon Border Effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-500/20 via-white/5 to-white/5 rounded-[32px] opacity-10 blur-sm group-hover:opacity-20 transition-opacity no-print" />
          
          <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden invoice-card">
            {/* Invoice Header */}
            <div className="p-8 md:p-12 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    {siteLogo ? (
                      <img 
                        src={getImageUrl(siteLogo)} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Zap className="text-black fill-black w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-black tracking-tighter uppercase italic">{siteName}</h1>
                      <p className="text-[10px] text-amber-500/80 font-black tracking-[0.3em] uppercase">Exchange System</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white/95 tracking-tighter">INVOICE</h2>
                    <div className="flex items-center gap-2 text-white/40 font-mono text-xs">
                      <Hash className="w-3 h-3" />
                      {order.orderNumber}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <StatusBadge status={order.status} />
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1 text-label">Date</p>
                    <p className="text-sm font-bold text-white/70">{new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <OrderTimeline status={order.status} createdAt={order.createdAt} processedAt={order.processedAt} />

            {/* Client & Route Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 text-label">Client Details</h3>
                </div>
                <div className="space-y-1">
                  <DetailRow label="Client Name" value={order.client?.name || 'Guest User'} icon={User} />
                  <DetailRow label="Email Address" value={order.client?.email} icon={Mail} />
                  <DetailRow label="Phone Number" value={order.client?.phone} icon={Phone} />
                  {order.client?.address && (
                    <DetailRow label="Address" value={order.client?.address} icon={Shield} />
                  )}
                  <DetailRow label="Account Type" value={order.type} icon={Shield} color={order.type === 'SELL' ? 'text-red-400' : 'text-emerald-400'} />
                </div>
              </div>
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 text-label">Exchange Details</h3>
                </div>
                <div className="space-y-1">
                  <DetailRow label="You Sent" value={`${order.sendAmount.toLocaleString()} ${order.sendCurrency}`} icon={Download} color="text-amber-400" />
                  <DetailRow label="You Will Receive" value={`${order.receiveAmount.toLocaleString()} ${order.receiveCurrency}`} icon={Download} color="text-emerald-400" />
                  <DetailRow label="Exchange Rate" value={`1 ${order.sendCurrency} = ${order.appliedRate} ${order.receiveCurrency}`} icon={Zap} />
                  <DetailRow label="Platform" value={siteName} icon={Shield} />
                </div>
              </div>
            </div>

            {/* Animated Fund Flow Card */}
            <div className="p-8 md:p-12 bg-white/5 border-t border-white/5 overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-8 text-center">Transaction Flow</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                
                {/* Sending Card */}
                <div className="flex-1 w-full bg-black/40 border border-amber-500/20 rounded-2xl p-6 text-center z-10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                  <p className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest mb-2 relative z-10">Sent From</p>
                  
                  {order.senderAccount ? (
                    <p className="text-lg font-mono text-white/90 font-bold relative z-10 break-all">{order.senderAccount}</p>
                  ) : (
                    <p className="text-sm font-mono text-white/50 italic relative z-10">Source Account Unspecified</p>
                  )}
                  
                  {order.transactionId && (
                    <div className="mt-3 flex flex-col items-center gap-2">
                       <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg inline-block relative z-10">
                        TxID: <span className="font-mono font-bold tracking-wider">{order.transactionId}</span>
                      </div>
                      {order.proofImage && (
                        <div className="mt-4 w-full flex flex-col items-center">
                          <p className="text-[10px] text-amber-500/50 uppercase tracking-widest font-black mb-2">Payment Proof Image</p>
                          <div className="relative group/proof">
                            <img 
                              src={getImageUrl(order.proofImage)} 
                              alt="Payment Proof" 
                              className="max-w-full h-auto max-h-48 rounded-xl border border-white/10 group-hover/proof:border-amber-500/50 transition-all shadow-2xl cursor-zoom-in"
                              onClick={() => window.open(getImageUrl(order.proofImage), '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/proof:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
                               <Eye className="w-8 h-8 text-white/50" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-5 font-black text-2xl text-amber-400 relative z-10 tracking-tight">
                    {Number(order.sendAmount).toLocaleString()} <span className="text-sm opacity-70">{order.sendCurrency}</span>
                  </div>
                </div>

                {/* SVG Connection line with flowing particle animation */}
                <div className="hidden md:flex w-32 h-24 items-center justify-center relative z-0">
                   <svg className="w-full h-full text-white/10 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                     {/* Base Track */}
                     <path d="M0,12 L100,12" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" fill="none" opacity="0.5" />
                     
                     {/* Glowing Flow Animation */}
                     <defs>
                       <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                         <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                         <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                       </linearGradient>
                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="2" result="blur" />
                         <feComposite in="SourceGraphic" in2="blur" operator="over" />
                       </filter>
                     </defs>
                     <motion.path 
                       d="M0,12 L100,12" 
                       stroke="url(#flowGradient)" 
                       strokeWidth="3" 
                       fill="none"
                       strokeDasharray="40 100"
                       filter="url(#glow)"
                       animate={{ strokeDashoffset: [140, -40] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                     />
                     
                     {/* Moving Packets (Data representation) */}
                     <motion.circle cx="0" cy="12" r="2.5" fill="#f59e0b"
                       animate={{ cx: [0, 100], opacity: [0, 1, 0] }}
                       transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     />
                     <motion.circle cx="0" cy="12" r="2.5" fill="#10b981"
                       animate={{ cx: [0, 100], opacity: [0, 1, 0] }}
                       transition={{ duration: 1.5, delay: 0.75, repeat: Infinity, ease: "easeInOut" }}
                     />
                   </svg>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] border border-white/10 p-2.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.2)] z-10">
                     <ArrowRight
className="w-4 h-4 text-blue-400" />
                   </div>
                </div>
                
                {/* Mobile version simple arrow */}
                <div className="md:hidden py-2 bg-[#050505] p-2 rounded-full border border-white/10 z-10">
                  <ArrowRight className="w-4 h-4 text-white/50 rotate-90" />
                </div>

                {/* Receiving Card */}
                <div className="flex-1 w-full bg-black/40 border border-emerald-500/20 rounded-2xl p-6 text-center z-10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                  <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-widest mb-2 relative z-10">Received At</p>
                  <p className="text-lg font-mono text-white/90 font-bold relative z-10 break-all tracking-wider">{order.receiverAccount}</p>
                  
                  <div className="mt-5 font-black text-2xl text-emerald-400 relative z-10 tracking-tight">
                    {Number(order.receiveAmount).toLocaleString()} <span className="text-sm opacity-70">{order.receiveCurrency}</span>
                  </div>
                  <div className={`mt-3 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block relative z-10 ${order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
                    {order.status === 'COMPLETED' ? 'EXECUTED' : 'AWAITING'}
                  </div>
                </div>

              {/* Admin Note */}
              {order.adminNote && (
                <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Admin Note</p>
                      <p className="text-sm text-blue-200/80 mt-1">{order.adminNote}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Summary Banner */}
            <div className="p-8 md:p-12 bg-amber-500 flex flex-col md:flex-row justify-between items-center gap-6 banner-section">
              <div className="text-center md:text-left">
                <p className="text-[10px] text-black font-black uppercase tracking-[0.3em] text-label-dark">Final Amount</p>
                <h3 className="text-4xl font-black text-black tracking-tighter">
                  {order.receiveAmount.toLocaleString()} <span className="text-xl opacity-60">{order.receiveCurrency}</span>
                </h3>
              </div>
              <div className="flex gap-3 no-print">
                 <Button variant="outline" className="h-12 px-6 border-black/20 bg-transparent text-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                    Generate PDF
                 </Button>
                 <Button variant="default" className="h-12 px-6 bg-black text-white font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                 </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="mt-12 text-center footer-section">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 italic italic-text">
                Digitally Signed Protocol Invoice • Powered by {siteName} Engine
            </p>
            <div className="flex justify-center gap-8 text-white/40 no-print">
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Instant Settlement</span>
                </div>
            </div>
        </div>
      </motion.div>

      {/* CSS for print */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .min-h-screen { min-height: 0 !important; padding: 10mm !important; }
          .bg-\\[\\#050505\\] { background: white !important; }
          .no-print { display: none !important; }
          .max-w-4xl { max-w: 100% !important; margin: 0 !important; width: 100% !important; }
          .invoice-card { 
            background: white !important; 
            border: 1px solid #eee !important; 
            border-radius: 8px !important; 
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          .text-white, .text-white\\/95, .text-white\\/90, .text-white\\/70, .text-white\\/60, .text-white\\/40, .text-white\\/30, .text-white\\/20 { 
            color: black !important; 
          }
          .text-label { color: #666 !important; }
          .text-label-dark { color: #333 !important; }
          .border-white\\/10, .border-white\\/5 { border-color: #eee !important; }
          .bg-amber-500 { 
            background: #f59e0b !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          .banner-section { border-radius: 8px !important; margin-top: 20px !important; }
          .italic-text { color: #999 !important; }
          .data-table { background: #fafafa !important; border-top: 1px solid #eee !important; }
          img { max-width: 100px !important; filter: grayscale(0) !important; }
        }
      `}</style>
    </div>
  );
};

export default DollarExchangeOrderDetails;
