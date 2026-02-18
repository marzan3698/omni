import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientLeadsApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Phone, DollarSign, Loader2 } from 'lucide-react';

export function ClientLeads() {
  const [campaignId, setCampaignId] = useState<string>('');

  const { data: leadsResponse, isLoading, error } = useQuery({
    queryKey: ['client-leads', campaignId],
    queryFn: async () => {
      const response = await clientLeadsApi.getAll(
        campaignId ? parseInt(campaignId) : undefined
      );
      return response.data.data;
    },
  });

  const leads = leadsResponse || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won':
        return 'bg-green-500/30 text-green-300';
      case 'Lost':
        return 'bg-red-500/30 text-red-300';
      case 'Negotiation':
        return 'bg-amber-500/30 text-amber-300';
      default:
        return 'bg-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-100">Campaign Leads</h1>
        <p className="text-slate-300 mt-1">View leads from your campaigns</p>
      </div>

      <div className="game-card-border rounded-xl p-6 bg-slate-800/60 border border-amber-500/30">
        <h2 className="text-lg font-semibold text-amber-100 mb-4">Filter Leads</h2>
        <div>
          <Label htmlFor="campaignId" className="text-amber-200/90">Campaign ID (optional)</Label>
          <Input
            id="campaignId"
            type="number"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            placeholder="Filter by campaign ID"
            className="bg-slate-800/60 border-amber-500/30 text-amber-100 placeholder-slate-500 mt-1"
          />
        </div>
      </div>

      {error && (
        <div className="game-card-border rounded-xl p-4 bg-red-500/10 border-red-500/30">
          <p className="text-red-300">{(error as any)?.response?.data?.message || 'Failed to load leads'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-slate-400 mt-2">Loading...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="game-card-border rounded-xl p-12 text-center bg-slate-800/60 border border-amber-500/30">
          <p className="text-slate-400">No leads found. Complete a project to view leads from your campaigns.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead: any) => (
            <div
              key={lead.id}
              className="game-card-border rounded-xl p-6 bg-slate-800/60 border border-amber-500/30 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-amber-100">{lead.title}</h3>
                  {lead.customerName && (
                    <div className="flex items-center gap-2 mt-1 text-slate-400">
                      <Users className="w-4 h-4 text-amber-500/70" />
                      {lead.customerName}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </div>
              {lead.description && (
                <p className="text-sm text-slate-400 mb-4 mt-2">{lead.description}</p>
              )}
              <div className="flex gap-4 text-sm">
                {lead.phone && (
                  <div className="flex items-center gap-2 text-amber-200/90">
                    <Phone className="w-4 h-4 text-amber-500/70" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.value && (
                  <div className="flex items-center gap-2 text-amber-200/90">
                    <DollarSign className="w-4 h-4 text-amber-500/70" />
                    <span>${Number(lead.value).toLocaleString()}</span>
                  </div>
                )}
                {lead.campaign && (
                  <div className="text-slate-500">
                    Campaign: {lead.campaign.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
