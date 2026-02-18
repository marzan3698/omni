import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Calendar, RefreshCw, Loader2 } from 'lucide-react';

export function ClientInvoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const renewMutation = useMutation({
    mutationFn: (id: number) => invoiceApi.renew(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
      alert('Invoice renewed successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to renew invoice');
    },
  });

  const canRenew = (invoice: any) => {
    if (!invoice.project?.service?.durationDays) return false;
    return new Date() >= new Date(invoice.dueDate);
  };

  const { data: invoicesResponse, isLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: async () => {
      const response = await invoiceApi.getClientInvoices();
      return response.data.data || [];
    },
  });

  const invoices = invoicesResponse || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-500/30 text-green-300';
      case 'Unpaid':
        return 'bg-amber-500/30 text-amber-300';
      case 'Overdue':
        return 'bg-red-500/30 text-red-300';
      default:
        return 'bg-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-100">Invoices</h1>
        <p className="text-slate-300 mt-1">View your project invoices</p>
      </div>

      <div className="game-card-border rounded-xl p-6 bg-slate-800/60 border border-amber-500/30">
        <h2 className="text-lg font-semibold text-amber-100 mb-4">All Invoices ({invoices.length})</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
            <p className="text-slate-400 mt-2">Loading...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No invoices yet</div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice: any) => (
              <div
                key={invoice.id}
                className="border border-amber-500/20 rounded-lg p-6 hover:border-amber-500/40 transition-colors bg-slate-800/40"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-amber-100">
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    {invoice.project && (
                      <p className="text-sm text-slate-400 mb-2">
                        Project: {invoice.project.title}
                      </p>
                    )}
                    <div className="flex gap-6 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-amber-400">
                          ৳{Number(invoice.totalAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500/70" />
                        <span className="text-slate-400">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canRenew(invoice) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => renewMutation.mutate(invoice.id)}
                        disabled={renewMutation.isPending}
                        className="border border-amber-500/50 bg-slate-800/60 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        রিনিউ
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => navigate(`/client/invoices/${invoice.id}`)}
                      className="border border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
