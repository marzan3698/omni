import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi, paymentGatewayApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface AddPaymentToProjectModalProps {
  projectId: number;
  invoices: Array<{ id: number; invoiceNumber: string; totalAmount: number; status: string }>;
  onClose: () => void;
}

export function AddPaymentToProjectModal({ projectId, invoices, onClose }: AddPaymentToProjectModalProps) {
  const queryClient = useQueryClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentGatewayId, setPaymentGatewayId] = useState<number>(0);
  const [transactionId, setTransactionId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [notes, setNotes] = useState('');

  const { data: gateways = [] } = useQuery({
    queryKey: ['payment-gateways-active'],
    queryFn: async () => {
      const r = await paymentGatewayApi.getActive();
      return r.data.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => paymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      onClose();
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to add payment'),
  });

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !paymentGatewayId || !amount || parseFloat(amount) <= 0 || !transactionId.trim()) {
      alert('Please fill all required fields (invoice, gateway, amount, transaction ID)');
      return;
    }
    mutation.mutate({
      invoiceId: selectedInvoiceId,
      paymentGatewayId,
      amount: parseFloat(amount),
      transactionId: transactionId.trim(),
      paidBy: paidBy.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const unpaidInvoices = invoices.filter((i) => i.status !== 'Paid');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Add Payment</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invoice *</label>
            <select
              value={selectedInvoiceId ?? ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedInvoiceId(id || null);
                const inv = invoices.find((i) => i.id === id);
                if (inv) setAmount(String(inv.totalAmount));
              }}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select invoice</option>
              {unpaidInvoices.length > 0 ? (
                unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - ৳{Number(inv.totalAmount).toLocaleString()}
                  </option>
                ))
              ) : (
                invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - ৳{Number(inv.totalAmount).toLocaleString()} ({inv.status})
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Gateway *</label>
            <select
              value={paymentGatewayId}
              onChange={(e) => setPaymentGatewayId(parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value={0}>Select gateway</option>
              {gateways.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={selectedInvoice ? `Max: ৳${Number(selectedInvoice.totalAmount).toLocaleString()}` : ''}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transaction ID *</label>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paid By</label>
            <Input value={paidBy} onChange={(e) => setPaidBy(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
