import { useQuery } from '@tanstack/react-query';
import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { paymentGatewayApi } from '@/lib/api';
import { formatCurrencyWithSymbol } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';

export interface PaymentRow {
  id: string;
  paymentGatewayId: number;
  amount: number;
  transactionId: string;
  paidBy?: string;
  notes?: string;
}

interface InvoicePaymentSectionProps {
  totalAmount: number;
  payments: PaymentRow[];
  onPaymentsChange: (payments: PaymentRow[]) => void;
}

export function InvoicePaymentSection({
  totalAmount,
  payments,
  onPaymentsChange,
}: InvoicePaymentSectionProps) {
  const { data: gateways = [] } = useQuery({
    queryKey: ['payment-gateways-active'],
    queryFn: async () => {
      const r = await paymentGatewayApi.getActive();
      return r.data.data || [];
    },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const due = totalAmount - totalPaid;

  const addPayment = () => {
    onPaymentsChange([
      ...payments,
      {
        id: crypto.randomUUID(),
        paymentGatewayId: gateways[0]?.id ?? 0,
        amount: 0,
        transactionId: '',
      },
    ]);
  };

  const removePayment = (id: string) => {
    onPaymentsChange(payments.filter((p) => p.id !== id));
  };

  const updatePayment = (id: string, field: keyof PaymentRow, value: string | number) => {
    onPaymentsChange(
      payments.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  return (
    <GameCard index={3} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-amber-100 uppercase tracking-wider">
          পেমেন্ট / Payment
        </h3>
        <button
          type="button"
          onClick={addPayment}
          disabled={gateways.length === 0}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </button>
      </div>

      {gateways.length === 0 && (
        <p className="text-amber-200/70 text-sm mb-3">
          কোন অ্যাক্টিভ পেমেন্ট গেটওয়ে নেই। পেমেন্ট যোগ করতে সেটিংস থেকে গেটওয়ে যোগ করুন।
        </p>
      )}

      <div className="space-y-3">
        {payments.map((p, i) => (
          <div
            key={p.id}
            className="rounded-lg border border-amber-500/20 bg-slate-800/40 p-3 space-y-2 animate-game-item-reveal"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid gap-2 flex-1 min-w-0 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="text-amber-200/80 text-xs">Gateway *</Label>
                  <select
                    value={p.paymentGatewayId || ''}
                    onChange={(e) =>
                      updatePayment(p.id, 'paymentGatewayId', parseInt(e.target.value) || 0)
                    }
                    className={cn('w-full mt-0.5 px-3 py-2', inputDark)}
                    required
                  >
                    <option value="">Select gateway</option>
                    {gateways.map((g: { id: number; name: string }) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={totalAmount}
                    value={p.amount || ''}
                    onChange={(e) =>
                      updatePayment(p.id, 'amount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className={cn('mt-0.5', inputDark)}
                  />
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Transaction ID *</Label>
                  <Input
                    value={p.transactionId}
                    onChange={(e) =>
                      updatePayment(p.id, 'transactionId', e.target.value)
                    }
                    placeholder="Transaction ID"
                    className={cn('mt-0.5', inputDark)}
                  />
                </div>
                <div>
                  <Label className="text-amber-200/80 text-xs">Paid By</Label>
                  <Input
                    value={p.paidBy || ''}
                    onChange={(e) =>
                      updatePayment(p.id, 'paidBy', e.target.value)
                    }
                    placeholder="Optional (01XXXXXXXXX)"
                    className={cn('mt-0.5', inputDark)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePayment(p.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <Label className="text-amber-200/80 text-xs">Notes</Label>
              <Input
                value={p.notes || ''}
                onChange={(e) => updatePayment(p.id, 'notes', e.target.value)}
                placeholder="Optional notes"
                className={cn('mt-0.5', inputDark)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-amber-200/80">Total Amount</span>
          <span className="text-amber-100 font-medium">
            {formatCurrencyWithSymbol(totalAmount, 'BDT')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-amber-200/80">Total Paid</span>
          <span className="text-amber-100 font-medium">
            {formatCurrencyWithSymbol(totalPaid, 'BDT')}
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold text-amber-100">
          <span>Due</span>
          <span className={due < 0 ? 'text-red-400' : ''}>
            {formatCurrencyWithSymbol(Math.max(0, due), 'BDT')}
          </span>
        </div>
        {totalPaid > totalAmount && (
          <p className="text-red-400 text-xs mt-1">
            Total paid cannot exceed total amount
          </p>
        )}
      </div>
    </GameCard>
  );
}
