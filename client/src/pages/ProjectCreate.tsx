import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Briefcase, ChevronRight } from 'lucide-react';
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

export function ProjectCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      const projectId = response.data.data?.id;
      navigate(projectId ? '/admin/projects' : '/admin/projects');
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
                  <div>
                    <Label htmlFor="clientId" className="text-amber-100">
                      Client *
                    </Label>
                    <select
                      id="clientId"
                      {...register('clientId')}
                      className={cn('w-full px-3 py-2 mt-1', inputDark)}
                    >
                      <option value="">Select client</option>
                      {clientUsers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.email} {c.email ? `(${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.clientId && (
                      <p className="text-red-400 text-sm mt-1">{errors.clientId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-amber-100 mb-2 block">Service *</Label>
                    {services.length === 0 ? (
                      <p className="text-amber-200/60 text-sm">No services available</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {services.map((s: any, i: number) => (
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
