import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { integrationApi, type CreateIntegrationData } from '@/lib/integration';
import { facebookOAuthApi } from '@/lib/facebookOAuth';
import { whatsappApi } from '@/lib/whatsapp';
import {
  Facebook,
  MessageSquare,
  Plug,
  Trash2,
  Edit,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Power,
  Smartphone,
} from 'lucide-react';
import WhatsAppQRModal from '@/components/WhatsAppQRModal';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import MessengerSetupGuide from '@/components/MessengerSetupGuide';

interface Integration extends CreateIntegrationData {
  id: number;
  updatedAt: string;
  webhookMode?: 'local' | 'live' | null;
  isWebhookActive?: boolean | null;
}

export default function Integrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // WhatsApp status (connected or not)
  const { data: whatsappStatusRes, refetch: refetchWhatsAppStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const res = await whatsappApi.getStatus();
      return res.data?.data as { connected: boolean };
    },
    enabled: !!user?.companyId,
  });
  const whatsappConnected = whatsappStatusRes?.connected ?? false;

  // Fetch integrations
  const { data: integrationsResponse, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.getIntegrations(),
    enabled: !!user?.companyId,
  });

  const integrations = (integrationsResponse?.data?.data as Integration[]) || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => integrationApi.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  // Toggle active/inactive mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      integrationApi.updateIntegration(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to update integration status');
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (integration: Integration) => {
    toggleActiveMutation.mutate({
      id: integration.id,
      isActive: !integration.isActive,
    });
  };

  const handleFacebookLogin = async () => {
    try {
      setIsConnecting(true);
      const { url } = await facebookOAuthApi.getAuthUrl();
      // Redirect to Facebook OAuth
      window.location.href = url;
    } catch (error: any) {
      alert(error.message || 'Failed to start Facebook login');
      setIsConnecting(false);
    }
  };

  const handleChatwootSetup = () => {
    navigate('/settings');
  };

  const handleWhatsAppConnect = async () => {
    try {
      setIsConnecting(true);
      setShowWhatsAppModal(true); // Show modal immediately
      await whatsappApi.connect(); // API call runs in background
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to start WhatsApp connection');
      setShowWhatsAppModal(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWhatsAppDisconnect = async () => {
    try {
      await whatsappApi.disconnect();
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to disconnect');
    }
  };

  const facebookIntegrations = integrations.filter((i) => i.provider === 'facebook');
  const chatwootIntegrations = integrations.filter((i) => i.provider === 'chatwoot');
  const whatsappIntegrations = integrations.filter((i) => i.provider === 'whatsapp');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plug className="h-8 w-8" />
          Integrations
        </h1>
        <p className="text-gray-600 mt-1">Manage your inbox connections</p>
      </div>

      {/* Integration Options */}
      <PermissionGuard permission="can_manage_integrations">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔷 Inbox Connection Options</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Direct Facebook Messenger Card */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Facebook className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Direct Messenger</CardTitle>
                </div>
                <CardDescription>
                  সরাসরি Facebook Page connect করুন - সহজ ও দ্রুত setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>সহজ ও দ্রুত</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>এক ক্লিকে setup</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>OAuth authentication</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleFacebookLogin}
                    disabled={isConnecting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Facebook className="mr-2 h-4 w-4" />
                        Login with Facebook
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chatwoot Card */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Via Chatwoot</CardTitle>
                </div>
                <CardDescription>
                  Chatwoot দিয়ে connect করুন - Multi-channel support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Multi-channel support</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Advanced features</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Team collaboration</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleChatwootSetup}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Configure Chatwoot
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp (Web) Card */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">WhatsApp (Web)</CardTitle>
                </div>
                <CardDescription>
                  QR স্ক্যান করে কানেক্ট করুন
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>WhatsApp Web দিয়ে মেসেজ</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>একটি ফোন একবার কানেক্ট</span>
                    </div>
                  </div>
                  {whatsappConnected ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-green-600">Connected</span>
                      <Button
                        variant="outline"
                        onClick={handleWhatsAppDisconnect}
                        className="w-full border-gray-300 text-gray-700"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleWhatsAppConnect}
                      disabled={isConnecting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Smartphone className="mr-2 h-4 w-4" />
                          Connect WhatsApp
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGuard>

      <WhatsAppQRModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false);
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
        }}
        onConnected={() => {
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
        }}
        onRetry={async () => {
          try {
            await whatsappApi.connect();
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Connected Integrations */}
      {!isLoading && integrations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📋 Connected Integrations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <Card key={integration.id} className="shadow-sm border-gray-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {integration.provider === 'chatwoot' ? (
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                        ) : integration.provider === 'facebook' ? (
                          <Facebook className="h-5 w-5 text-blue-600" />
                        ) : integration.provider === 'whatsapp' ? (
                          <Smartphone className="h-5 w-5 text-green-600" />
                        ) : (
                          <Plug className="h-5 w-5" />
                        )}
                        {integration.provider === 'facebook'
                          ? 'Direct Messenger'
                          : integration.provider === 'whatsapp'
                            ? 'WhatsApp (Web)'
                            : 'Chatwoot'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {integration.provider === 'chatwoot'
                          ? `Inbox ID: ${integration.pageId}`
                          : `Page ID: ${integration.pageId}`}
                      </CardDescription>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1.5 text-xs rounded-full font-semibold flex items-center gap-1.5 ${
                            integration.isActive
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {integration.isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                              ACTIVE
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                              INACTIVE
                            </>
                          )}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                          {integration.provider === 'facebook'
                            ? 'Direct'
                            : integration.provider === 'whatsapp'
                              ? 'WhatsApp'
                              : 'Chatwoot'}
                        </span>
                      </div>
                    </div>
                    <PermissionGuard permission="can_manage_integrations">
                      <div className="flex gap-2 flex-wrap">
                        {integration.provider === 'whatsapp' && whatsappConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleWhatsAppDisconnect}
                            className="text-amber-600 hover:text-amber-700"
                            title="Disconnect WhatsApp"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        {integration.provider !== 'whatsapp' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(integration)}
                              disabled={toggleActiveMutation.isPending}
                              className={
                                integration.isActive
                                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  : 'text-gray-600 hover:text-gray-700'
                              }
                              title={integration.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {toggleActiveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/settings')}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(integration.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </PermissionGuard>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {/* Active/Inactive Toggle Section - Prominent Green Switch */}
                    <PermissionGuard permission="can_manage_integrations">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${integration.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Power className={`h-5 w-5 ${integration.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {integration.isActive ? 'Integration is Active' : 'Integration is Inactive'}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {integration.isActive 
                                  ? 'Messages are being received and processed' 
                                  : 'Integration is disabled - no messages will be received'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => handleToggleActive(integration)}
                              disabled={toggleActiveMutation.isPending}
                              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 shadow-md ${
                                integration.isActive 
                                  ? 'bg-green-500 hover:bg-green-600' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              title={integration.isActive ? 'Click to deactivate' : 'Click to activate'}
                            >
                              <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                                  integration.isActive ? 'translate-x-7' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              integration.isActive ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {integration.isActive ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                        {/* Status Badge */}
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Current Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              integration.isActive
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-400 text-white'
                            }`}>
                              {integration.isActive ? '✓ ACTIVE' : '○ INACTIVE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </PermissionGuard>
                    {integration.provider === 'chatwoot' && (
                      <>
                        {integration.webhookMode && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Webhook Mode:</span>
                            <span className="text-gray-700">{integration.webhookMode}</span>
                          </div>
                        )}
                        {integration.isWebhookActive !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Webhook:</span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                integration.isWebhookActive
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {integration.isWebhookActive ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && integrations.length === 0 && (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No integrations connected yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Choose an option above to connect your inbox.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-600 mt-2">Loading integrations...</p>
        </div>
      )}

      {/* Bangla Documentation */}
      <div className="mt-8">
        <MessengerSetupGuide />
      </div>
    </div>
  );
}
