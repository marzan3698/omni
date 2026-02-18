import { useMemo } from 'react';
import { GameCard } from '@/components/GameCard';
import { FileText, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type TimelineEvent =
  | {
      id: string;
      type: 'invoice';
      date: string;
      invoiceNumber: string;
      amount: number;
      status: string;
    }
  | {
      id: string;
      type: 'campaign';
      date: string;
      name: string;
      campaignType: string;
      budget: number;
      isActive: boolean;
    };

interface ClientJourneyTimelineProps {
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    issueDate: string;
    totalAmount: number;
    status: string;
  }>;
  campaigns: Array<{
    id: number;
    name: string;
    startDate: string;
    budget: number;
    type: string;
    isActive: boolean;
  }>;
}

function formatTimelineDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ClientJourneyTimeline({ invoices, campaigns }: ClientJourneyTimelineProps) {
  const events: TimelineEvent[] = useMemo(() => [
    ...invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      type: 'invoice' as const,
      date: inv.issueDate,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.totalAmount),
      status: inv.status,
    })),
    ...campaigns.map((c) => ({
      id: `camp-${c.id}`,
      type: 'campaign' as const,
      date: c.startDate,
      name: c.name,
      campaignType: c.type,
      budget: Number(c.budget),
      isActive: c.isActive,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [invoices, campaigns]);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-amber-200/60">
        No timeline events yet. Invoices and campaigns will appear here.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 timeline-line-track overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-full timeline-line-fill" />
      </div>

      <div className="space-y-0">
        {events.map((event, idx) => (
          <div
            key={event.id}
            className="relative pl-14 pb-8 last:pb-0 flex items-start gap-4 animate-timeline-reveal"
            style={{
              animationDelay: `${idx * 100}ms`,
              animationFillMode: 'both',
            }}
          >
            {/* Node */}
            <div
              className={cn(
                'absolute left-2.5 w-5 h-5 rounded-full border-2 border-amber-500/70 bg-slate-900 z-10 timeline-node',
                event.type === 'invoice' ? 'timeline-node-invoice' : 'timeline-node-campaign'
              )}
            />

            {/* Card */}
            <GameCard index={idx} className="flex-1 p-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  {event.type === 'invoice' ? (
                    <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <Target className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-amber-200/60">{formatTimelineDate(event.date)}</p>
                    {event.type === 'invoice' ? (
                      <h4 className="font-semibold text-amber-100">
                        Invoice #{event.invoiceNumber}
                      </h4>
                    ) : (
                      <h4 className="font-semibold text-amber-100">{event.name}</h4>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.type === 'invoice' ? (
                    <>
                      <span className="text-amber-400 font-medium">
                        {formatCurrency(event.amount)}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium border',
                          event.status === 'Paid' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                          event.status === 'Unpaid' && 'bg-amber-500/20 text-amber-200 border-amber-500/40',
                          event.status === 'Overdue' && 'bg-red-500/20 text-red-300 border-red-500/40',
                          !['Paid', 'Unpaid', 'Overdue'].includes(event.status) &&
                            'bg-slate-700/60 text-amber-200/80 border-amber-500/20'
                        )}
                      >
                        {event.status}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-400 font-medium">
                        {formatCurrency(event.budget)}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium border',
                          event.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-700/60 text-amber-200/80 border-amber-500/20'
                        )}
                      >
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {event.type === 'campaign' && (
                <p className="text-xs text-amber-200/70 mt-1 capitalize">{event.campaignType}</p>
              )}
            </GameCard>
          </div>
        ))}
      </div>
    </div>
  );
}
