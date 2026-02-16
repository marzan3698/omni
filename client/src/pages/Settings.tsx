import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { integrationApi } from '@/lib/integration';
import { Plug } from 'lucide-react';
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

  const tabActive = 'border-amber-500 text-amber-100';
  const tabInactive = 'border-transparent text-amber-200/70 hover:text-amber-100 hover:border-amber-500/50';

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <h1 className="text-3xl font-bold text-amber-100">Settings</h1>
        <p className="text-amber-200/80 mt-1">Manage your application settings and integrations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-amber-500/20">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'integrations' ? tabActive : tabInactive}`}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'general' ? tabActive : tabInactive}`}
          >
            General
          </button>
        </nav>
      </div>

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {integrations.filter((i) => i.isActive).length > 0 && (
            <div className="p-4 bg-amber-500/20 rounded-md border border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-amber-100">
                  Active: {integrations.filter((i) => i.isActive).map((i) => (i.displayName || i.provider) + (i.provider === 'facebook' ? ' (FB)' : '')).join(', ') || 'None'}
                </p>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                You can have multiple Facebook Pages and WhatsApp slots active at once.
              </p>
            </div>
          )}

          <GamePanel>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Plug className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-amber-100">Inbox Integrations</h2>
                  <p className="text-sm text-amber-200/70 mt-0.5">
                    Connect Facebook Messenger and WhatsApp from the Integrations page
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/integrations')}
                className="mt-4 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 bg-transparent"
              >
                Go to Integrations
              </Button>
            </div>
          </GamePanel>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <GamePanel>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-100">General Settings</h2>
            <p className="text-sm text-amber-200/70 mt-0.5">Manage your general application settings</p>
            <p className="text-amber-200/70 mt-4">General settings coming soon...</p>
          </div>
        </GamePanel>
      )}
    </div>
  );
}

