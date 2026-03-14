import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentGatewayApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  CreditCard, 
  CheckCircle2, 
  XCircle,
  Settings,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface PaymentGateway {
  id: number;
  name: string;
  accountType: string;
  accountNumber: string;
  instructions: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const paymentGatewaySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  accountType: z.enum(['Personal', 'Payment', 'Agent'], {
    errorMap: () => ({ message: 'Account type must be Personal, Payment, or Agent' }),
  }),
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .max(20, 'Account number must be less than 20 characters')
    .regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh mobile number format (01XXXXXXXXX)'),
  instructions: z.string().max(5000, 'Instructions must be less than 5000 characters').optional(),
  isActive: z.boolean().optional(),
});

type PaymentGatewayFormData = z.infer<typeof paymentGatewaySchema>;

function BkashSettings() {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState('false');
  const [isActive, setIsActive] = useState('false');
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['bkash-settings'],
    queryFn: async () => {
      const response = await paymentGatewayApi.getBkashSettings();
      return response.data.data;
    },
  });

  // Effect to load data
  useState(() => {
    if (settings) {
      setAppKey(settings.bkash_app_key || '');
      setAppSecret(settings.bkash_app_secret || '');
      setUsername(settings.bkash_username || '');
      setPassword(settings.bkash_password || '');
      setIsLive(settings.bkash_is_live || 'false');
      setIsActive(settings.bkash_is_active || 'false');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => paymentGatewayApi.updateBkashSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bkash-settings'] });
      alert('bKash auto payment settings saved successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to preserve bKash settings');
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      bkash_app_key: appKey,
      bkash_app_secret: appSecret,
      bkash_username: username,
      bkash_password: password,
      bkash_is_live: isLive,
      bkash_is_active: isActive,
    });
  };

  if (isLoading) return <div className="p-12 text-center text-amber-200/60 animate-pulse">Loading bKash settings...</div>;

  return (
    <DashboardWidgetCard index={5} className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
          <Settings className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-amber-100">Automatic bKash Integration</h2>
          <p className="text-amber-200/60 text-xs">Configure auto-payment API access</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">App Key</Label>
            <Input 
              value={appKey} 
              onChange={e => setAppKey(e.target.value)} 
              type="text" 
              className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">App Secret</Label>
            <Input 
              value={appSecret} 
              onChange={e => setAppSecret(e.target.value)} 
              type="password" 
              className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Username</Label>
            <Input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              type="text" 
              className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Password</Label>
            <Input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              type="password" 
              className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Environment</Label>
            <div className="relative">
              <select
                value={isLive}
                onChange={e => setIsLive(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-amber-500/20 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer text-sm"
              >
                <option value="false" className="bg-slate-900">Sandbox (Test Mode)</option>
                <option value="true" className="bg-slate-900">Production (Live)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Status</Label>
            <div className="relative">
              <select
                value={isActive}
                onChange={e => setIsActive(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-amber-500/20 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer text-sm"
              >
                <option value="true" className="bg-slate-900">Active (Show to clients)</option>
                <option value="false" className="bg-slate-900">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save bKash Settings'}
          </Button>
        </div>
      </div>
    </DashboardWidgetCard>
  );
}

function PaymentSettingsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PaymentGatewayFormData>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      name: '',
      accountType: 'Personal',
      accountNumber: '',
      instructions: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  // Fetch payment gateways
  const { data: gatewaysResponse, isLoading } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: async () => {
      const response = await paymentGatewayApi.getAll();
      return response.data.data as PaymentGateway[];
    },
  });

  const gateways = gatewaysResponse || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: PaymentGatewayFormData) => paymentGatewayApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      setIsModalOpen(false);
      reset();
      setEditingGateway(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PaymentGatewayFormData }) =>
      paymentGatewayApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      setIsModalOpen(false);
      reset();
      setEditingGateway(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentGatewayApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
    },
  });

  const onSubmit = (data: PaymentGatewayFormData) => {
    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    reset({
      name: gateway.name,
      accountType: gateway.accountType as 'Personal' | 'Payment' | 'Agent',
      accountNumber: gateway.accountNumber,
      instructions: gateway.instructions || '',
      isActive: gateway.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGateway(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-amber-500" />
            Payment Settings
          </h1>
          <p className="text-amber-200/80 mt-1">Manage payment gateways (Bkash, Nagad, Rocket, etc.)</p>
        </div>
        <PermissionGuard permission="can_manage_payment_settings">
          <Button
            onClick={() => {
              setEditingGateway(null);
              reset();
              setIsModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Gateway
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-amber-200/60 animate-pulse">Loading payment gateways...</div>
      ) : gateways.length === 0 ? (
        <DashboardWidgetCard index={0} className="py-12 text-center text-amber-200/40">
          No payment gateways found. Add your first payment gateway to get started.
        </DashboardWidgetCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gateway, idx) => (
            <DashboardWidgetCard key={gateway.id} index={idx} className={!gateway.isActive ? 'opacity-50 grayscale cursor-not-allowed' : 'group'}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-amber-100">{gateway.name}</h3>
                    {gateway.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div className="text-xs text-amber-200/60 font-mono">
                    {gateway.accountType} • {gateway.accountNumber}
                  </div>
                </div>
                <PermissionGuard permission="can_manage_payment_settings">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(gateway)} className="h-8 w-8 text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(gateway.id, gateway.name)}
                      className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </PermissionGuard>
              </div>

              {gateway.instructions && (
                <div className="bg-slate-900/50 border border-amber-500/5 p-3 rounded-lg mb-4">
                  <p className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest mb-1">Instructions</p>
                  <p className="text-xs text-amber-200/70 whitespace-pre-wrap leading-relaxed">{gateway.instructions}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  gateway.isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {gateway.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </DashboardWidgetCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <DashboardWidgetCard index={0} className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-game-item-reveal">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-amber-100">{editingGateway ? 'Edit Gateway' : 'Add Gateway'}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Gateway Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Bkash, Nagad, Rocket"
                  className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Account Type *</Label>
                <div className="relative">
                  <select
                    id="accountType"
                    {...register('accountType')}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-amber-500/20 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer text-sm"
                  >
                    <option value="Personal" className="bg-slate-900">Personal</option>
                    <option value="Payment" className="bg-slate-900">Payment</option>
                    <option value="Agent" className="bg-slate-900">Agent</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
                </div>
                {errors.accountType && (
                  <p className="text-xs text-red-400 mt-1">{errors.accountType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Account Number *</Label>
                <Input
                  id="accountNumber"
                  {...register('accountNumber')}
                  placeholder="01XXXXXXXXX (11 digits)"
                  maxLength={11}
                  className="bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
                />
                {errors.accountNumber && (
                  <p className="text-xs text-red-400 mt-1">{errors.accountNumber.message}</p>
                )}
                <p className="text-[10px] text-amber-500/40">Bangladesh mobile number format</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">Payment Instructions</Label>
                <textarea
                  id="instructions"
                  {...register('instructions')}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-amber-500/20 rounded-lg text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                  placeholder="Enter payment instructions for clients..."
                />
                {errors.instructions && (
                  <p className="text-xs text-red-400 mt-1">{errors.instructions.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-amber-500/10 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="w-4 h-4 text-amber-500 bg-slate-900 border-amber-500/30 rounded focus:ring-amber-500/50"
                />
                <Label htmlFor="isActive" className="text-sm text-amber-100 cursor-pointer">
                  Active (visible to clients)
                </Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 bg-slate-800 border-amber-500/20 text-amber-200/60 hover:text-amber-100">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  {editingGateway ? 'Update Gateway' : 'Create Gateway'}
                </Button>
              </div>
            </form>
          </DashboardWidgetCard>
        </div>
      )}
    </div>
  );
}

export default function PaymentSettings() {
  return (
    <PermissionGuard permission="can_manage_payment_settings">
      <div className="container mx-auto">
        <PaymentSettingsContent />
        <BkashSettings />
      </div>
    </PermissionGuard>
  );
}
