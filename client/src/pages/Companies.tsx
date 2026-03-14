import { useState, useEffect } from 'react';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { companyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, Search, Edit, Trash2 } from 'lucide-react';

export function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyApi.getAll();
      if (response.data.success) {
        setCompanies(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-200/60 animate-pulse">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border border-amber-500/20 bg-slate-800/40 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-amber-100 drop-shadow-sm">Companies</h1>
          <p className="text-amber-200/80 mt-1">Manage your companies</p>
        </div>
        <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border-b-2 border-amber-700 shadow-lg shadow-amber-900/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      <DashboardWidgetCard>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500/50 w-4 h-4" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-500/30 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company, idx) => (
              <div 
                key={company.id} 
                className="game-item-card p-5 rounded-xl animate-game-item-reveal"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Building2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-100">{company.name}</h3>
                      {company.industry && (
                        <p className="text-sm text-amber-500/70">{company.industry}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {company.email && (
                    <p className="text-amber-200/70 flex items-center gap-2">
                      <span className="opacity-50">📧</span> {company.email}
                    </p>
                  )}
                  {company.phone && (
                    <p className="text-amber-200/70 flex items-center gap-2">
                      <span className="opacity-50">📞</span> {company.phone}
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-amber-500/30 text-amber-200 hover:bg-amber-500/20 hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 text-amber-500/50">
              No companies found
            </div>
          )}
        </div>
      </DashboardWidgetCard>
    </div>
  );
}

