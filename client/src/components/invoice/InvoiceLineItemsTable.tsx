import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatCurrencyWithSymbol } from '@/lib/utils';
import { cn } from '@/lib/utils';

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: number;
  serviceId?: number;
}

interface InvoiceLineItemsTableProps {
  items: LineItem[];
  onUpdateItem: (index: number, field: keyof LineItem, value: number | string) => void;
  onRemoveItem: (index: number) => void;
}

function getItemBadge(item: LineItem) {
  if (item.productId) return { label: 'Product', className: 'bg-amber-500/30 text-amber-200' };
  if (item.serviceId) return { label: 'Service', className: 'bg-indigo-500/30 text-indigo-200' };
  return { label: 'Custom', className: 'bg-slate-500/30 text-slate-200' };
}

export function InvoiceLineItemsTable({
  items,
  onUpdateItem,
  onRemoveItem,
}: InvoiceLineItemsTableProps) {
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <GameCard index={1} className="p-4">
      <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider">
        Line Items
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-500/20">
              <th className="text-left py-2 text-amber-200/80">Type</th>
              <th className="text-left py-2 text-amber-200/80">Description</th>
              <th className="w-24 text-right py-2 text-amber-200/80">Qty</th>
              <th className="w-32 text-right py-2 text-amber-200/80">Unit Price</th>
              <th className="w-32 text-right py-2 text-amber-200/80">Total</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const badge = getItemBadge(item);
              return (
                <tr key={i} className="border-b border-amber-500/10 animate-game-item-reveal" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                  <td className="py-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded', badge.className)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2">
                    <Input
                      value={item.description}
                      onChange={(e) => onUpdateItem(i, 'description', e.target.value)}
                      placeholder="Item description"
                      className={cn('h-8', inputDark)}
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateItem(i, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className={cn('h-8 text-right', inputDark)}
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        onUpdateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className={cn('h-8 text-right', inputDark)}
                    />
                  </td>
                  <td className="py-2 text-right text-amber-100">
                    {formatCurrencyWithSymbol(item.quantity * item.unitPrice, 'BDT')}
                  </td>
                  <td className="py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(i)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-right font-semibold text-amber-100 text-lg animate-game-glow">
        Total: {formatCurrencyWithSymbol(totalAmount, 'BDT')}
      </div>
    </GameCard>
  );
}
