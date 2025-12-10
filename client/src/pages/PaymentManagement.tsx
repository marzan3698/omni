import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle2, XCircle, Clock, DollarSign, FileText, User, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const rejectPaymentSchema = z.object({
  adminNotes: z.string().min(1, 'Admin notes are required for rejection').max(5000),
});

type RejectPaymentFormData = z.infer<typeof rejectPaymentSchema>;

interface Payment {
  id: number;
  invoiceId: number;
  projectId: number | null;
  clientId: number;
  paymentGatewayId: number;
  amount: string;
  transactionId: string | null;
  paymentMethod: string;
  status: string;
  paidBy: string | null;
  notes: string | null;
  adminNotes: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  invoice?: {
    id: number;
    invoiceNumber: string;
    totalAmount: string;
  };
  project?: {
    id: number;
    title: string;
  };
  client?: {
    id: number;
    name: string;
    contactInfo: any;
  };
  paymentGateway?: {
    id: number;
    name: string;
    accountNumber: string;
  };
}

export default function PaymentManagement() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const {
    register: registerReject,
    handleSubmit: handleSubmitReject,
    formState: { errors: rejectErrors },
    reset: resetReject,
  } = useForm<RejectPaymentFormData>({
    resolver: zodResolver(rejectPaymentSchema),
  });

  // Fetch all payments
  const { data: paymentsResponse, isLoading } = useQuery({
    queryKey: ['payments', 'admin', filterStatus],
    queryFn: async () => {
      const response = await paymentApi.getAll(filterStatus ? { status: filterStatus } : {});
      return response.data.data as Payment[];
    },
  });

  const payments = paymentsResponse || [];
  const pendingPayments = payments.filter((p) => p.status === 'Pending');

  // Approve payment mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: number; adminNotes?: string }) =>
      paymentApi.approve(id, adminNotes ? { adminNotes } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedPayment(null);
      alert('Payment approved successfully! Project status updated if applicable.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to approve payment');
    },
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: number; adminNotes: string }) =>
      paymentApi.reject(id, { adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowRejectModal(false);
      setSelectedPayment(null);
      resetReject();
      alert('Payment rejected successfully.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to reject payment');
    },
  });

  const handleApprove = (payment: Payment) => {
    if (confirm(`Approve payment of $${Number(payment.amount).toLocaleString()}?`)) {
      approveMutation.mutate({ id: payment.id });
    }
  };

  const handleReject = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRejectModal(true);
  };

  const onSubmitReject = (data: RejectPaymentFormData) => {
    if (selectedPayment) {
      rejectMutation.mutate({ id: selectedPayment.id, adminNotes: data.adminNotes });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Payment Management
          </h1>
          <p className="text-gray-600 mt-1">Review and manage client payments</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && !filterStatus && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">
                {pendingPayments.length} payment(s) pending approval
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">Loading payments...</div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No payments found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {payment.paymentGateway?.name || payment.paymentMethod}
                      </CardTitle>
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </div>
                    <CardDescription>
                      Invoice: {payment.invoice?.invoiceNumber || `#${payment.invoiceId}`} | 
                      Amount: ${Number(payment.amount).toLocaleString()}
                    </CardDescription>
                  </div>
                  {payment.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(payment)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(payment)}
                        disabled={rejectMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold">Amount:</span>
                      <span>${Number(payment.amount).toLocaleString()}</span>
                    </div>
                    {payment.transactionId && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold">Transaction ID:</span>
                        <span>{payment.transactionId}</span>
                      </div>
                    )}
                    {payment.paidBy && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold">Paid From:</span>
                        <span>{payment.paidBy}</span>
                      </div>
                    )}
                    {payment.paymentGateway && (
                      <div>
                        <span className="font-semibold">Gateway Account:</span>
                        <span className="ml-2">{payment.paymentGateway.accountNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {payment.client && (
                      <div>
                        <span className="font-semibold">Client:</span>
                        <span className="ml-2">{payment.client.name}</span>
                        {payment.client.contactInfo?.email && (
                          <span className="ml-2 text-slate-600">({payment.client.contactInfo.email})</span>
                        )}
                      </div>
                    )}
                    {payment.project && (
                      <div>
                        <span className="font-semibold">Project:</span>
                        <span className="ml-2">{payment.project.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold">Submitted:</span>
                      <span>{new Date(payment.createdAt).toLocaleString()}</span>
                    </div>
                    {payment.verifiedAt && (
                      <div>
                        <span className="font-semibold">Verified:</span>
                        <span className="ml-2">{new Date(payment.verifiedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                {payment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Client Notes:</p>
                    <p className="text-sm text-gray-600">{payment.notes}</p>
                  </div>
                )}
                {payment.adminNotes && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Admin Notes:</p>
                    <p className="text-sm text-blue-600">{payment.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Payment</CardTitle>
              <CardDescription>
                Reject payment of ${Number(selectedPayment.amount).toLocaleString()} from {selectedPayment.client?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReject(onSubmitReject)} className="space-y-4">
                <div>
                  <Label htmlFor="adminNotes">Admin Notes *</Label>
                  <textarea
                    id="adminNotes"
                    {...registerReject('adminNotes')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Explain why this payment is being rejected..."
                  />
                  {rejectErrors.adminNotes && (
                    <p className="text-sm text-red-600 mt-1">{rejectErrors.adminNotes.message}</p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedPayment(null);
                      resetReject();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={rejectMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reject Payment
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

