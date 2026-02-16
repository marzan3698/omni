import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GamePanel } from '@/components/GamePanel';
import { GameCard } from '@/components/GameCard';
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-100">
          <Plug className="h-8 w-8 text-amber-400" />
          Integrations
        </h1>
        <p className="text-amber-200/80 mt-1">Manage your inbox connections</p>
      </div>

      {isIntegrationsError && (
        <GamePanel>
          <div className="p-6 border-red-500/40 bg-red-500/10">
            <h2 className="text-lg font-semibold text-red-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Integrations লোড হচ্ছে না
            </h2>
            <p className="text-sm text-red-200/90 mt-2">
              {(integrationsError as any)?.response?.data?.message ||
                (integrationsError as any)?.message ||
                'Failed to load integrations'}
            </p>
          </div>
        </GamePanel>
      )}

      {/* Integration Options */}
      <PermissionGuard permission="can_manage_integrations">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-amber-200/90">🔷 Inbox Connection Options</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Facebook Messenger Card */}
            <GameCard index={0}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/20">
                    <Facebook className="h-6 w-6 text-amber-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-amber-100">Facebook Messenger</h2>
                </div>
                <p className="text-sm text-amber-200/80 mb-4">
                  একাধিক Facebook Page কানেক্ট করুন - সব মেসেজ ইনবক্সে জমা হবে
                </p>
                {!hasFacebookConfig && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-sm text-amber-200">
                    <p className="font-medium">কনফিগ প্রয়োজন</p>
                    <p className="mt-1">Facebook App ID, App Secret ও Verify Token সেট করুন। SuperAdmin সেটিংস থেকে দিন।</p>
                    <Button variant="outline" size="sm" className="mt-2 border-amber-500/50 text-amber-100 hover:bg-amber-500/20" onClick={() => navigate('/settings/facebook-app-config')}>
                      Facebook App Config এ যান
                    </Button>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-amber-200/80">
                      <CheckCircle className="h-4 w-4 text-amber-400" />
                      <span>একাধিক পেজ সিলেক্ট করুন</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-200/80">
                      <CheckCircle className="h-4 w-4 text-amber-400" />
                      <span>ইনবক্সে পেজের নাম দেখাবে</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleFacebookConnect}
                    disabled={isConnecting || !hasFacebookConfig}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
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
                    <div className="pt-4 border-t border-amber-500/20">
                      <p className="text-sm font-medium text-amber-200/90 mb-2">Connected Pages ({facebookIntegrations.length})</p>
                      <div className="space-y-2">
                        {facebookIntegrations.map((fb) => (
                          <div
                            key={fb.id}
                            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-amber-500/20 bg-slate-800/40"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-amber-100">{fb.displayName || 'Facebook Page'}</span>
                                <span className="text-xs text-amber-200/60">ID: {fb.pageId}</span>
                              </div>
                              {!fb.isWebhookActive && fb.lastError && (
                                <p className="text-xs text-red-400 mt-0.5 truncate max-w-[420px]" title={fb.lastError}>
                                  {fb.lastError}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
                                  fb.isWebhookActive
                                    ? 'bg-green-500/25 text-green-300 border-green-500/30'
                                    : 'bg-amber-500/25 text-amber-200 border-amber-500/30'
                                }`}
                              >
                                {fb.isWebhookActive ? 'Webhook OK' : 'Webhook Issue'}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFacebookDiagnosticsPageId(fb.pageId)}
                                title="Diagnostics"
                                className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                              >
                                <Stethoscope className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFacebookDisconnect(fb)}
                                disabled={facebookDisconnectLoadingId === fb.id}
                                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
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
              </div>
            </GameCard>

            {/* WhatsApp Slots Card */}
            <GameCard index={1}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/20">
                    <Smartphone className="h-6 w-6 text-amber-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-amber-100">WhatsApp Slots</h2>
                </div>
                <p className="text-sm text-amber-200/80 mb-1">
                  সর্বোচ্চ ৫টি নম্বর কানেক্ট করুন - সব মেসেজ ইনবক্সে জমা হবে
                </p>
                <p className="text-sm text-amber-200/60 mb-4">{whatsappConnectedCount}/5 Connected</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-amber-200/80 mb-3">
                    <CheckCircle className="h-4 w-4 text-amber-400" />
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
                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-amber-500/20 bg-slate-800/40"
                      >
                        <span className="text-sm font-medium text-amber-100">
                          Slot {slotId}: {slotLabel}
                        </span>
                        {connected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsAppDisconnect(slotId)}
                            className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                          >
                            <Power className="mr-1 h-3 w-3" />
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleWhatsAppConnect(slotId, persisted && !connected)}
                            disabled={isConnecting}
                            className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
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
              </div>
            </GameCard>
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
        <div>
          <h2 className="text-xl font-semibold mb-4 text-amber-200/90">📋 Connected Integrations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration, idx) => (
              <GameCard key={integration.id} index={idx}>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-100">
                        {integration.provider === 'facebook' ? (
                          <Facebook className="h-5 w-5 text-amber-400" />
                        ) : integration.provider === 'whatsapp' ? (
                          <Smartphone className="h-5 w-5 text-amber-400" />
                        ) : (
                          <Plug className="h-5 w-5 text-amber-400" />
                        )}
                        {integration.provider === 'facebook'
                          ? (integration.displayName || 'Facebook Page')
                          : integration.provider === 'whatsapp'
                            ? 'WhatsApp (Web)'
                            : 'Other'}
                      </h3>
                      <p className="mt-1 text-sm text-amber-200/70">
                        {integration.provider === 'whatsapp'
                          ? (integration.pageId?.match(/whatsapp-slot-(.+)/)
                              ? `Slot ${integration.pageId.match(/whatsapp-slot-(.+)/)?.[1]}`
                              : `Page ID: ${integration.pageId}`)
                          : integration.provider === 'facebook'
                            ? (integration.displayName ? `${integration.displayName} (${integration.pageId})` : `Page ID: ${integration.pageId}`)
                            : `Page ID: ${integration.pageId}`}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1.5 text-xs rounded-full font-semibold flex items-center gap-1.5 border ${
                            integration.isActive
                              ? 'bg-green-500/25 text-green-300 border-green-500/30'
                              : 'bg-slate-700/60 text-amber-200/80 border-amber-500/20'
                          }`}
                        >
                          {integration.isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                              ACTIVE
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-amber-200/50 rounded-full"></span>
                              INACTIVE
                            </>
                          )}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-500/25 text-amber-200 border border-amber-500/30">
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
                              className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
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
                              className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
                            >
                              <Stethoscope className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFacebookTestMessage(integration.pageId)}
                              disabled={facebookTestLoadingPageId === integration.pageId}
                              title="Send test message to Inbox"
                              className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
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
                              className={`${integration.isActive ? 'border-green-500/50 text-green-300 hover:bg-green-500/20' : 'border-amber-500/50 text-amber-100 hover:bg-amber-500/20'}`}
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
                                className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20"
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
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </PermissionGuard>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <PermissionGuard permission="can_manage_integrations">
                      <div className="p-4 rounded-lg border-2 border-amber-500/30 bg-slate-800/60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${integration.isActive ? 'bg-green-500/25 border border-green-500/30' : 'bg-slate-700/60 border border-amber-500/20'}`}>
                              <Power className={`h-5 w-5 ${integration.isActive ? 'text-green-300' : 'text-amber-200/60'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-amber-100">
                                {integration.isActive ? 'Integration is Active' : 'Integration is Inactive'}
                              </p>
                              <p className="text-xs text-amber-200/70 mt-0.5">
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
                              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 ${
                                integration.isActive 
                                  ? 'bg-green-500/80 hover:bg-green-500' 
                                  : 'bg-slate-600'
                              }`}
                              title={integration.isActive ? 'Click to deactivate' : 'Click to activate'}
                            >
                              <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                                  integration.isActive ? 'translate-x-7' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className={`text-xs font-medium ${integration.isActive ? 'text-green-300' : 'text-amber-200/70'}`}>
                              {integration.isActive ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-amber-200/70">Current Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              integration.isActive
                                ? 'bg-green-500/25 text-green-300 border-green-500/30'
                                : 'bg-slate-700/60 text-amber-200/80 border-amber-500/20'
                            }`}>
                              {integration.isActive ? '✓ ACTIVE' : '○ INACTIVE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </PermissionGuard>
                  </div>
                </div>
              </GameCard>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && integrations.length === 0 && (
        <GamePanel>
          <div className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500/60 mx-auto mb-4" />
            <p className="text-amber-200/80">No integrations connected yet.</p>
            <p className="text-sm text-amber-200/60 mt-2">
              Choose an option above to connect your inbox.
            </p>
          </div>
        </GamePanel>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-amber-200/80 mt-2">Loading integrations...</p>
        </div>
      )}

      {/* Facebook diagnostics modal */}
      {facebookDiagnosticsPageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setFacebookDiagnosticsPageId(null)}>
          <div
            className="w-full max-w-md rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', boxShadow: '0 0 0 1px rgba(217,119,6,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-amber-500/20 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-100">Page diagnostics</h2>
              <Button variant="ghost" size="icon" onClick={() => setFacebookDiagnosticsPageId(null)} className="text-amber-100 hover:bg-amber-500/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-2">
              {fbDiagnosticsRes?.data?.data?.steps?.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm ${step.ok ? 'text-green-300' : 'text-red-400'}`}>
                  {step.ok ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                  <span><strong>{step.step}:</strong> {step.message ?? (step.ok ? 'OK' : 'Failed')}</span>
                </div>
              ))}
              {!fbDiagnosticsRes?.data?.data && fbDiagnosticsRes?.data !== undefined && (
                <p className="text-sm text-amber-200/70">Loading...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bangla Documentation */}
      <div className="mt-8">
        <MessengerSetupGuide />
      </div>
    </div>
  );
}
