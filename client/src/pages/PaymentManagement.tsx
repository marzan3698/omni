import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  User, 
  Calendar,
  Search,
  ChevronDown
} from 'lucide-react';
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
      alert('Payment approved successfully!');
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
    if (confirm(`Approve payment of ৳${Number(payment.amount).toLocaleString()}?`)) {
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-amber-500" />
            Payment Management
          </h1>
          <p className="text-amber-200/80 mt-1">Review and manage client payments</p>
        </div>
        <div className="relative w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-48 px-4 py-2 bg-slate-900/50 border border-amber-500/20 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Status</option>
            <option value="Pending" className="bg-slate-900">Pending</option>
            <option value="Approved" className="bg-slate-900">Approved</option>
            <option value="Rejected" className="bg-slate-900">Rejected</option>
            <option value="Cancelled" className="bg-slate-900">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
        </div>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && !filterStatus && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 animate-pulse">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="w-5 h-5" />
            <span className="font-bold">
              {pendingPayments.length} payment(s) pending approval
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-amber-200/60 animate-pulse">Loading payments...</div>
      ) : payments.length === 0 ? (
        <DashboardWidgetCard index={0} className="py-12 text-center text-amber-200/40">
          No payments found
        </DashboardWidgetCard>
      ) : (
        <div className="grid gap-6">
          {payments.map((payment, idx) => (
            <DashboardWidgetCard key={payment.id} index={idx} className="group">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-amber-100">
                      {payment.paymentGateway?.name || payment.paymentMethod}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(payment.status)} animate-game-score-pop`}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-amber-200/60">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500/50" />
                      <span className="text-amber-100/40 uppercase tracking-wider text-[10px] font-bold">Invoice:</span>
                      <span className="text-amber-400 font-mono">
                        {payment.invoice?.invoiceNumber || `#${payment.invoiceId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500/50" />
                      <span className="text-amber-100/40 uppercase tracking-wider text-[10px] font-bold">Amount:</span>
                      <span className="text-emerald-400 font-bold">
                        ৳{Number(payment.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {payment.status === 'Pending' && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(payment)}
                      disabled={approveMutation.isPending}
                      className="flex-1 md:flex-none bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(payment)}
                      disabled={rejectMutation.isPending}
                      className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500 border-red-500/30 text-red-400 hover:text-white transition-all font-bold"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-amber-500/10 grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  {payment.transactionId && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-amber-500/5">
                      <span className="text-amber-200/40">Transaction ID</span>
                      <span className="text-amber-100 font-mono">{payment.transactionId}</span>
                    </div>
                  )}
                  {payment.paidBy && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-amber-500/5">
                      <span className="text-amber-200/40">Paid From</span>
                      <span className="text-amber-100">{payment.paidBy}</span>
                    </div>
                  )}
                  {payment.paymentGateway && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-amber-500/5">
                      <span className="text-amber-200/40">Gateway Account</span>
                      <span className="text-amber-100">{payment.paymentGateway.accountNumber}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {payment.client && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-amber-500/5">
                      <span className="text-amber-200/40">Client</span>
                      <div className="text-right text-amber-100">
                        <div>{payment.client.name}</div>
                        {payment.client.contactInfo?.email && (
                          <div className="text-[10px] text-amber-500/50">{payment.client.contactInfo.email}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {payment.project && (
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-amber-500/5">
                      <span className="text-amber-200/40">Project</span>
                      <span className="text-amber-100">{payment.project.title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-amber-500/5">
                    <span className="text-amber-200/40">Submitted</span>
                    <span className="text-amber-100">{new Date(payment.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {(payment.notes || payment.adminNotes) && (
                <div className="mt-4 grid gap-3">
                  {payment.notes && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs leading-relaxed">
                      <span className="text-amber-500/60 font-bold uppercase tracking-wider block mb-1">Client Notes</span>
                      <p className="text-amber-200/80">{payment.notes}</p>
                    </div>
                  )}
                  {payment.adminNotes && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs leading-relaxed">
                      <span className="text-blue-400/60 font-bold uppercase tracking-wider block mb-1">Admin Notes</span>
                      <p className="text-blue-200/80">{payment.adminNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </DashboardWidgetCard>
          ))}
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <DashboardWidgetCard index={0} className="w-full max-w-md animate-game-item-reveal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-amber-100">Reject Payment</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowRejectModal(false)}
                className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              >
                <XCircle className="w-6 h-6" />
              </Button>
            </div>
            
            <p className="text-amber-200/60 text-sm mb-6">
              Confirming rejection of <span className="text-amber-100 font-bold">৳{Number(selectedPayment.amount).toLocaleString()}</span> from {selectedPayment.client?.name}.
            </p>

            <form onSubmit={handleSubmitReject(onSubmitReject)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adminNotes" className="text-amber-200/80 font-bold uppercase tracking-wider text-[10px]">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="adminNotes"
                  {...registerReject('adminNotes')}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-amber-500/20 rounded-lg text-amber-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                  placeholder="Explain why this payment is being rejected..."
                />
                {rejectErrors.adminNotes && (
                  <p className="text-xs text-red-400 mt-1">{rejectErrors.adminNotes.message}</p>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedPayment(null);
                    resetReject();
                  }}
                  className="flex-1 bg-slate-800 border-amber-500/20 text-amber-200/60 hover:text-amber-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {rejectMutation.isPending ? 'Processing...' : 'Reject Payment'}
                </Button>
              </div>
            </form>
          </DashboardWidgetCard>
        </div>
      )}
    </div>
  );
}
