import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { cn } from '@/lib/utils';

export function InvoiceList() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: invoicesResponse, isLoading } = useQuery({
    queryKey: ['invoices', user?.companyId, statusFilter],
    queryFn: async () => {
      const response = await financeApi.invoices.getAll(user!.companyId!, {
        status: statusFilter || undefined,
      });
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const invoices = invoicesResponse || [];
  const filtered = searchTerm
    ? invoices.filter(
        (inv: any) =>
          inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoices;

  if (!user?.companyId) {
    return (
      <div className="p-6 text-amber-200/60">Please select a company to view invoices.</div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_invoices">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm">Invoice List</h1>
            <p className="text-amber-200/80 mt-1">Manage and view all invoices</p>
          </div>
          <Link to="/invoice/new">
            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border-b-2 border-amber-700 shadow-lg shadow-amber-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        <DashboardWidgetCard>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500/50 w-4 h-4" />
                <Input
                  placeholder="Search by invoice number or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-500/30 focus:ring-amber-500/40"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900/50 border border-amber-500/20 rounded-md px-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="" className="bg-slate-900 text-amber-100">All Status</option>
                <option value="Unpaid" className="bg-slate-900 text-amber-100">Unpaid</option>
                <option value="Paid" className="bg-slate-900 text-amber-100">Paid</option>
                <option value="Overdue" className="bg-slate-900 text-amber-100">Overdue</option>
              </select>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-amber-500/50">Loading invoices...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-amber-500/50">No invoices found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-500/10">
                      <th className="text-left py-4 px-2 font-bold text-amber-200/90 uppercase tracking-wider">Invoice #</th>
                      <th className="text-left py-4 px-2 font-bold text-amber-200/90 uppercase tracking-wider">Client</th>
                      <th className="text-right py-4 px-2 font-bold text-amber-200/90 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-4 px-2 font-bold text-amber-200/90 uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-2 font-bold text-amber-200/90 uppercase tracking-wider">Due Date</th>
                      <th className="text-right py-4 px-2 font-bold text-amber-200/90 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {filtered.map((inv: any) => (
                      <tr key={inv.id} className="group hover:bg-amber-500/5 transition-colors">
                        <td className="py-4 px-2 font-mono text-amber-400 font-bold">{inv.invoiceNumber}</td>
                        <td className="py-4 px-2 text-white font-medium">{inv.client?.name || '-'}</td>
                        <td className="py-4 px-2 text-right text-white font-bold">
                          ৳{Number(inv.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-2">
                          <span
                            className={cn(
                              "px-2 py-1 rounded border font-bold text-[10px] uppercase tracking-tighter",
                              inv.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : inv.status === 'Overdue'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            )}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-amber-100/60 font-medium">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Link to={`/invoice/${inv.id}`}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-amber-400 hover:text-amber-100 hover:bg-amber-500/20"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
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
    </PermissionGuard>
  );
}
