import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { adminApi, serviceApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDaysToMonthsDays, formatCurrencyWithSymbol } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGuard } from '@/components/PermissionGuard';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { Briefcase, ChevronRight, Search, User, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const createProjectSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  serviceId: z.coerce.number().int().refine((v) => v > 0, 'Service is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  budget: z.coerce.number().positive('Budget is required'),
  time: z.string().min(1, 'Time is required'),
  deliveryStartDate: z.string().optional(),
  deliveryEndDate: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';
const btnOutline =
  'bg-slate-800/60 border border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';

// ─── Searchable Client Dropdown ───────────────────────────────────────────────
function ClientSearchSelect({
  clients,
  value,
  onChange,
  error,
}: {
  clients: any[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = clients.find((c: any) => c.id === value);
  const filtered = clients.filter((c: any) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 mt-1 text-left rounded-lg border transition-colors',
          'bg-slate-800/60 border-amber-500/20 text-amber-100 hover:border-amber-500/50',
          error && 'border-red-500/60',
          open && 'border-amber-500/60'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                {selected.name || selected.email}
                {selected.name && selected.email && (
                  <span className="text-amber-200/50 text-xs ml-1">({selected.email})</span>
                )}
              </span>
            </>
          ) : (
            <span className="text-amber-200/40">Select client...</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 hover:text-red-400 text-amber-400/60 rounded"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-amber-400/60 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-amber-500/30 bg-slate-900 shadow-xl">
          {/* Search input */}
          <div className="p-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2 bg-slate-800 rounded-md px-2 py-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 bg-transparent text-sm text-amber-100 placeholder:text-amber-200/40 outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}>
                  <X className="w-3 h-3 text-amber-400/60 hover:text-amber-300" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-amber-200/50">
                No clients found
              </li>
            ) : (
              filtered.map((c: any) => (
                <li
                  key={c.id}
                  onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors',
                    value === c.id
                      ? 'bg-amber-500/20 text-amber-100'
                      : 'text-amber-200 hover:bg-slate-800 hover:text-amber-100'
                  )}
                >
                  <User className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                  <span className="flex-1 truncate">{c.name || c.email}</span>
                  {c.name && c.email && (
                    <span className="text-amber-200/40 text-xs truncate">{c.email}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProjectCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serviceSearch, setServiceSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      clientId: '',
      serviceId: 0,
      title: '',
      description: '',
      budget: 0,
      time: '',
      deliveryStartDate: '',
      deliveryEndDate: '',
    },
  });

  const selectedClientId = watch('clientId');
  const selectedServiceId = watch('serviceId');

  const { data: clientUsers = [] } = useQuery({
    queryKey: ['admin-client-users'],
    queryFn: async () => {
      const response = await adminApi.getClientUsers();
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-active'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const selectedService = services.find((s: any) => s.id === Number(selectedServiceId));

  // Filter services by search
  const filteredServices = services.filter((s: any) => {
    const q = serviceSearch.toLowerCase();
    return (
      !q ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.details || '').toLowerCase().includes(q)
    );
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectForm) =>
      adminApi.createProject({
        clientId: data.clientId,
        serviceId: data.serviceId,
        title: data.title || undefined,
        description: data.description || undefined,
        budget: data.budget,
        time: data.time,
        deliveryStartDate: data.deliveryStartDate
          ? new Date(data.deliveryStartDate).toISOString()
          : undefined,
        deliveryEndDate: data.deliveryEndDate
          ? new Date(data.deliveryEndDate).toISOString()
          : undefined,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      navigate('/admin/projects');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create project');
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createMutation.mutate(data);
  };

  const onServiceSelect = (svc: any) => {
    setValue('serviceId', svc.id);
    setValue('title', svc.title || '');
    setValue('description', svc.details || '');
    setValue('budget', Number(svc.pricing) || 0);
    if (svc.durationDays && !svc.useDeliveryDate) {
      setValue('time', formatDaysToMonthsDays(svc.durationDays));
    }
    if (svc.useDeliveryDate && svc.deliveryStartDate && svc.deliveryEndDate) {
      setValue('deliveryStartDate', svc.deliveryStartDate.split('T')[0]);
      setValue('deliveryEndDate', svc.deliveryEndDate.split('T')[0]);
    }
  };

  if (!user?.companyId) {
    return (
      <div className="p-6 text-amber-200/80">Please select a company.</div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_projects">
      <div className="p-6 space-y-6">
        {/* Header */}
        <GamePanel className="p-6">
          <h1 className="text-3xl font-bold text-amber-100 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-amber-400" />
            Create Project
          </h1>
          <p className="text-amber-200/80 mt-1">
            POS-style project creation with client and service selection
          </p>
        </GamePanel>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <DashboardWidgetCard index={0} className="p-6">
            <div className="space-y-6">
              {/* Section 1: Client & Service */}
              <GameCard index={0} className="p-4">
                <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider">
                  Client & Service
                </h3>
                <div className="space-y-4">

                  {/* ── Client searchable dropdown ── */}
                  <div>
                    <Label className="text-amber-100">Client *</Label>
                    <ClientSearchSelect
                      clients={clientUsers}
                      value={selectedClientId}
                      onChange={(id) => setValue('clientId', id, { shouldValidate: true })}
                      error={errors.clientId?.message}
                    />
                  </div>

                  {/* ── Service search + card grid ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-amber-100">Service *</Label>
                      {services.length > 0 && (
                        <span className="text-xs text-amber-200/50">
                          {filteredServices.length} of {services.length}
                        </span>
                      )}
                    </div>

                    {services.length > 0 && (
                      <div className="flex items-center gap-2 bg-slate-800/60 border border-amber-500/20 rounded-lg px-3 py-2 mb-3 focus-within:border-amber-500/50">
                        <Search className="w-4 h-4 text-amber-400/60 shrink-0" />
                        <input
                          type="text"
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Search services..."
                          className="flex-1 bg-transparent text-sm text-amber-100 placeholder:text-amber-200/40 outline-none"
                        />
                        {serviceSearch && (
                          <button type="button" onClick={() => setServiceSearch('')}>
                            <X className="w-3.5 h-3.5 text-amber-400/60 hover:text-amber-300" />
                          </button>
                        )}
                      </div>
                    )}

                    {services.length === 0 ? (
                      <p className="text-amber-200/60 text-sm">No services available</p>
                    ) : filteredServices.length === 0 ? (
                      <p className="text-amber-200/50 text-sm text-center py-4">
                        No services match "{serviceSearch}"
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {filteredServices.map((s: any, i: number) => (
                          <div
                            key={s.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onServiceSelect(s)}
                            onKeyDown={(e) => e.key === 'Enter' && onServiceSelect(s)}
                            className="cursor-pointer focus:outline-none"
                          >
                            <GameCard
                              index={i}
                              selected={Number(selectedServiceId) === s.id}
                              className="p-4"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-amber-100 truncate">{s.title}</h4>
                                  <p className="text-sm text-amber-200/70 mt-1 line-clamp-2">
                                    {s.details || '—'}
                                  </p>
                                  <p className="text-xs text-amber-400 mt-2">
                                    {formatCurrencyWithSymbol(s.pricing, s.currency || 'BDT')}
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-amber-400/80 flex-shrink-0 ml-2" />
                              </div>
                            </GameCard>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.serviceId && (
                      <p className="text-red-400 text-sm mt-1">{errors.serviceId.message}</p>
                    )}

                    {selectedService && (
                      <div className="mt-3 game-item-card game-item-selected rounded-lg p-4 border border-amber-500/40">
                        <p className="text-sm font-medium text-amber-100">Selected Service</p>
                        <p className="text-amber-200">{selectedService.title}</p>
                        <p className="text-xs text-amber-200/70 mt-1">
                          Budget range: {formatCurrencyWithSymbol(Number(selectedService.pricing) * 0.5, selectedService.currency || 'BDT')} – {formatCurrencyWithSymbol(Number(selectedService.pricing) * 1.5, selectedService.currency || 'BDT')}
                        </p>
                        {selectedService.useDeliveryDate &&
                          selectedService.deliveryStartDate &&
                          selectedService.deliveryEndDate && (
                            <p className="text-xs text-amber-200/70 mt-0.5">
                              মেয়াদ: {new Date(selectedService.deliveryStartDate).toLocaleDateString()} – {new Date(selectedService.deliveryEndDate).toLocaleDateString()}
                            </p>
                          )}
                        {!selectedService.useDeliveryDate &&
                          selectedService.durationDays && (
                            <p className="text-xs text-amber-200/70 mt-0.5">
                              মেয়াদ: {formatDaysToMonthsDays(selectedService.durationDays)}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </GameCard>

              {/* Section 2: Project Details */}
              <GameCard index={1} className="p-4">
                <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider">
                  Project Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-amber-100">
                      Title
                    </Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Auto-filled from service if empty"
                      className={cn('mt-1', inputDark)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-amber-100">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      {...register('description')}
                      rows={3}
                      className={cn('w-full px-3 py-2 mt-1', inputDark)}
                      placeholder="Auto-filled from service if empty"
                    />
                  </div>
                </div>
              </GameCard>

              {/* Section 3: Budget & Timeline */}
              <GameCard index={2} className="p-4">
                <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider">
                  Budget & Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget" className="text-amber-100">
                      Budget *
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('budget')}
                      className={cn('mt-1', inputDark)}
                    />
                    {errors.budget && (
                      <p className="text-red-400 text-sm mt-1">{errors.budget.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-amber-100">
                      Time (e.g., 2 weeks) *
                    </Label>
                    <Input
                      id="time"
                      {...register('time')}
                      placeholder="e.g., 2 weeks, 1 month"
                      className={cn('mt-1', inputDark)}
                    />
                    {errors.time && (
                      <p className="text-red-400 text-sm mt-1">{errors.time.message}</p>
                    )}
                  </div>
                </div>
              </GameCard>

              {/* Section 4: Delivery Dates */}
              <GameCard index={3} className="p-4">
                <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider">
                  Delivery Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryStartDate" className="text-amber-100">
                      Delivery Start Date
                    </Label>
                    <Input
                      id="deliveryStartDate"
                      type="date"
                      {...register('deliveryStartDate')}
                      className={cn('mt-1', inputDark)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryEndDate" className="text-amber-100">
                      Delivery End Date
                    </Label>
                    <Input
                      id="deliveryEndDate"
                      type="date"
                      {...register('deliveryEndDate')}
                      className={cn('mt-1', inputDark)}
                    />
                  </div>
                </div>
              </GameCard>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50 animate-game-glow"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/projects')} className={btnOutline}>
                  Cancel
                </Button>
              </div>
            </div>
          </DashboardWidgetCard>
        </form>
      </div>
    </PermissionGuard>
  );
}
