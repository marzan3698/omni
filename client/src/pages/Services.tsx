import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, Edit, Trash2, DollarSign, Image as ImageIcon, 
  RefreshCw, Clock, ExternalLink, ChevronRight, Layers, Tag as TagIcon
} from 'lucide-react';
import { formatCurrencyWithSymbol } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn, getStaticFileUrl } from '@/lib/utils';

export function Services() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: servicesResponse, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await serviceApi.getAll();
      return response.data.data || [];
    },
  });

  const services = servicesResponse || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Services Catalog</h1>
          <div className="text-slate-500 mt-1 flex items-center gap-2">
            Manage your digital offerings and recurring packages
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-100 bg-indigo-50/50">
              WooCommerce Style
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden md:flex">
            <Layers className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
          <Button 
            onClick={() => navigate('/services/new')}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Service
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Fetching catalog items...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Layers className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Services Yet</h3>
          <p className="text-slate-500 mb-6 max-w-xs text-center text-sm">
            Start by adding your first digital marketing package or service.
          </p>
          <Button onClick={() => navigate('/services/new')} variant="outline">Create First Service</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service: any) => {
            const attributes = typeof service.attributes === 'string' 
              ? JSON.parse(service.attributes) 
              : service.attributes;
            
            return (
              <Card key={service.id} className="group overflow-hidden border-slate-200 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col h-full bg-white">
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {service.thumbnailUrl ? (
                    <img 
                      src={getStaticFileUrl(service.thumbnailUrl)} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={service.title} 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Thumbnail</span>
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase tracking-wider shadow-sm",
                      service.isActive ? "bg-indigo-600" : "bg-slate-500"
                    )}>
                      {service.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="backdrop-blur-md bg-white/80 border-white/20 text-indigo-900 font-bold shadow-sm">
                      {service.category?.name || 'Uncategorized'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                      {service.title}
                    </h3>
                    <div className="flex gap-1 ml-4 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(service.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {service.shortDescription && (
                    <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">
                      {service.shortDescription}
                    </p>
                  )}

                  <div className="mt-auto space-y-4">
                    {/* Pricing Display */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                          {service.priceType === 'RENEWAL' ? 'Subscription' : 'One-time Payment'}
                        </span>
                        <div className="flex items-center gap-1">
                           <span className="text-lg font-black text-slate-900">
                            {formatCurrencyWithSymbol(service.pricing, service.currency || 'BDT')}
                          </span>
                          {service.priceType === 'RENEWAL' && (
                            <span className="text-[10px] font-medium text-slate-500">
                              / {service.renewalInterval === 'MONTHLY' ? 'mo' : service.renewalInterval === 'SIX_MONTH' ? '6mo' : 'yr'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg",
                        service.priceType === 'RENEWAL' ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                      )}>
                        {service.priceType === 'RENEWAL' ? <RefreshCw className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Features Tags */}
                    {attributes?.tags && attributes.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {attributes.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-white border-slate-200 text-[9px] text-slate-500 font-bold uppercase tracking-tight"
                          >
                            <TagIcon className="w-2.5 h-2.5 mr-1 text-slate-300" />
                            {tag}
                          </Badge>
                        ))}
                        {attributes.tags.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 ml-1">+{attributes.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                   <Button 
                    variant="ghost" 
                    className="w-full text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-transparent p-0 justify-between group/btn"
                    onClick={() => navigate(`/services/${service.id}/edit`)}
                   >
                     View Details
                     <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                   </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

