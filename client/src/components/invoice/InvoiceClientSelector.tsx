import { Input } from '@/components/ui/input';
import { GameCard } from '@/components/GameCard';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';

interface InvoiceClientSelectorProps {
  clientId: number | null;
  clientSearch: string;
  onClientSearchChange: (v: string) => void;
  onClientSelect: (client: { id: number; name: string }) => void;
  clients: Array<{ id: number; name: string; contactInfo?: { email?: string } }>;
  compact?: boolean;
}

export function InvoiceClientSelector({
  clientId,
  clientSearch,
  onClientSearchChange,
  onClientSelect,
  clients,
  compact = false,
}: InvoiceClientSelectorProps) {
  return (
    <GameCard index={0} className={compact ? 'p-3' : 'p-4'}>
      <div className={cn('flex gap-3', compact && 'flex-wrap items-end')}>
        <div className={cn('relative', compact ? 'flex-1 min-w-[200px]' : 'w-full')}>
          {!compact && (
            <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider">
              Client
            </h3>
          )}
          <div className={compact ? 'flex items-center gap-2' : ''}>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-amber-400/80" />
              <Input
                placeholder="Search client..."
                value={clientSearch}
                onChange={(e) => onClientSearchChange(e.target.value)}
                className={cn('pl-8', inputDark, compact && 'h-9')}
              />
            </div>
            {compact && clientId && (
              <span className="text-amber-100 text-sm font-medium whitespace-nowrap">
                Selected: {clients.find((c) => c.id === clientId)?.name || '-'}
              </span>
            )}
          </div>
          <div className={cn(
            'border border-amber-500/20 rounded-lg overflow-y-auto bg-slate-800/40',
            compact ? 'max-h-28 mt-1' : 'max-h-40 mt-2'
          )}>
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onClientSelect(c);
                onClientSearchChange(c.name);
              }}
              className={cn(
                'w-full text-left px-3 py-2 hover:bg-amber-500/10 text-amber-100 transition-colors',
                clientId === c.id && 'bg-amber-500/20 border-l-2 border-amber-500'
              )}
            >
              {c.name}
              {c.contactInfo?.email && (
                <span className="text-amber-200/70 text-sm ml-2">
                  ({c.contactInfo.email})
                </span>
              )}
            </button>
          ))}
          </div>
        </div>
        {compact && <div className="flex-1 min-w-0" />}
      </div>
    </GameCard>
  );
}
