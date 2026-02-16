import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi, paymentGatewayApi, paymentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, DollarSign, Calendar, Link as LinkIcon, BadgeCheck, CreditCard, CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const paymentSchema = z.object({
    paymentGatewayId: z.number().int().positive('Payment gateway is required'),
    amount: z.number().positive('Amount must be greater than 0'),
    transactionId: z.string().min(1, 'Transaction ID is required').max(100, 'Transaction ID must be less than 100 characters'),
    paidBy: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh mobile number format (01XXXXXXXXX)').optional().or(z.literal('')),
    notes: z.string().max(5000).optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function InvoiceView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const { data: invoiceResponse, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await invoiceApi.getById(parseInt(id));
            return response.data.data;
        },
        enabled: !!id,
    });

    // Fetch active payment gateways
    const { data: gatewaysResponse } = useQuery({
        queryKey: ['payment-gateways-active'],
        queryFn: async () => {
            const response = await paymentGatewayApi.getActive();
            return response.data.data || [];
        },
    });

    // Fetch payments for this invoice
    const { data: paymentsResponse } = useQuery({
        queryKey: ['payments', 'invoice', id],
        queryFn: async () => {
            if (!id) return [];
            const response = await paymentApi.getByInvoice(parseInt(id));
            return response.data.data || [];
        },
        enabled: !!id,
    });

    const invoice = invoiceResponse;
    const project = invoice?.project;
    const gateways = gatewaysResponse || [];
    const payments = paymentsResponse || [];

    const canRenew = invoice?.project?.service?.durationDays && new Date() >= new Date(invoice.dueDate);

    const renewMutation = useMutation({
        mutationFn: () => invoiceApi.renew(invoice!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoice', id] });
            queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
            alert('Invoice renewed successfully!');
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to renew invoice');
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentGatewayId: 0,
            amount: invoice ? Number(invoice.totalAmount) : 0,
            transactionId: '',
            paidBy: '',
            notes: '',
        },
    });

    const selectedGatewayId = watch('paymentGatewayId');
    const selectedGateway = gateways.find((g: any) => g.id === selectedGatewayId);

    // Calculate total paid amount
    const totalPaid = payments
        .filter((p: any) => p.status === 'Approved')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remainingAmount = invoice ? Number(invoice.totalAmount) - totalPaid : 0;

    // Payment submission mutation
    const paymentMutation = useMutation({
        mutationFn: (data: PaymentFormData) => paymentApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', 'invoice', id] });
            queryClient.invalidateQueries({ queryKey: ['invoice', id] });
            reset();
            setShowPaymentForm(false);
            alert('Payment submitted successfully! Waiting for admin approval.');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to submit payment');
        },
    });

    const onSubmitPayment = (data: PaymentFormData) => {
        if (!invoice) return;
        paymentMutation.mutate({
            invoiceId: invoice.id,
            paymentGatewayId: data.paymentGatewayId,
            amount: data.amount,
            transactionId: data.transactionId,
            paidBy: data.paidBy || undefined,
            notes: data.notes || undefined,
        } as any);
    };

    const getPaymentStatusColor = (status: string) => {
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

    const getPaymentStatusIcon = (status: string) => {
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
                <CardHeader className="border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                O
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Invoice #{invoice.invoiceNumber}</CardTitle>
                                <CardDescription>Issued on {new Date(invoice.issueDate).toLocaleDateString()}</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                <DollarSign className="w-4 h-4 text-indigo-600" />
                                <span className="text-lg font-semibold text-slate-900">৳{Number(invoice.totalAmount).toLocaleString()}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                            </span>
                            {canRenew && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => renewMutation.mutate()}
                                    disabled={renewMutation.isPending}
                                >
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    রিনিউ করুন
                                </Button>
                            )}
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="rounded-lg border border-gray-100 p-4 bg-slate-50">
                                    <h3 className="font-semibold mb-2 text-slate-900">Bill To</h3>
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
                                <div className="rounded-lg border border-gray-100 p-4 bg-slate-50">
                                    <h3 className="font-semibold mb-2 text-slate-900">Invoice Details</h3>
                                    <div className="text-sm text-slate-600 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        {invoice.project && (
                                            <div className="flex items-center gap-2">
                                                <BadgeCheck className="w-4 h-4 text-indigo-600" />
                                                <span>Project: {invoice.project.title}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900">Items</h3>
                                    <span className="text-xs text-slate-500">Service breakdown</span>
                                </div>
                                <div className="border rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left p-3 text-xs font-semibold text-slate-600">Description</th>
                                                <th className="text-right p-3 text-xs font-semibold text-slate-600">Quantity</th>
                                                <th className="text-right p-3 text-xs font-semibold text-slate-600">Unit Price</th>
                                                <th className="text-right p-3 text-xs font-semibold text-slate-600">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-3 text-sm text-slate-800">{item.description}</td>
                                                    <td className="p-3 text-right text-sm text-slate-700">{Number(item.quantity).toLocaleString()}</td>
                                                    <td className="p-3 text-right text-sm text-slate-700">৳{Number(item.unitPrice).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-medium text-slate-900">
                                                        ৳{Number(item.total).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={3} className="p-3 text-right font-semibold text-slate-800">
                                                    Total Amount:
                                                </td>
                                                <td className="p-3 text-right font-bold text-lg text-indigo-700">
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
                                <div className="rounded-lg border border-gray-100 p-4 bg-slate-50">
                                    <h3 className="font-semibold mb-2 text-slate-900">Notes</h3>
                                    <p className="text-sm text-slate-600">{invoice.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {project && (
                                <Card className="shadow-sm border-gray-200">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-sm">Linked Project</CardTitle>
                                                <CardDescription>{project.title}</CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/client/projects')}
                                            >
                                                <LinkIcon className="w-4 h-4 mr-1" />
                                                View Projects
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm text-slate-700 space-y-2">
                                        {project.description && <p className="text-slate-600 line-clamp-3">{project.description}</p>}
                                        {project.service && (
                                            <p>
                                                <span className="font-semibold text-slate-800">Service:</span>{' '}
                                                {project.service.title}
                                            </p>
                                        )}
                                        <p className="text-slate-600">
                                            Budget: ৳{Number(invoice.totalAmount).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Section */}
                            {user?.roleName === 'Client' && invoice.status !== 'Paid' && (
                                <Card className="shadow-sm border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-slate-800 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            Make Payment
                                        </CardTitle>
                                        <CardDescription>
                                            Total: ৳{Number(invoice.totalAmount).toLocaleString()} |
                                            Paid: ৳{totalPaid.toLocaleString()} |
                                            Remaining: ৳{remainingAmount.toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {!showPaymentForm ? (
                                            <div className="space-y-3">
                                                {gateways.length === 0 ? (
                                                    <p className="text-sm text-slate-600">No payment gateways available</p>
                                                ) : (
                                                    <>
                                                        <Button
                                                            onClick={() => setShowPaymentForm(true)}
                                                            className="w-full"
                                                            disabled={remainingAmount <= 0}
                                                        >
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            Submit Payment
                                                        </Button>
                                                        {remainingAmount <= 0 && (
                                                            <p className="text-xs text-green-600 text-center">Invoice fully paid</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit(onSubmitPayment)} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="paymentGatewayId">Payment Gateway *</Label>
                                                    <select
                                                        id="paymentGatewayId"
                                                        {...register('paymentGatewayId', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value="0">Select gateway</option>
                                                        {gateways.map((gateway: any) => (
                                                            <option key={gateway.id} value={gateway.id}>
                                                                {gateway.name} ({gateway.accountNumber})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.paymentGatewayId && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.paymentGatewayId.message}</p>
                                                    )}
                                                </div>

                                                {selectedGateway && selectedGateway.instructions && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                                        <p className="text-xs font-semibold text-blue-900 mb-1">Instructions:</p>
                                                        <p className="text-xs text-blue-800 whitespace-pre-wrap">{selectedGateway.instructions}</p>
                                                    </div>
                                                )}

                                                <div>
                                                    <Label htmlFor="amount">Amount *</Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        step="0.01"
                                                        {...register('amount', { valueAsNumber: true })}
                                                        max={remainingAmount}
                                                    />
                                                    {errors.amount && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">Maximum: ৳{remainingAmount.toLocaleString()}</p>
                                                </div>

                                                <div>
                                                    <Label htmlFor="transactionId">Transaction ID *</Label>
                                                    <Input
                                                        id="transactionId"
                                                        {...register('transactionId')}
                                                        placeholder="Enter transaction ID from payment"
                                                    />
                                                    {errors.transactionId && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.transactionId.message}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor="paidBy">Paid From (Optional)</Label>
                                                    <Input
                                                        id="paidBy"
                                                        {...register('paidBy')}
                                                        placeholder="01XXXXXXXXX"
                                                        maxLength={11}
                                                    />
                                                    {errors.paidBy && (
                                                        <p className="text-sm text-red-600 mt-1">{errors.paidBy.message}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">Your payment account number</p>
                                                </div>

                                                <div>
                                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                                    <textarea
                                                        id="notes"
                                                        {...register('notes')}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        placeholder="Any additional information"
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowPaymentForm(false);
                                                            reset();
                                                        }}
                                                        className="flex-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={paymentMutation.isPending}
                                                        className="flex-1"
                                                    >
                                                        {paymentMutation.isPending ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Submitting...
                                                            </>
                                                        ) : (
                                                            'Submit Payment'
                                                        )}
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment History */}
                            {payments.length > 0 && (
                                <Card className="shadow-sm border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-slate-800">Payment History</CardTitle>
                                        <CardDescription>{payments.length} payment(s) submitted</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {payments.map((payment: any) => (
                                            <div
                                                key={payment.id}
                                                className="border border-gray-200 rounded-lg p-3 space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentStatusIcon(payment.status)}
                                                        <span className="font-semibold text-sm">
                                                            {payment.paymentMethod}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-600 space-y-1">
                                                    <p>Amount: ৳{Number(payment.amount).toLocaleString()}</p>
                                                    {payment.transactionId && (
                                                        <p>Transaction ID: {payment.transactionId}</p>
                                                    )}
                                                    {payment.paidBy && <p>Paid From: {payment.paidBy}</p>}
                                                    {payment.notes && <p>Notes: {payment.notes}</p>}
                                                    {payment.adminNotes && (
                                                        <p className="text-amber-700">Admin: {payment.adminNotes}</p>
                                                    )}
                                                    <p className="text-slate-500">
                                                        {new Date(payment.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="shadow-sm border-gray-200">
                                <CardHeader>
                                    <CardTitle className="text-sm text-slate-800">Timeline</CardTitle>
                                    <CardDescription>Static UI; will be dynamic later</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">Invoice Created</p>
                                            <p className="text-slate-600">
                                                {new Date(invoice.issueDate).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">Accepted</p>
                                            <p className="text-slate-600">Pending (will update when available)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">Paid</p>
                                            <p className="text-slate-600">
                                                {invoice.status === 'Paid' ? 'Completed' : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

