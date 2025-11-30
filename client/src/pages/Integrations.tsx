import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { integrationApi, type CreateIntegrationData } from '@/lib/integration';
import { Facebook, Copy, Check, Loader2, RefreshCw, AlertCircle, MessageSquare, Plug, Trash2, Edit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';

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

interface Integration extends CreateIntegrationData {
  id: number;
  updatedAt: string;
  webhookMode?: 'local' | 'live' | null;
  isWebhookActive?: boolean | null;
}

export default function Integrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<'facebook' | 'chatwoot' | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);

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

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plug className="h-8 w-8" />
            Integrations
          </h1>
          <p className="text-gray-600 mt-1">Manage system integrations (SuperAdmin only)</p>
        </div>
        <PermissionGuard permission="can_manage_integrations">
          <Button
            onClick={() => {
              setSelectedProvider('chatwoot');
              setEditingIntegration(null);
            }}
          >
            <Plug className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </PermissionGuard>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading integrations...</div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No integrations found. Add your first integration to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {integration.provider === 'chatwoot' ? (
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      ) : integration.provider === 'facebook' ? (
                        <Facebook className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Plug className="h-5 w-5" />
                      )}
                      {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {integration.provider === 'chatwoot' ? `Inbox ID: ${integration.pageId}` : `Page ID: ${integration.pageId}`}
                    </CardDescription>
                  </div>
                  <PermissionGuard permission="can_manage_integrations">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingIntegration(integration);
                          setSelectedProvider(integration.provider as 'facebook' | 'chatwoot');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        integration.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {integration.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {integration.provider === 'chatwoot' && (
                    <>
                      {integration.webhookMode && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Webhook Mode:</span>
                          <span className="text-xs text-gray-700">{integration.webhookMode}</span>
                        </div>
                      )}
                      {integration.isWebhookActive !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Webhook:</span>
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
                  {integration.accountId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Account ID:</span>
                      <span className="text-xs text-gray-700 truncate max-w-[150px]">
                        {integration.accountId}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Integration Form Modal - Redirect to Settings for full form */}
      {(selectedProvider || editingIntegration) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingIntegration ? 'Edit Integration' : 'Add Integration'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedProvider(null);
                    setEditingIntegration(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                For full integration management with webhook configuration, please use the Settings page.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProvider(null);
                    setEditingIntegration(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = '/settings';
                  }}
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

