import { useQuery } from '@tanstack/react-query';
import { socialApi } from '@/lib/social';
import { integrationApi } from '@/lib/integration';
import { MessageSquare, Loader2, Facebook, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function LiveMessagesCard() {
  const [integrationFilter, setIntegrationFilter] = useState<number | ''>('');

  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.getIntegrations(),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recent-messages', integrationFilter],
    queryFn: () =>
      socialApi.getRecentMessages({
        limit: 20,
        integrationId: integrationFilter === '' ? undefined : Number(integrationFilter),
      }),
    refetchInterval: 5000,
  });

  const messages = data?.messages ?? [];

  if (isError) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-amber-200/90 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          Live Messages
        </span>
        <select
          value={integrationFilter}
          onChange={(e) =>
            setIntegrationFilter(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="text-xs rounded-md border border-amber-500/30 bg-slate-800/60 text-amber-100 px-2 py-1.5 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All integrations</option>
          {integrations?.map((i) => (
            <option key={i.id} value={i.id}>
              {i.displayName || i.pageId} ({i.provider})
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-xs text-slate-400 py-4">No recent messages</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {messages.map((m) => (
            <Link
              key={m.id}
              to={`/inbox?conversation=${m.conversation.id}`}
              className="block p-2.5 rounded-lg bg-slate-800/40 border border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                {m.conversation.platform === 'facebook' ? (
                  <Facebook className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                ) : (
                  <MessageCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-amber-300 truncate">
                  {m.integrationDisplayName}
                </span>
                <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
                  {formatTimeAgo(m.createdAt)}
                </span>
              </div>
              <p className="text-sm text-slate-200 line-clamp-2">{m.content}</p>
            </Link>
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
