import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clientApprovalApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Loader2 } from 'lucide-react';

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ক্লায়েন্ট সেটাপ (Client Setup)</h1>
        <p className="text-slate-600 mt-1">
          লিড ম্যানেজার থেকে আসা পেন্ডিং ক্লায়েন্ট রিকোয়েস্ট একটিভ করুন। অ্যাপ্রুভের পর ক্লায়েন্ট লগইন করতে পারবে।
        </p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Pending client requests ({list.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No pending client requests</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Lead</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Points</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Requested by</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((req: PendingRequest) => (
                    <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{req.client?.name ?? '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{req.email ?? (req.client?.contactInfo as any)?.email ?? '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{req.lead?.title ?? '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{req.lead?.product?.name ?? '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{Number(req.customerPoints) ?? 0}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {req.requestedByUser?.name || req.requestedByUser?.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{formatDate(req.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
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
        </CardContent>
      </Card>
    </div>
  );
}
