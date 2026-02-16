import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, serviceApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDaysToMonthsDays, formatCurrencyWithSymbol } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGuard } from '@/components/PermissionGuard';

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
    mutationFn: (data: CreateProjectForm) => adminApi.createProject({
      clientId: data.clientId,
      serviceId: data.serviceId,
      title: data.title || undefined,
      description: data.description || undefined,
      budget: data.budget,
      time: data.time,
      deliveryStartDate: data.deliveryStartDate ? new Date(data.deliveryStartDate).toISOString() : undefined,
      deliveryEndDate: data.deliveryEndDate ? new Date(data.deliveryEndDate).toISOString() : undefined,
    }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      const projectId = response.data.data?.id;
      navigate(projectId ? `/admin/projects` : '/admin/projects');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create project');
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createMutation.mutate(data);
  };

  const onServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setValue('serviceId', id);
    const svc = services.find((s: any) => s.id === id);
    if (svc) {
      setValue('title', svc.title || '');
      setValue('description', svc.details || '');
      setValue('budget', Number(svc.pricing) || 0);
      if (svc.durationDays && !svc.useDeliveryDate) {
        setValue('time', formatDaysToMonthsDays(svc.durationDays));
      }
    }
  };

  if (!user?.companyId) {
    return (
      <div className="p-6 text-slate-600">Please select a company.</div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_projects">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create Project</h1>
          <p className="text-slate-600 mt-1">POS-style project creation with client and service selection</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <select
                  id="clientId"
                  {...register('clientId')}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                >
                  <option value="">Select client</option>
                  {clientUsers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="serviceId">Service *</Label>
                <select
                  id="serviceId"
                  {...register('serviceId')}
                  onChange={onServiceChange}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                >
                  <option value={0}>Select service</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.title} - {formatCurrencyWithSymbol(s.pricing, s.currency || 'BDT')}
                    </option>
                  ))}
                </select>
                {errors.serviceId && (
                  <p className="text-red-500 text-sm mt-1">{errors.serviceId.message}</p>
                )}
                {selectedService && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-slate-500">
                      Budget must be 50%–150% of service price:{' '}
                      {formatCurrencyWithSymbol(Number(selectedService.pricing) * 0.5, selectedService.currency || 'BDT')} –{' '}
                      {formatCurrencyWithSymbol(Number(selectedService.pricing) * 1.5, selectedService.currency || 'BDT')}
                    </p>
                    {selectedService.useDeliveryDate && selectedService.deliveryStartDate && selectedService.deliveryEndDate && (
                      <p className="text-xs text-indigo-600">
                        মেয়াদ: {new Date(selectedService.deliveryStartDate).toLocaleDateString()} – {new Date(selectedService.deliveryEndDate).toLocaleDateString()}
                      </p>
                    )}
                    {!selectedService.useDeliveryDate && selectedService.durationDays && (
                      <p className="text-xs text-indigo-600">
                        মেয়াদ: {formatDaysToMonthsDays(selectedService.durationDays)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Auto-filled from service if empty"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                  placeholder="Auto-filled from service if empty"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget *</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('budget')}
                    className="mt-1"
                  />
                  {errors.budget && (
                    <p className="text-red-500 text-sm mt-1">{errors.budget.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="time">Time (e.g., 2 weeks) *</Label>
                  <Input
                    id="time"
                    {...register('time')}
                    placeholder="e.g., 2 weeks, 1 month"
                    className="mt-1"
                  />
                  {errors.time && (
                    <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryStartDate">Delivery Start Date</Label>
                  <Input
                    id="deliveryStartDate"
                    type="date"
                    {...register('deliveryStartDate')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryEndDate">Delivery End Date</Label>
                  <Input
                    id="deliveryEndDate"
                    type="date"
                    {...register('deliveryEndDate')}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/projects')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
