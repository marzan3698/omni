import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, DollarSign, Calendar } from 'lucide-react';

export function InvoiceView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: invoiceResponse, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await invoiceApi.getById(parseInt(id));
            return response.data.data;
        },
        enabled: !!id,
    });

    const invoice = invoiceResponse;

    if (isLoading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!invoice) {
        return <div className="text-center py-8">Invoice not found</div>;
    }

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
            <Button variant="ghost" onClick={() => navigate('/client/invoices')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
            </Button>

            <Card className="shadow-sm border-gray-200">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Invoice #{invoice.invoiceNumber}</CardTitle>
                            <CardDescription>
                                Issued on {new Date(invoice.issueDate).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                            </Button>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Bill To</h3>
                            <p className="text-sm text-slate-600">
                                {invoice.client?.name || 'N/A'}
                                <br />
                                {invoice.client?.contactInfo && typeof invoice.client.contactInfo === 'object' && (
                                    <>
                                        {invoice.client.contactInfo.email && (
                                            <>
                                                {invoice.client.contactInfo.email}
                                                <br />
                                            </>
                                        )}
                                        {invoice.client.contactInfo.phone && invoice.client.contactInfo.phone}
                                    </>
                                )}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Invoice Details</h3>
                            <div className="text-sm text-slate-600 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                </div>
                                {invoice.project && (
                                    <div>
                                        <span className="font-medium">Project: </span>
                                        {invoice.project.title}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Items</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium">Description</th>
                                        <th className="text-right p-3 text-sm font-medium">Quantity</th>
                                        <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                                        <th className="text-right p-3 text-sm font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items?.map((item: any, idx: number) => (
                                        <tr key={idx} className="border-t">
                                            <td className="p-3">{item.description}</td>
                                            <td className="p-3 text-right">{Number(item.quantity).toLocaleString()}</td>
                                            <td className="p-3 text-right">${Number(item.unitPrice).toLocaleString()}</td>
                                            <td className="p-3 text-right font-medium">
                                                ${Number(item.total).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right font-semibold">
                                            Total Amount:
                                        </td>
                                        <td className="p-3 text-right font-bold text-lg">
                                            <div className="flex items-center justify-end gap-2">
                                                <DollarSign className="w-5 h-5" />
                                                {Number(invoice.totalAmount).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div>
                            <h3 className="font-semibold mb-2">Notes</h3>
                            <p className="text-sm text-slate-600">{invoice.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

