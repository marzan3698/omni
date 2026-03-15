import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceCategoryApi, serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Briefcase, Check, ShoppingBag, Star, Wrench, X, Video } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '@/lib/imageUtils';
import { getServiceCategoryIcon } from '@/lib/serviceCategoryIcons';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface ServiceCategory {
  id: number;
  name: string;
  iconName: string | null;
  iconUrl: string | null;
  parentId?: number | null;
  parent?: { id: number; name: string } | null;
  children?: { id: number; name: string; iconName: string | null; iconUrl: string | null }[];
}

interface ServiceAttributes {
  keyValuePairs?: Record<string, string | number | boolean>;
  tags?: string[];
}

interface Service {
  id: number;
  title: string;
  details: string;
  pricing: number | string;
  deliveryStartDate: string | null;
  deliveryEndDate: string | null;
  categoryId: number | null;
  category?: ServiceCategory | null;
  attributes?: string | ServiceAttributes;
  thumbnailType: 'IMAGE' | 'YOUTUBE' | 'LOCAL_VIDEO';
  thumbnailUrl: string | null;
  gallery: string[];
  createdAt: string;
}

interface ClientServicesByCategoryProps {
  companyId: number;
  onStartProject: (service?: Service) => void;
  selectedCategoryId: number | 'all';
  onCategoryChange: (id: number | 'all') => void;
  searchTerm: string;
}

function parseAttributes(attrs: string | ServiceAttributes | undefined): ServiceAttributes {
  if (!attrs) return { keyValuePairs: {}, tags: [] };
  if (typeof attrs === 'string') {
    try {
      return JSON.parse(attrs) as ServiceAttributes;
    } catch {
      return { keyValuePairs: {}, tags: [] };
    }
  }
  return attrs;
}

function ProductCard({
  service,
  onStartProject,
}: {
  service: Service;
  onStartProject: (s: Service) => void;
}) {
  const navigate = useNavigate();
  const attrs = parseAttributes(service.attributes);
  const kv = attrs.keyValuePairs ?? {};
  const tags = attrs.tags ?? [];
  const kvEntries = Object.entries(kv).slice(0, 3); // Show only top 3 attributes for cleaner look
  
  const getYTThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  return (
    <div 
      onClick={() => navigate(`/client/services/${service.id}`)}
      className="group relative flex flex-col bg-slate-800/40 border border-amber-500/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1 cursor-pointer"
    >
      {/* Product Image */}
      <div className="aspect-video w-full bg-slate-900/60 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        
        {service.thumbnailUrl ? (
          <>
            {service.thumbnailType === 'IMAGE' ? (
              <img 
                src={getStaticFileUrl(service.thumbnailUrl)} 
                alt={service.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            ) : service.thumbnailType === 'YOUTUBE' ? (
              <img 
                src={getYTThumbnail(service.thumbnailUrl) || ''} 
                alt={service.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            ) : (
              <video 
                src={getStaticFileUrl(service.thumbnailUrl)} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            )}
            {service.thumbnailType !== 'IMAGE' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Video className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            )}
          </>
        ) : service.category?.iconUrl ? (
          <img 
            src={getImageUrl(service.category.iconUrl)} 
            alt="" 
            className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-100" 
          />
        ) : (
          <ShoppingBag className="w-12 h-12 text-amber-500/20 group-hover:text-amber-500/40 transition-colors duration-500" />
        )}
        
        {/* Badge */}
        {tags[0] && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-amber-500/80 text-[10px] font-bold text-slate-900 uppercase">
            {tags[0]}
          </div>
        )}
      </div>

      <div className="flex flex-col p-4 flex-1">
        <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
                <div className="flex">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />)}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">4.9 (120+)</span>
            </div>
          <h4 className="font-bold text-amber-100 group-hover:text-amber-400 transition-colors line-clamp-1 text-base">{service.title}</h4>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{service.category?.name || 'General Service'}</p>
        </div>

        <div className="space-y-1.5 mb-4">
            {kvEntries.map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[11px]">
                    <Check className="w-3 h-3 text-amber-500/60" />
                    <span className="text-slate-300">{k}:</span>
                    <span className="text-amber-200/70 font-medium truncate">{String(v)}</span>
                </div>
            ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-amber-500/10">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Starting at</span>
            <span className="font-black text-xl text-amber-400">৳{Number(service.pricing).toLocaleString()}</span>
          </div>
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartProject(service);
            }}
            className="rounded-xl px-4 h-10 border-amber-500/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500 hover:text-slate-900 transition-all font-bold"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ClientServicesByCategory({
  companyId,
  onStartProject,
  selectedCategoryId,
  searchTerm,
}: ClientServicesByCategoryProps) {

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
  });

  const services = (servicesResponse || []) as Service[];

  const filteredServices = useMemo(() => {
    let result = services;

    // Filter by Category
    if (selectedCategoryId !== 'all') {
      result = result.filter(s => 
        s.categoryId === selectedCategoryId || 
        s.category?.parentId === selectedCategoryId
      );
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(term) || 
        s.details.toLowerCase().includes(term) ||
        s.category?.name?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [services, selectedCategoryId, searchTerm]);

  // Group by category for "All" view
  const groupedServices = useMemo(() => {
    if (selectedCategoryId !== 'all' || searchTerm.trim()) return null;
    
    const groups: Record<number, { name: string; services: Service[] }> = {};
    
    filteredServices.forEach(s => {
      const catId = s.category?.parentId || s.categoryId || 0;
      const catName = s.category?.parent?.name || s.category?.name || 'Other Services';
      
      if (!groups[catId]) {
        groups[catId] = { name: catName, services: [] };
      }
      groups[catId].services.push(s);
    });
    
    return Object.values(groups).filter(group => group.name !== 'Other Services');
  }, [filteredServices, selectedCategoryId, searchTerm]);

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/10 bg-slate-800/40 p-12 text-center">
        <Wrench className="w-12 h-12 mx-auto mb-3 text-amber-500/20" />
        <p className="text-slate-400">No services available at the moment.</p>
      </div>
    );
  }

  if (filteredServices.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 rounded-2xl border border-amber-500/10 bg-slate-800/40">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-amber-500/10" />
        <h3 className="text-xl font-bold text-amber-200/80 mb-2">No results found</h3>
        <p>Try adjusting your search or category filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {groupedServices ? (
        groupedServices.map(group => (
          <div key={group.name} className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-amber-100 tracking-tight">{group.name}</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.services.map((service) => (
                <ProductCard key={service.id} service={service} onStartProject={onStartProject} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-amber-100 tracking-tight">
                    {selectedCategoryId === 'all' ? 'All Services' : filteredServices[0]?.category?.name || 'Services'}
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                    <ProductCard key={service.id} service={service} onStartProject={onStartProject} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
