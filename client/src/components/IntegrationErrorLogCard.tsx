import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export function IntegrationErrorLogCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['integration-webhook-log'],
    queryFn: () => adminApi.getIntegrationWebhookLog({ limit: 30 }),
    refetchInterval: 10000,
  });

  const items = data?.data?.items ?? [];

  if (isError) return null;

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-amber-200/90 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Webhook Error Log
      </span>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400 py-4">No webhook events yet</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item: any) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-lg border text-xs ${
                item.success
                  ? 'bg-slate-800/30 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {item.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                )}
                <span className="font-medium text-amber-200 truncate">
                  {item.integration?.displayName || item.integration?.pageId || 'Unknown'}
                </span>
                <span className="text-slate-500 ml-auto flex-shrink-0">
                  {formatTimeAgo(item.createdAt)}
                </span>
              </div>
              {!item.success && item.errorMessage && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-red-300 hover:text-red-200">
                    {item.errorMessage.length > 80
                      ? item.errorMessage.substring(0, 80) + '...'
                      : item.errorMessage}
                  </summary>
                  <pre className="mt-1 p-2 rounded bg-slate-900/60 text-[10px] overflow-x-auto whitespace-pre-wrap break-words">
                    {item.errorMessage}
                  </pre>
                  {item.payloadSnippet && (
                    <pre className="mt-1 p-2 rounded bg-slate-900/60 text-[10px] overflow-x-auto whitespace-pre-wrap break-words">
                      Payload: {item.payloadSnippet}
                    </pre>
                  )}
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
