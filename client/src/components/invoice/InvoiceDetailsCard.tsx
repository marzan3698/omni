import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';

interface InvoiceDetailsCardProps {
  issueDate: string;
  dueDate: string;
  notes: string;
  onIssueDateChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  /** Compact inline layout for POS right panel */
  compact?: boolean;
}

export function InvoiceDetailsCard({
  issueDate,
  dueDate,
  notes,
  onIssueDateChange,
  onDueDateChange,
  onNotesChange,
  compact = false,
}: InvoiceDetailsCardProps) {
  return (
    <GameCard index={2} className={compact ? 'p-3' : 'p-4'}>
      <h3 className="text-sm font-semibold text-amber-100 mb-2 uppercase tracking-wider">
        Details
      </h3>
      <div className={cn(
        'gap-3',
        compact ? 'grid grid-cols-1 sm:grid-cols-3 gap-2' : 'grid gap-4 md:grid-cols-2'
      )}>
        <div>
          <Label className="text-amber-100">Issue Date</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => onIssueDateChange(e.target.value)}
            className={cn('mt-1', inputDark)}
          />
        </div>
        <div>
          <Label className="text-amber-100">Due Date</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className={cn('mt-1', inputDark)}
          />
        </div>
        <div className={compact ? '' : 'md:col-span-2'}>
          <Label className="text-amber-100">Notes</Label>
          <Input
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Optional notes"
            className={cn('mt-1', inputDark)}
          />
        </div>
      </div>
    </GameCard>
  );
}
