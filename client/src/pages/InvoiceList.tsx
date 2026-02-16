import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Receipt, Plus, Search, Eye } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';

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
      <div className="p-6 text-slate-600">Please select a company to view invoices.</div>
    );
  }

  return (
    <PermissionGuard permission="can_manage_invoices">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoice List</h1>
            <p className="text-slate-600 mt-1">Manage and view all invoices</p>
          </div>
          <Link to="/invoice/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by invoice number or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-slate-500">Loading invoices...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No invoices found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium">Invoice #</th>
                      <th className="text-left py-3 font-medium">Client</th>
                      <th className="text-right py-3 font-medium">Amount</th>
                      <th className="text-left py-3 font-medium">Status</th>
                      <th className="text-left py-3 font-medium">Due Date</th>
                      <th className="text-right py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-mono">{inv.invoiceNumber}</td>
                        <td className="py-3">{inv.client?.name || '-'}</td>
                        <td className="py-3 text-right">
                          ৳{Number(inv.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              inv.status === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : inv.status === 'Overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 text-right">
                          <Link to={`/invoice/${inv.id}`}>
                            <Button variant="ghost" size="sm">
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
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
