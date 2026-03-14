import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { Button } from '@/components/ui/button';
import { clientApprovalApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingRequest {
  id: number;
  email: string;
  customerPoints: number;
  status: string;
  createdAt: string;
  client: {
    id: number;
    name: string;
    contactInfo?: { email?: string; phone?: string };
    address?: string;
    status: string;
  };
  lead: {
    id: number;
    title: string;
    customerName?: string;
    phone?: string;
    product?: {
      id: number;
      name: string;
      customerPoint?: number;
    };
  };
  requestedByUser: {
    id: string;
    email: string;
    name?: string;
  };
}

export function PendingClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['client-approvals-pending'],
    queryFn: async () => {
      const res = await clientApprovalApi.getPending();
      if (!res.data.success) throw new Error(res.data.message);
      return (res.data.data as PendingRequest[]) || [];
    },
    enabled: !!user?.companyId,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => clientApprovalApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-approvals-pending'] });
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm">ক্লায়েন্ট সেটাপ (Client Setup)</h1>
        <p className="text-amber-200/80 mt-1">
          লিড ম্যানেজার থেকে আসা পেন্ডিং ক্লায়েন্ট রিকোয়েস্ট একটিভ করুন। অ্যাপ্রুভের পর ক্লায়েন্ট লগইন করতে পারবে।
        </p>
      </div>

      <DashboardWidgetCard>
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-amber-100">Pending client requests ({list.length})</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-amber-500/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-amber-500/50">No pending client requests</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Client</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Lead</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Product</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider text-center">Points</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Requested by</th>
                    <th className="text-left py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Date</th>
                    <th className="text-right py-4 px-4 font-bold text-amber-200/90 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {list.map((req: PendingRequest) => (
                    <tr key={req.id} className="group hover:bg-amber-500/5 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">{req.client?.name ?? '-'}</td>
                      <td className="py-4 px-4 text-amber-100/80">{req.email ?? (req.client?.contactInfo as any)?.email ?? '-'}</td>
                      <td className="py-4 px-4 text-amber-100/80">{req.lead?.title ?? '-'}</td>
                      <td className="py-4 px-4 text-amber-500 font-medium">{req.lead?.product?.name ?? '-'}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20 font-bold">
                          {Number(req.customerPoints) ?? 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-amber-100/80">
                        <span className="text-xs opacity-60 block">By:</span>
                        {req.requestedByUser?.name || req.requestedByUser?.email || '-'}
                      </td>
                      <td className="py-4 px-4 text-amber-100/60 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(req.id)}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardWidgetCard>
    </div>
  );
}
