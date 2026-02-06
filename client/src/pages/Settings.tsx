import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { integrationApi } from '@/lib/integration';
import { Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function Settings() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
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

          {/* Integrations are managed from the Integrations page */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Plug className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Inbox Integrations</CardTitle>
                  <CardDescription>
                    Connect Facebook Messenger and WhatsApp from the Integrations page
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => navigate('/integrations')}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Go to Integrations
              </Button>
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

