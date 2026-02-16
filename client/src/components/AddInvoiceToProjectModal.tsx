import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X } from 'lucide-react';

interface AddInvoiceToProjectModalProps {
  projectId: number;
  clientName?: string;
  onClose: () => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function AddInvoiceToProjectModal({ projectId, clientName, onClose }: AddInvoiceToProjectModalProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => financeApi.invoices.createFromProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      onClose();
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to create invoice'),
  });

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const validItems = items.filter((i) => i.description.trim() && i.quantity > 0 && i.unitPrice >= 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validItems.length === 0) {
      alert('Add at least one valid item');
      return;
    }
    mutation.mutate({
      projectId,
      items: validItems.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Add Invoice</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {clientName && (
            <p className="text-sm text-slate-600">
              Client: <span className="font-medium">{clientName}</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date</label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Line Items</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2">
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
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
          <p className="font-medium">Total: ৳{total.toLocaleString()}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || validItems.length === 0}>
              {mutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
