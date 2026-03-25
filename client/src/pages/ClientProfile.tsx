import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, Mail, Phone, Building2, MapPin, Camera, Save, 
  Briefcase, CreditCard, ArrowLeftRight, TrendingUp, 
  CheckCircle2, Clock, ShieldCheck, Sparkles, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { authApi } from '@/lib/auth';
import { projectApi, invoiceApi } from '@/lib/api';
import apiClient from '@/lib/apiClient';
import Swal from 'sweetalert2';

// SVG Animated Ring Component
const AvatarGlowRing = () => (
  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
    <motion.circle
      cx="50" cy="50" r="48"
      fill="none"
      stroke="url(#avatarGradient)"
      strokeWidth="2"
      strokeDasharray="301.59"
      initial={{ strokeDashoffset: 301.59 }}
      animate={{ strokeDashoffset: [301.59, 0, -301.59] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
    <defs>
      <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  </svg>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

const StatCard = ({ title, value, icon: Icon, color, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative group overflow-hidden bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/30 transition-all duration-500"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />
    
    {/* Looping Horizontal Scan Line at Bottom */}
    <div className="absolute bottom-0 inset-x-0 h-1 overflow-hidden opacity-20 group-hover:opacity-40 transition-opacity">
        <motion.div 
            className="w-full h-full bg-gradient-to-r from-transparent via-amber-500 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
    </div>

    {/* Secondary Top Trace Line */}
    <div className="absolute top-0 inset-x-0 h-[1px] overflow-hidden opacity-10">
        <motion.div 
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent"
            initial={{ x: '200%' }}
            animate={{ x: '-200%' }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
    </div>

    <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500">
            <Icon className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            Live Data
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-black text-white group-hover:text-amber-500 transition-colors duration-500">{value}</h3>
        </div>

        {/* SVG Data Line Animation */}
        <div className="mt-4 h-12 w-full overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <motion.path
                    d="M0,10 Q10,2 20,10 T40,10 T60,10 T80,10 T100,10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={color.replace('bg-', 'text-')}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </svg>
        </div>
    </div>
  </motion.div>
);

export default function ClientProfile() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    address: user?.address || '',
    education: user?.education || '',
    profileImage: user?.profileImage || ''
  });

  // Sync formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        address: user.address || '',
        education: user.education || '',
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);

  // Fetch Stats Data
  const { data: projects = [] } = useQuery({
    queryKey: ['client-projects'],
    queryFn: async () => {
      const resp = await projectApi.getAll();
      return resp.data.data || [];
    }
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: async () => {
      const resp = await invoiceApi.getClientInvoices();
      return resp.data.data || [];
    }
  });

  const { data: exchangeOrders = [] } = useQuery({
    queryKey: ['client-exchange-orders'],
    queryFn: async () => {
      const resp = await apiClient.get('/exchange/orders/my');
      return resp.data.data || [];
    }
  });

  // Aggregated Stats
  const activeProjects = (projects as any[]).filter((p) => p.status !== 'Completed' && p.status !== 'Canceled').length;
  const totalPaid = (invoices as any[]).filter((i) => i.status === 'PAID').reduce((acc: number, curr) => acc + Number(curr.totalAmount), 0);
  const exchangeCount = (exchangeOrders as any[]).length;

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<typeof formData>) => authApi.updateProfile(data),
    onSuccess: () => {
      Swal.fire({
        title: 'Success!',
        text: 'Profile updated successfully!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      setIsEditing(false);
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
    onError: () => {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update profile. Please try again.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, profileImage: base64String }));
        // Auto-save image
        updateProfileMutation.mutate({ profileImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 relative">
      {/* Background SVG Animation - Floating Nodes */}
      <div className="fixed inset-0 pointer-events-none opacity-20 -z-10">
        <svg className="w-full h-full fill-amber-500/20">
          <motion.circle cx="10%" cy="20%" r="2" animate={{ y: [0, 50, 0], opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 10, repeat: Infinity }} />
          <motion.circle cx="80%" cy="60%" r="3" animate={{ y: [0, -70, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 15, repeat: Infinity }} />
          <motion.circle cx="40%" cy="80%" r="1" animate={{ x: [0, 100, 0] }} transition={{ duration: 20, repeat: Infinity }} />
        </svg>
      </div>

      {/* Grid Stats at Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Projects" value={activeProjects} icon={Briefcase} color="bg-amber-500" delay={0.1} />
          <StatCard title="Financial Growth" value={`$${totalPaid.toLocaleString()}`} icon={CreditCard} color="bg-emerald-500" delay={0.2} />
          <StatCard title="Currency Orders" value={exchangeCount} icon={ArrowLeftRight} color="bg-blue-500" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden h-full"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
            
            <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="absolute inset-0 rounded-full bg-amber-500/10 scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative w-32 h-32 rounded-full p-1 bg-slate-800 border border-slate-700 overflow-hidden shadow-2xl group-hover:border-amber-500/50 transition-colors duration-500">
                    {formData.profileImage ? (
                        <img src={formData.profileImage} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 text-4xl font-black text-amber-500">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    )}
                    <AvatarGlowRing />
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20 border-4 border-slate-900 group-hover:rotate-12"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="space-y-1 mb-8">
                <h2 className="text-2xl font-black text-white tracking-tighter">
                  {user?.name || 'Omni Client'}
                  <Sparkles className="inline-block w-4 h-4 ml-2 text-amber-500 animate-pulse" />
                </h2>
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                    </div>
                </div>
                <div className="border-x border-white/5 px-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Rank</p>
                    <p className="text-[11px] font-black text-amber-500">PLATINUM</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Verify</p>
                    <ShieldCheck className="w-4 h-4 text-blue-500 mx-auto" />
                </div>
            </div>
            
            <div className="mt-8">
              <Button 
                variant="outline" 
                className="w-full rounded-2xl border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-6 group"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                <Save className={`ml-2 w-4 h-4 transition-transform ${isEditing ? 'scale-110' : 'group-hover:translate-x-1'}`} />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Detailed Info & Edit Form */}
        <div className="lg:col-span-2 space-y-8">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-[40px] p-10 shadow-xl"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-amber-500 rounded-full" />
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase">Personal Information</h3>
                            <p className="text-slate-500 text-sm font-medium">Manage your personal details</p>
                        </div>
                    </div>
                    {updateProfileMutation.isPending && <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <User className="w-3 h-3 text-amber-500" /> Full Name
                        </Label>
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Full Name"
                            className="bg-slate-950/50 border-slate-800 rounded-2xl py-6 focus:ring-amber-500/20 disabled:opacity-50 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-3 h-3 text-amber-500" /> Phone Number
                        </Label>
                        <Input 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Phone Number"
                            className="bg-slate-950/50 border-slate-800 rounded-2xl py-6 focus:ring-amber-500/20 disabled:opacity-50 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-amber-500" /> Company Name
                        </Label>
                        <Input 
                            value={formData.companyName}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Company Name"
                            className="bg-slate-950/50 border-slate-800 rounded-2xl py-6 focus:ring-amber-500/20 disabled:opacity-50 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-amber-500" /> Address Line
                        </Label>
                        <Input 
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Your Address"
                            className="bg-slate-950/50 border-slate-800 rounded-2xl py-6 focus:ring-amber-500/20 disabled:opacity-50 transition-all font-medium"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                           Bio & Background
                        </Label>
                        <Textarea 
                            value={formData.education}
                            onChange={(e) => setFormData({...formData, education: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Professional background or special requirements..."
                            className="bg-slate-950/50 border-slate-800 rounded-2xl min-h-[160px] focus:ring-amber-500/20 disabled:opacity-50 transition-all p-6 font-medium leading-relaxed"
                        />
                    </div>
                </div>

                <AnimatePresence>
                  {isEditing && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-12 flex items-center justify-end"
                    >
                        <Button 
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                          className="px-10 py-7 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition-all shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                        >
                          {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Update Profile
                        </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
            </motion.div>

            {/* Loyalty & Systems Badge Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-8"
            >
                <div className="flex-1 space-y-2">
                    <h4 className="text-white font-black text-xl flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                        Account Verification
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">Your profile is currently at 94% strength. Complete your address to reach full status.</p>
                </div>
                <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-12 h-12 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-amber-500/50 shadow-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    ))}
                    <div className="w-12 h-12 rounded-full bg-amber-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-black text-xs shadow-xl">+12</div>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
