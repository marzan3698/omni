import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { integrationApi, type CreateIntegrationData } from '@/lib/integration';
import { Check, Loader2, MessageSquare, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Removed integrationSchema - only Chatwoot is used now

const chatwootSchema = z.object({
  provider: z.literal('chatwoot'),
  pageId: z.string().min(1, 'Inbox ID is required'),
  accessToken: z.string().min(1, 'API Access Token is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  baseUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  webhookMode: z.enum(['local', 'live']).optional(),
  isWebhookActive: z.boolean().optional(),
});

type ChatwootFormData = z.infer<typeof chatwootSchema>;

// Chatwoot Integration Form Component
function ChatwootIntegrationForm({
  integration,
  onSave,
}: {
  integration?: CreateIntegrationData & { id?: number; updatedAt?: string; webhookMode?: 'local' | 'live' | null; isWebhookActive?: boolean | null };
  onSave: () => void;
}) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChatwootFormData>({
    resolver: zodResolver(chatwootSchema),
    defaultValues: {
      provider: 'chatwoot',
      pageId: integration?.pageId || '',
      accessToken: integration?.accessToken || '',
      accountId: integration?.accountId || '',
      baseUrl: integration?.baseUrl || 'https://app.chatwoot.com',
      isActive: integration?.isActive ?? true,
      webhookMode: (integration?.webhookMode as 'local' | 'live') || 'local',
      isWebhookActive: integration?.isWebhookActive ?? false,
    },
  });

  useEffect(() => {
    if (integration) {
      reset({
        provider: 'chatwoot',
        pageId: integration.pageId,
        accessToken: integration.accessToken,
        accountId: integration.accountId || '',
        baseUrl: integration.baseUrl || 'https://app.chatwoot.com',
        isActive: integration.isActive ?? true,
        webhookMode: (integration.webhookMode as 'local' | 'live') || 'local',
        isWebhookActive: integration.isWebhookActive ?? false,
      });
    }
  }, [integration, reset]);

  // Fetch webhook URL when integration or webhook mode changes
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      if (integration?.id) {
        try {
          const url = await integrationApi.getChatwootWebhookUrl(integration.id);
          setWebhookUrl(url);
        } catch (error) {
          console.error('Error fetching webhook URL:', error);
        }
      }
    };
    fetchWebhookUrl();
  }, [integration?.id, integration?.webhookMode]);

  const saveIntegrationMutation = useMutation({
    mutationFn: (data: CreateIntegrationData) => integrationApi.upsertIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      onSave();
      alert('Chatwoot integration saved successfully!');
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to save integration');
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => integrationApi.syncChatwootConversations(integration?.id),
    onSuccess: (data) => {
      setSyncStatus(`Synced ${data.synced || 0} conversations successfully!`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => setSyncStatus(null), 5000);
    },
    onError: (error: any) => {
      setSyncStatus(`Sync failed: ${error.message}`);
      setTimeout(() => setSyncStatus(null), 5000);
    },
    onSettled: () => {
      setSyncing(false);
    },
  });

  const onSubmit = (data: ChatwootFormData) => {
    // Note: The backend will automatically disable other integrations when this one is enabled
    // Ensure provider is set (it's required in schema but TypeScript sees it as optional)
    const integrationData: CreateIntegrationData = {
      ...data,
      provider: 'chatwoot', // Explicitly set since it's a literal type
    };
    saveIntegrationMutation.mutate(integrationData);
  };

  const handleSync = () => {
    if (!integration?.id) {
      alert('Please save the integration first before syncing');
      return;
    }
    setSyncing(true);
    setSyncStatus(null);
    syncMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Base URL */}
      <div>
        <label htmlFor="chatwoot-baseUrl" className="block text-sm font-medium text-slate-700 mb-2">
          Chatwoot Base URL
        </label>
        <Input
          id="chatwoot-baseUrl"
          type="text"
          placeholder="https://app.chatwoot.com"
          {...register('baseUrl')}
          className={errors.baseUrl ? 'border-red-500' : ''}
        />
        {errors.baseUrl && (
          <p className="text-sm text-red-500 mt-1">{errors.baseUrl.message}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Leave empty for Chatwoot Cloud. For self-hosted, enter your Chatwoot URL.
        </p>
      </div>

      {/* Account ID */}
      <div>
        <label htmlFor="chatwoot-accountId" className="block text-sm font-medium text-slate-700 mb-2">
          Account ID <span className="text-red-500">*</span>
        </label>
        <Input
          id="chatwoot-accountId"
          type="text"
          placeholder="Enter your Chatwoot Account ID"
          {...register('accountId')}
          className={errors.accountId ? 'border-red-500' : ''}
        />
        {errors.accountId && (
          <p className="text-sm text-red-500 mt-1">{errors.accountId.message}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Find your Account ID in Chatwoot Settings → Account Settings
        </p>
      </div>

      {/* Inbox ID */}
      <div>
        <label htmlFor="chatwoot-pageId" className="block text-sm font-medium text-slate-700 mb-2">
          Inbox ID <span className="text-red-500">*</span>
        </label>
        <Input
          id="chatwoot-pageId"
          type="text"
          placeholder="Enter your Chatwoot Inbox ID"
          {...register('pageId')}
          className={errors.pageId ? 'border-red-500' : ''}
        />
        {errors.pageId && (
          <p className="text-sm text-red-500 mt-1">{errors.pageId.message}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Find your Inbox ID in Chatwoot Settings → Inboxes
        </p>
      </div>

      {/* API Access Token */}
      <div>
        <label
          htmlFor="chatwoot-accessToken"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          API Access Token <span className="text-red-500">*</span>
        </label>
        <Input
          id="chatwoot-accessToken"
          type="password"
          placeholder="Enter your Chatwoot API Access Token"
          {...register('accessToken')}
          className={errors.accessToken ? 'border-red-500' : ''}
        />
        {errors.accessToken && (
          <p className="text-sm text-red-500 mt-1">{errors.accessToken.message}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Generate an API Access Token from Chatwoot Settings → API Tokens
        </p>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="chatwoot-isActive"
          {...register('isActive')}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="chatwoot-isActive" className="text-sm font-medium text-slate-700">
          Active Integration
        </label>
      </div>

      {/* Webhook Configuration Section */}
      <div className="p-4 bg-purple-50 rounded-md border border-purple-200 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-purple-900 mb-3">Webhook Configuration</h3>
          <p className="text-xs text-purple-700 mb-4">
            Enable webhooks to automatically sync messages from Chatwoot in real-time
          </p>
        </div>

        {/* Webhook Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Webhook Mode
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="local"
                {...register('webhookMode')}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700">Local Server</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="live"
                {...register('webhookMode')}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700">Live Server</span>
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Local: Use ngrok for development. Live: Use your production domain.
          </p>
        </div>

        {/* Webhook Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="chatwoot-isWebhookActive"
            {...register('isWebhookActive')}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="chatwoot-isWebhookActive" className="text-sm font-medium text-slate-700">
            Enable Webhook (Live/Test Mode)
          </label>
        </div>

        {/* Webhook URL Display */}
        {integration?.id && webhookUrl && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Webhook URL
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Copy this URL and add it in Chatwoot Settings → Integrations → Webhooks
            </p>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="flex-1 bg-white font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(webhookUrl);
                    setWebhookUrlCopied(true);
                    setTimeout(() => setWebhookUrlCopied(false), 2000);
                  } catch (error) {
                    console.error('Failed to copy:', error);
                  }
                }}
                className="flex items-center gap-2"
              >
                {webhookUrlCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-purple-700 mt-2">
              Subscribe to <code className="bg-purple-100 px-1 rounded">message_created</code> event in Chatwoot
            </p>
          </div>
        )}

        {/* Webhook Status */}
        {integration && (
          <div className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
            <span className="text-xs text-slate-600">Webhook Status:</span>
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                integration.isWebhookActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {integration.isWebhookActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </div>

      {/* Sync Button and Status */}
      {integration?.id && (
        <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-900">Sync Conversations</h3>
            <Button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
          {syncStatus && (
            <p className={cn(
              "text-xs mt-2",
              syncStatus.includes("failed") ? "text-red-600" : "text-green-600"
            )}>
              {syncStatus}
            </p>
          )}
          <p className="text-xs text-purple-700 mt-2">
            Click "Sync Now" to fetch conversations from Chatwoot and display them in the inbox.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saveIntegrationMutation.isPending}
          className="min-w-[120px]"
        >
          {saveIntegrationMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Integration'
          )}
        </Button>
      </div>

      {/* Integration Status */}
      {integration && (
        <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Integration Status</p>
              <p className="text-xs text-purple-700 mt-1">
                {integration.isActive ? 'Active' : 'Inactive'} • Last updated:{' '}
                {integration.updatedAt ? new Date(integration.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                integration.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {integration.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}
    </form>
  );
}

export function Settings() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'integrations' | 'general'>('integrations');

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!hasPermission('can_manage_integrations')) {
      navigate('/dashboard');
    }
  }, [hasPermission, navigate]);

  // Fetch existing integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.getIntegrations(),
  });

  // Find integrations
  const chatwootIntegration = integrations.find((i) => i.provider === 'chatwoot');
  const activeIntegration = integrations.find((i) => i.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your application settings and integrations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'integrations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            General
          </button>
        </nav>
      </div>

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Active Integration Banner */}
          {activeIntegration && (
            <div className="p-4 bg-indigo-50 rounded-md border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-indigo-900">
                    Active Integration: <span className="capitalize">{activeIntegration.provider}</span>
                  </p>
                </div>
                <p className="text-xs text-indigo-700">
                  Only one integration can be active at a time
                </p>
              </div>
            </div>
          )}

          {/* Chatwoot Integration */}
          <Card className={cn(
            "shadow-sm border-gray-200",
            chatwootIntegration?.isActive && "border-purple-300 ring-2 ring-purple-100"
          )}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Chatwoot Integration</CardTitle>
                  <CardDescription>
                    Connect your Chatwoot account to receive messages in the inbox
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChatwootIntegrationForm
                integration={chatwootIntegration ? {
                  ...chatwootIntegration,
                  accountId: chatwootIntegration.accountId || undefined,
                  baseUrl: chatwootIntegration.baseUrl || undefined,
                  webhookMode: chatwootIntegration.webhookMode || undefined,
                  isWebhookActive: chatwootIntegration.isWebhookActive ?? undefined,
                } : undefined}
                onSave={() => {
                  queryClient.invalidateQueries({ queryKey: ['integrations'] });
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage your general application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500">General settings coming soon...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

