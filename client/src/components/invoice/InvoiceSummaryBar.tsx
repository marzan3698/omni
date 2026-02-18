import { formatCurrencyWithSymbol } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InvoiceSummaryBarProps {
  totalAmount: number;
  totalPaid: number;
  due: number;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  onIssueDateChange?: (v: string) => void;
  onDueDateChange?: (v: string) => void;
  onNotesChange?: (v: string) => void;
}

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg text-sm';

export function InvoiceSummaryBar({
  totalAmount,
  totalPaid,
  due,
  issueDate,
  dueDate,
  notes,
  onIssueDateChange,
  onDueDateChange,
  onNotesChange,
}: InvoiceSummaryBarProps) {
  const hasDetails = issueDate !== undefined && dueDate !== undefined;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-800/60 border border-amber-500/20">
      {hasDetails && (
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-amber-200/70 text-xs block">Issue</span>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => onIssueDateChange?.(e.target.value)}
              className={cn('mt-0.5 px-2 py-1.5 rounded', inputDark)}
            />
          </div>
          <div>
            <span className="text-amber-200/70 text-xs block">Due</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => onDueDateChange?.(e.target.value)}
              className={cn('mt-0.5 px-2 py-1.5 rounded', inputDark)}
            />
          </div>
          {notes !== undefined && (
            <div className="min-w-[120px]">
              <span className="text-amber-200/70 text-xs block">Notes</span>
              <input
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Notes"
                className={cn('mt-0.5 px-2 py-1.5 rounded w-full', inputDark)}
              />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <span className="text-amber-200/70 text-xs block">Total</span>
          <span className="text-amber-100 font-bold text-lg">
            {formatCurrencyWithSymbol(totalAmount, 'BDT')}
          </span>
        </div>
        <div>
          <span className="text-amber-200/70 text-xs block">Paid</span>
          <span className="text-emerald-400 font-bold text-lg">
            {formatCurrencyWithSymbol(totalPaid, 'BDT')}
          </span>
        </div>
        <div>
          <span className="text-amber-200/70 text-xs block">Due</span>
          <span className={cn('font-bold text-lg', due < 0 ? 'text-red-400' : 'text-amber-100')}>
            {formatCurrencyWithSymbol(Math.max(0, due), 'BDT')}
          </span>
        </div>
      </div>
    </div>
  );
}
