import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { integrationApi, type CreateIntegrationData } from '@/lib/integration';
import { Facebook, Copy, Check, Loader2, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

const integrationSchema = z.object({
  provider: z.enum(['facebook', 'whatsapp', 'chatwoot']),
  pageId: z.string().min(1, 'Page ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  accountId: z.string().optional(),
  baseUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

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

type IntegrationFormData = z.infer<typeof integrationSchema>;
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
    saveIntegrationMutation.mutate(data);
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'integrations' | 'general'>('integrations');
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [ngrokStatus, setNgrokStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'subscribed' | 'not_subscribed' | 'error'>('checking');

  // Fetch existing integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.getIntegrations(),
  });

  // Find integrations
  const facebookIntegration = integrations.find((i) => i.provider === 'facebook');
  const chatwootIntegration = integrations.find((i) => i.provider === 'chatwoot');
  const activeIntegration = integrations.find((i) => i.isActive);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      provider: 'facebook',
      pageId: facebookIntegration?.pageId || '',
      accessToken: facebookIntegration?.accessToken || '',
      isActive: facebookIntegration?.isActive ?? true,
    },
  });

  // Update form when integration data loads
  useEffect(() => {
    if (facebookIntegration) {
      reset({
        provider: 'facebook',
        pageId: facebookIntegration.pageId,
        accessToken: facebookIntegration.accessToken,
        isActive: facebookIntegration.isActive,
      });
    }
  }, [facebookIntegration, reset]);

  // Check subscription status
  const checkSubscription = async () => {
    if (!facebookIntegration?.pageId || !facebookIntegration?.accessToken) {
      setSubscriptionStatus('error');
      return;
    }

    setSubscriptionStatus('checking');
    try {
      const response = await apiClient.get('/api/utils/check-subscription', {
        params: {
          pageId: facebookIntegration.pageId,
          accessToken: facebookIntegration.accessToken,
        },
      });

      if (response.data.success && response.data.data.isSubscribed) {
        setSubscriptionStatus('subscribed');
      } else {
        setSubscriptionStatus('not_subscribed');
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus('error');
    }
  };

  // Subscribe page mutation
  const subscribePageMutation = useMutation({
    mutationFn: async () => {
      if (!facebookIntegration?.pageId || !facebookIntegration?.accessToken) {
        throw new Error('Page ID and Access Token are required');
      }
      const response = await apiClient.post('/api/utils/subscribe-page', {
        pageId: facebookIntegration.pageId,
        accessToken: facebookIntegration.accessToken,
      });
      return response.data;
    },
    onSuccess: () => {
      alert('Page subscribed successfully! Messages should now start coming.');
      checkSubscription();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to subscribe page');
    },
  });

  // Check subscription when integration is loaded
  useEffect(() => {
    if (facebookIntegration?.pageId && facebookIntegration?.accessToken) {
      checkSubscription();
    }
  }, [facebookIntegration?.pageId, facebookIntegration?.accessToken]);

  // Generate webhook URL - try to fetch ngrok URL first, fallback to localhost
  useEffect(() => {
    const generateWebhookUrl = async () => {
      // First, try to fetch ngrok URL from our server (which proxies ngrok API)
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${apiBaseUrl}/api/utils/ngrok-url`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.available && data.data?.webhookUrl) {
            setWebhookUrl(data.data.webhookUrl);
            setNgrokStatus('available');
            return;
          }
        }
        setNgrokStatus('unavailable');
      } catch (error) {
        // ngrok not running or not accessible, fallback to other methods
        setNgrokStatus('unavailable');
      }

      // Fallback: Use environment variable or detect from current location
      let apiBaseUrl = import.meta.env.VITE_API_URL;

      if (!apiBaseUrl) {
        // Auto-detect: if running on localhost, use local server
        // Otherwise, use the same origin (for production)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          apiBaseUrl = 'http://localhost:5001';
        } else {
          // In production, assume API is on same domain but different port
          // Or if using a subdomain, adjust accordingly
          // For now, use same origin (you can configure this in .env)
          apiBaseUrl = window.location.origin.replace(window.location.port, '5001');
        }
      }

      const url = `${apiBaseUrl}/api/webhooks/facebook`;
      setWebhookUrl(url);
    };

    generateWebhookUrl();

    // Poll server API every 5 seconds to update URL if ngrok starts later
    const interval = setInterval(() => {
      generateWebhookUrl();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Save/Update integration mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: (data: CreateIntegrationData) => integrationApi.upsertIntegration(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const message = activeIntegration && activeIntegration.provider !== variables.provider && variables.isActive
        ? 'Integration saved successfully! Other integrations have been disabled.'
        : 'Integration saved successfully!';
      alert(message);
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to save integration');
    },
  });

  const onSubmit = (formData: IntegrationFormData) => {
    // Warn if enabling a different integration
    if (formData.isActive && activeIntegration && activeIntegration.provider !== formData.provider) {
      if (!confirm(`Enabling ${formData.provider} will disable the currently active ${activeIntegration.provider} integration. Continue?`)) {
        return;
      }
    }
    saveIntegrationMutation.mutate(formData);
  };

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

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

          {/* Facebook Integration */}
          <Card className={cn(
            "shadow-sm border-gray-200",
            facebookIntegration?.isActive && "border-indigo-300 ring-2 ring-indigo-100"
          )}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Facebook Integration</CardTitle>
                  <CardDescription>
                    Connect your Facebook page to receive messages in the inbox
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Webhook URL Section */}
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Webhook URL
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Use this URL when configuring your Facebook app webhook settings
                  </p>

                  {/* ngrok Status Indicator */}
                  {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (
                    <div className="mb-3 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                      {ngrokStatus === 'available' ? (
                        <p className="text-xs text-green-700">
                          ✅ ngrok is running - Using public URL for Facebook webhook
                        </p>
                      ) : ngrokStatus === 'unavailable' ? (
                        <div className="text-xs text-yellow-700">
                          <p className="font-medium mb-1">⚠️ ngrok not detected</p>
                          <p className="mb-2">For local testing, start ngrok:</p>
                          <code className="block bg-white p-2 rounded border text-xs mb-2">
                            ngrok http 5001
                          </code>
                          <p className="text-xs">If ngrok is not authenticated, run:</p>
                          <code className="block bg-white p-2 rounded border text-xs">
                            ngrok config add-authtoken YOUR_TOKEN
                          </code>
                          <p className="text-xs mt-2 text-slate-600">
                            Get your token from: <a href="https://dashboard.ngrok.com/get-started/your-authtoken" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">ngrok dashboard</a>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">
                          🔍 Checking for ngrok...
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="flex-1 bg-white font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyWebhookUrl}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
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
                  <p className="text-xs text-slate-500 mt-2">
                    Copy this URL and paste it in your Facebook App → Webhooks → Callback URL
                  </p>
                </div>

                {/* Page ID */}
                <div>
                  <label htmlFor="pageId" className="block text-sm font-medium text-slate-700 mb-2">
                    Facebook Page ID
                  </label>
                  <Input
                    id="pageId"
                    type="text"
                    placeholder="Enter your Facebook Page ID"
                    {...register('pageId')}
                    className={errors.pageId ? 'border-red-500' : ''}
                  />
                  {errors.pageId && (
                    <p className="text-sm text-red-500 mt-1">{errors.pageId.message}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Find your Page ID in Facebook Page Settings → About
                  </p>
                </div>

                {/* Access Token */}
                <div>
                  <label
                    htmlFor="accessToken"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Access Token
                  </label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Enter your Facebook Access Token"
                    {...register('accessToken')}
                    className={errors.accessToken ? 'border-red-500' : ''}
                  />
                  {errors.accessToken && (
                    <p className="text-sm text-red-500 mt-1">{errors.accessToken.message}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Generate a Page Access Token from Facebook Graph API Explorer
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Active Integration
                  </label>
                </div>

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
              </form>

              {/* Webhook Subscription Status */}
              {facebookIntegration && (
                <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Webhook Subscription Status</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Check if your Facebook Page is subscribed to receive messages
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={checkSubscription}
                      disabled={subscriptionStatus === 'checking'}
                    >
                      {subscriptionStatus === 'checking' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {subscriptionStatus === 'checking' && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking subscription status...
                    </div>
                  )}

                  {subscriptionStatus === 'subscribed' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Check className="w-4 h-4" />
                        <span>Page is subscribed to webhook</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Subscribed
                      </span>
                    </div>
                  )}

                  {subscriptionStatus === 'not_subscribed' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-yellow-700">
                        <AlertCircle className="w-4 h-4" />
                        <span>Page is NOT subscribed to webhook</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Your Page needs to be subscribed to receive messages. Click the button below to subscribe automatically.
                      </p>
                      <Button
                        type="button"
                        onClick={() => subscribePageMutation.mutate()}
                        disabled={subscribePageMutation.isPending}
                        className="w-full"
                      >
                        {subscribePageMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Subscribing...
                          </>
                        ) : (
                          'Subscribe Page to Webhook'
                        )}
                      </Button>
                    </div>
                  )}

                  {subscriptionStatus === 'error' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">Error checking subscription</p>
                          <p className="text-xs text-red-600">
                            This usually means your Access Token is missing required permissions or has expired.
                          </p>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-800">
                        <p className="font-medium mb-2">How to fix:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">Graph API Explorer</a></li>
                          <li>Select your App and get a User Access Token</li>
                          <li>Request these permissions:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li><code className="bg-red-100 px-1 rounded">pages_manage_metadata</code></li>
                              <li><code className="bg-red-100 px-1 rounded">pages_messaging</code></li>
                              <li><code className="bg-red-100 px-1 rounded">pages_read_engagement</code></li>
                            </ul>
                          </li>
                          <li>Generate a Page Access Token (long-lived)</li>
                          <li>Update the Access Token in this form and save</li>
                        </ol>
                        <p className="mt-2 text-red-700">
                          <strong>Note:</strong> The token must have <code className="bg-red-100 px-1 rounded">pages_manage_metadata</code> permission to check subscription status.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Integration Status */}
              {facebookIntegration && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-md border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-900">Integration Status</p>
                      <p className="text-xs text-indigo-700 mt-1">
                        {facebookIntegration.isActive ? 'Active' : 'Inactive'} • Last updated:{' '}
                        {new Date(facebookIntegration.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        facebookIntegration.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {facebookIntegration.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

