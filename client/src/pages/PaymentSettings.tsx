import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentGatewayApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, X, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Payment Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage payment gateways (Bkash, Nagad, Rocket, etc.)</p>
        </div>
        <PermissionGuard permission="can_manage_payment_settings">
          <Button
            onClick={() => {
              setEditingGateway(null);
              reset();
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Gateway
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading payment gateways...</div>
      ) : gateways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No payment gateways found. Add your first payment gateway to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className={!gateway.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{gateway.name}</CardTitle>
                      {gateway.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {gateway.accountType} • {gateway.accountNumber}
                    </CardDescription>
                  </div>
                  <PermissionGuard permission="can_manage_payment_settings">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(gateway)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(gateway.id, gateway.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                {gateway.instructions && (
                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Instructions:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{gateway.instructions}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${gateway.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {gateway.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Gateway Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Bkash, Nagad, Rocket"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="accountType">Account Type *</Label>
                  <select
                    id="accountType"
                    {...register('accountType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Payment">Payment</option>
                    <option value="Agent">Agent</option>
                  </select>
                  {errors.accountType && (
                    <p className="text-sm text-red-600 mt-1">{errors.accountType.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    {...register('accountNumber')}
                    placeholder="01XXXXXXXXX (11 digits)"
                    maxLength={11}
                  />
                  {errors.accountNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.accountNumber.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Bangladesh mobile number format</p>
                </div>

                <div>
                  <Label htmlFor="instructions">Payment Instructions</Label>
                  <textarea
                    id="instructions"
                    {...register('instructions')}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter payment instructions for clients (e.g., Send money to this number and provide transaction ID)"
                  />
                  {errors.instructions && (
                    <p className="text-sm text-red-600 mt-1">{errors.instructions.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active (visible to clients)
                  </Label>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingGateway ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PaymentSettings() {
  return (
    <PermissionGuard permission="can_manage_payment_settings">
      <PaymentSettingsContent />
    </PermissionGuard>
  );
}
