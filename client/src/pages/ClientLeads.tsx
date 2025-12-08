import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientLeadsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Phone, DollarSign } from 'lucide-react';

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
        return 'bg-green-100 text-green-700';
      case 'Lost':
        return 'bg-red-100 text-red-700';
      case 'Negotiation':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Campaign Leads</h1>
        <p className="text-slate-600 mt-1">View leads from your campaigns</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Filter Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="campaignId">Campaign ID (optional)</Label>
            <Input
              id="campaignId"
              type="number"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Filter by campaign ID"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 text-red-700">
            {(error as any)?.response?.data?.message || 'Failed to load leads'}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : leads.length === 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="text-center py-8 text-slate-500">
            No leads found. Complete a project to view leads from your campaigns.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead: any) => (
            <Card key={lead.id} className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{lead.title}</CardTitle>
                    {lead.customerName && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4" />
                        {lead.customerName}
                      </CardDescription>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {lead.description && (
                  <p className="text-sm text-slate-600 mb-4">{lead.description}</p>
                )}
                <div className="flex gap-4 text-sm">
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.value && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>${Number(lead.value).toLocaleString()}</span>
                    </div>
                  )}
                  {lead.campaign && (
                    <div className="text-slate-500">
                      Campaign: {lead.campaign.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
