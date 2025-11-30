import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leadApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Target, Plus, TrendingUp } from 'lucide-react';

export function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.companyId) {
      loadLeads();
      loadPipeline();
    }
  }, [user]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await leadApi.getAll(user!.companyId!);
      if (response.data.success) {
        setLeads(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPipeline = async () => {
    try {
      const response = await leadApi.getPipeline(user!.companyId!);
      if (response.data.success) {
        setPipeline(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600 mt-1">Manage your sales pipeline</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {pipeline.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipeline.map((stage) => (
            <Card key={stage.status} className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm">{stage.status}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stage.count}</div>
                {stage.totalValue > 0 && (
                  <div className="text-sm text-slate-500">
                    ${stage.totalValue.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {leads.map((lead) => (
              <Card key={lead.id} className="shadow-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-indigo-600" />
                      <div>
                        <CardTitle className="text-lg">{lead.title}</CardTitle>
                        {lead.customerName && (
                          <p className="text-sm font-medium text-slate-700 mt-1">
                            Customer: {lead.customerName}
                            {lead.phone && ` • ${lead.phone}`}
                          </p>
                        )}
                        {lead.description && (
                          <p className="text-sm text-slate-500 mt-1">{lead.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {lead.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {lead.category.name}
                            </span>
                          )}
                          {lead.interest && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {lead.interest.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      lead.status === 'Won' ? 'bg-green-100 text-green-700' :
                      lead.status === 'Lost' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex gap-4">
                      <span>📊 {lead.source}</span>
                      {lead.value && <span>💰 ${Number(lead.value).toLocaleString()}</span>}
                    </div>
                    {lead.assignedEmployee && (
                      <span>👤 {lead.assignedEmployee.user?.email}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {leads.length === 0 && (
            <div className="text-center py-12 text-slate-500">No leads found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

