import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Calendar } from 'lucide-react';

export function ClientInvoices() {
  const navigate = useNavigate();

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
        return 'bg-green-100 text-green-700';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
        <p className="text-slate-600 mt-1">View your project invoices</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No invoices yet</div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Invoice #{invoice.invoiceNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      {invoice.project && (
                        <p className="text-sm text-slate-600 mb-2">
                          Project: {invoice.project.title}
                        </p>
                      )}
                      <div className="flex gap-6 text-sm mt-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-indigo-600">
                            ৳{Number(invoice.totalAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/client/invoices/${invoice.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

