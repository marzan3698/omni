import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { integrationApi, type CreateIntegrationData } from '@/lib/integration';
import { facebookIntegrationApi } from '@/lib/facebookIntegration';
import { whatsappApi, type SlotInfo } from '@/lib/whatsapp';
import {
  Facebook,
  Plug,
  Trash2,
  Edit,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Power,
  Smartphone,
  Stethoscope,
  MessageSquarePlus,
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
  displayName?: string | null;
  lastError?: string | null;
  lastValidatedAt?: string | null;
}

export default function Integrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [connectingSlotId, setConnectingSlotId] = useState<string | null>(null);
  const [facebookDiagnosticsPageId, setFacebookDiagnosticsPageId] = useState<string | null>(null);
  const [facebookTestLoadingPageId, setFacebookTestLoadingPageId] = useState<string | null>(null);
  const [facebookDisconnectLoadingId, setFacebookDisconnectLoadingId] = useState<number | null>(null);

  const { data: fbConfigRes } = useQuery({
    queryKey: ['facebook-config', user?.companyId],
    queryFn: () => facebookIntegrationApi.getConfig(user?.companyId),
    enabled: !!user?.companyId,
  });
  const facebookConfig = fbConfigRes?.data?.data;
  const hasFacebookConfig = facebookConfig && facebookConfig.hasAppSecret;

  const { data: fbDiagnosticsRes } = useQuery({
    queryKey: ['facebook-diagnostics', facebookDiagnosticsPageId],
    queryFn: () => facebookIntegrationApi.getDiagnostics(facebookDiagnosticsPageId!),
    enabled: !!facebookDiagnosticsPageId,
  });

  const { data: whatsappSlotsRes } = useQuery({
    queryKey: ['whatsapp-slots'],
    queryFn: async () => {
      const res = await whatsappApi.listSlots();
      return res.data?.data as SlotInfo[];
    },
    enabled: !!user?.companyId,
  });
  const whatsappSlots = whatsappSlotsRes ?? [];
  const whatsappConnectedCount = whatsappSlots.filter((s) => s.connected).length;

  // Fetch integrations
  const {
    data: integrations = [],
    isLoading,
    isError: isIntegrationsError,
    error: integrationsError,
  } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationApi.getIntegrations(),
    enabled: !!user?.companyId,
  });

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

  const handleFacebookConnect = async () => {
    if (!hasFacebookConfig) return;
    try {
      setIsConnecting(true);
      const res = await facebookIntegrationApi.getConnectUrl();
      const url = res.data?.data?.url;
      if (url) window.location.href = url;
      else throw new Error('No URL returned');
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Failed to start Facebook connect');
      setIsConnecting(false);
    }
  };

  const handleFacebookDisconnect = async (integration: Integration) => {
    if (!confirm(`Disconnect "${integration.displayName || integration.pageId}"? Messages will no longer be received.`)) return;
    try {
      setFacebookDisconnectLoadingId(integration.id);
      await facebookIntegrationApi.disconnectPage(integration.id);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to disconnect');
    } finally {
      setFacebookDisconnectLoadingId(null);
    }
  };

  const handleFacebookTestMessage = async (pageId: string) => {
    try {
      setFacebookTestLoadingPageId(pageId);
      await facebookIntegrationApi.sendTestMessage(pageId);
      alert('Test message created. Check your Inbox.');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to send test message');
    } finally {
      setFacebookTestLoadingPageId(null);
    }
  };

  const handleWhatsAppConnect = async (slotId: string, isReconnect = false) => {
    try {
      setIsConnecting(true);
      setConnectingSlotId(slotId);
      setShowWhatsAppModal(true);
      if (isReconnect) {
        await whatsappApi.connectRefresh(slotId);
      } else {
        await whatsappApi.connect(slotId);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to start WhatsApp connection');
      setShowWhatsAppModal(false);
      setConnectingSlotId(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWhatsAppDisconnect = async (slotId: string) => {
    try {
      await whatsappApi.disconnect(slotId);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-slots'] });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to disconnect');
    }
  };

  const facebookIntegrations = integrations.filter((i) => i.provider === 'facebook');
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

      {isIntegrationsError && (
        <Card className="mb-6 border-red-200 bg-red-50/40">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Integrations লোড হচ্ছে না
            </CardTitle>
            <CardDescription className="text-red-700">
              {(integrationsError as any)?.response?.data?.message ||
                (integrationsError as any)?.message ||
                'Failed to load integrations'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Integration Options */}
      <PermissionGuard permission="can_manage_integrations">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔷 Inbox Connection Options</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Facebook Messenger Card */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Facebook className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Facebook Messenger</CardTitle>
                </div>
                <CardDescription>
                  একাধিক Facebook Page কানেক্ট করুন - সব মেসেজ ইনবক্সে জমা হবে
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasFacebookConfig && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <p className="font-medium">কনফিগ প্রয়োজন</p>
                    <p className="mt-1">Facebook App ID, App Secret ও Verify Token সেট করুন। SuperAdmin সেটিংস থেকে দিন।</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/settings/facebook-app-config')}>
                      Facebook App Config এ যান
                    </Button>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>একাধিক পেজ সিলেক্ট করুন</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>ইনবক্সে পেজের নাম দেখাবে</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleFacebookConnect}
                    disabled={isConnecting || !hasFacebookConfig}
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
                        ফেসবুক কানেক্ট করুন
                      </>
                    )}
                  </Button>
                  {facebookIntegrations.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Connected Pages ({facebookIntegrations.length})</p>
                      <div className="space-y-2">
                        {facebookIntegrations.map((fb) => (
                          <div
                            key={fb.id}
                            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-200 bg-gray-50/50"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-700">{fb.displayName || 'Facebook Page'}</span>
                                <span className="text-xs text-gray-500">ID: {fb.pageId}</span>
                              </div>
                              {!fb.isWebhookActive && fb.lastError && (
                                <p className="text-xs text-red-600 mt-0.5 truncate max-w-[420px]" title={fb.lastError}>
                                  {fb.lastError}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  fb.isWebhookActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {fb.isWebhookActive ? 'Webhook OK' : 'Webhook Issue'}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFacebookDiagnosticsPageId(fb.pageId)}
                                title="Diagnostics"
                                className="border-gray-200"
                              >
                                <Stethoscope className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFacebookDisconnect(fb)}
                                disabled={facebookDisconnectLoadingId === fb.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                title="Disconnect"
                              >
                                {facebookDisconnectLoadingId === fb.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Slots Card (max 5) */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">WhatsApp Slots</CardTitle>
                </div>
                <CardDescription>
                  সর্বোচ্চ ৫টি নম্বর কানেক্ট করুন - সব মেসেজ ইনবক্সে জমা হবে
                </CardDescription>
                <p className="text-sm text-gray-500 mt-1">
                  {whatsappConnectedCount}/5 Connected
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>প্রতি স্লটে একটি ফোন - QR দিয়ে কানেক্ট করুন</span>
                  </div>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const slotId = String(n);
                    const slot = whatsappSlots.find((s) => s.slotId === slotId);
                    const connected = slot?.connected ?? false;
                    const phone = slot?.phoneNumber;
                    const persisted = slot?.persisted ?? false;
                    const isThisSlotConnecting = connectingSlotId === slotId && isConnecting;
                    const slotLabel =
                      connected && phone
                        ? `+${phone}`
                        : persisted
                          ? phone
                            ? `+${phone} (Reconnect)`
                            : 'Disconnected - Reconnect'
                          : 'Empty';
                    return (
                      <div
                        key={slotId}
                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-200 bg-gray-50/50"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          Slot {slotId}: {slotLabel}
                        </span>
                        {connected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsAppDisconnect(slotId)}
                            className="border-gray-300 text-gray-700"
                          >
                            <Power className="mr-1 h-3 w-3" />
                            Disconnect
                          </Button>
                        ) : (
                            <Button
                            size="sm"
                            onClick={() => handleWhatsAppConnect(slotId, persisted && !connected)}
                            disabled={isConnecting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isThisSlotConnecting ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Smartphone className="mr-1 h-3 w-3" />
                                Connect
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGuard>

      <WhatsAppQRModal
        isOpen={showWhatsAppModal}
        slotId={connectingSlotId ?? '1'}
        onClose={() => {
          setShowWhatsAppModal(false);
          setConnectingSlotId(null);
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          queryClient.invalidateQueries({ queryKey: ['whatsapp-slots'] });
        }}
        onConnected={() => {
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          queryClient.invalidateQueries({ queryKey: ['whatsapp-slots'] });
          setConnectingSlotId(null);
        }}
        onRetry={async () => {
          const slot = connectingSlotId ?? '1';
          try {
            await whatsappApi.connectRefresh(slot);
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
                        {integration.provider === 'facebook' ? (
                          <Facebook className="h-5 w-5 text-blue-600" />
                        ) : integration.provider === 'whatsapp' ? (
                          <Smartphone className="h-5 w-5 text-green-600" />
                        ) : (
                          <Plug className="h-5 w-5" />
                        )}
                        {integration.provider === 'facebook'
                          ? (integration.displayName || 'Facebook Page')
                          : integration.provider === 'whatsapp'
                            ? 'WhatsApp (Web)'
                            : 'Other'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {integration.provider === 'whatsapp'
                          ? (integration.pageId?.match(/whatsapp-slot-(.+)/)
                              ? `Slot ${integration.pageId.match(/whatsapp-slot-(.+)/)?.[1]}`
                              : `Page ID: ${integration.pageId}`)
                          : integration.provider === 'facebook'
                            ? (integration.displayName ? `${integration.displayName} (${integration.pageId})` : `Page ID: ${integration.pageId}`)
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
                              : 'Other'}
                        </span>
                      </div>
                    </div>
                    <PermissionGuard permission="can_manage_integrations">
                      <div className="flex gap-2 flex-wrap">
                        {integration.provider === 'whatsapp' && (() => {
                          const slotMatch = integration.pageId?.match(/whatsapp-slot-(.+)/);
                          const slotId = slotMatch ? slotMatch[1] : '1';
                          const slotConnected = whatsappSlots.some((s) => s.slotId === slotId && s.connected);
                          return slotConnected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWhatsAppDisconnect(slotId)}
                              className="text-amber-600 hover:text-amber-700"
                              title="Disconnect WhatsApp"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          ) : null;
                        })()}
                        {integration.provider === 'facebook' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFacebookDiagnosticsPageId(integration.pageId)}
                              title="Diagnostics"
                            >
                              <Stethoscope className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFacebookTestMessage(integration.pageId)}
                              disabled={facebookTestLoadingPageId === integration.pageId}
                              title="Send test message to Inbox"
                            >
                              {facebookTestLoadingPageId === integration.pageId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquarePlus className="h-4 w-4" />
                              )}
                            </Button>
                          </>
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
                            {integration.provider !== 'facebook' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/settings')}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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

      {/* Facebook diagnostics modal */}
      {facebookDiagnosticsPageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setFacebookDiagnosticsPageId(null)}>
          <Card className="w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Page diagnostics</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setFacebookDiagnosticsPageId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {fbDiagnosticsRes?.data?.data?.steps?.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm ${step.ok ? 'text-green-700' : 'text-red-700'}`}>
                  {step.ok ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                  <span><strong>{step.step}:</strong> {step.message ?? (step.ok ? 'OK' : 'Failed')}</span>
                </div>
              ))}
              {!fbDiagnosticsRes?.data?.data && fbDiagnosticsRes?.data !== undefined && (
                <p className="text-sm text-gray-500">Loading...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bangla Documentation */}
      <div className="mt-8">
        <MessengerSetupGuide />
      </div>
    </div>
  );
}
