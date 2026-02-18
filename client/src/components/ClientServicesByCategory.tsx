import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceCategoryApi, serviceApi } from '@/lib/api';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { Button } from '@/components/ui/button';
import { Briefcase, Check, Wrench, X } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { getServiceCategoryIcon } from '@/lib/serviceCategoryIcons';
import { cn } from '@/lib/utils';

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
}

interface ClientServicesByCategoryProps {
  companyId: number;
  onStartProject: (service?: Service) => void;
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

function ServiceCard({
  service,
  onStartProject,
}: {
  service: Service;
  onStartProject: (s: Service) => void;
}) {
  const attrs = parseAttributes(service.attributes);
  const kv = attrs.keyValuePairs ?? {};
  const tags = attrs.tags ?? [];
  const kvEntries = Object.entries(kv);
  const deliveryText = (() => {
    if (!service.deliveryStartDate || !service.deliveryEndDate) return null;
    const start = new Date(service.deliveryStartDate).getTime();
    const end = new Date(service.deliveryEndDate).getTime();
    const days = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    return `${days} days`;
  })();

  return (
    <DashboardWidgetCard>
      <div className="flex flex-col h-full">
        <div className="mb-2">
          <h4 className="font-semibold text-amber-100 line-clamp-2">{service.title}</h4>
          {service.category?.name && (
            <p className="text-xs text-slate-400 mt-0.5">{service.category.name}</p>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-bold text-amber-400">৳{Number(service.pricing).toLocaleString()}</span>
          {deliveryText && (
            <span className="text-sm text-slate-400">Delivery: {deliveryText}</span>
          )}
        </div>
        {(kvEntries.length > 0 || tags.length > 0) && (
          <div className="flex-1 space-y-1 mb-4">
            {kvEntries.map(([k, v]) => {
              const val = String(v).toLowerCase().trim();
              const valueDisplay =
                val === 'yes' ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : val === 'no' ? (
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <span className="text-amber-200/90">{String(v)}</span>
                );
              return (
                <div key={k} className="flex justify-between items-center text-sm gap-2">
                  <span className="text-slate-400">{k}:</span>
                  {valueDisplay}
                </div>
              );
            })}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <Button
          size="sm"
          onClick={() => onStartProject(service)}
          className="mt-auto border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
        >
          <Briefcase className="w-4 h-4 mr-1" />
          Start Project
        </Button>
      </div>
    </DashboardWidgetCard>
  );
}

export function ClientServicesByCategory({
  companyId,
  onStartProject,
}: ClientServicesByCategoryProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['service-categories-client', companyId],
    queryFn: async () => {
      const response = await serviceCategoryApi.getListForClient();
      return response.data.data || [];
    },
    enabled: !!companyId,
  });

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
  });

  const allCategories = (categoriesResponse || []) as ServiceCategory[];
  const services = (servicesResponse || []) as Service[];

  const { topLevel, categoryMap } = useMemo(() => {
    const map = new Map<number, ServiceCategory>();
    const top: ServiceCategory[] = [];
    for (const cat of allCategories) {
      map.set(cat.id, cat);
      if (!cat.parentId) {
        top.push(cat);
      }
    }
    return { topLevel: top, categoryMap: map };
  }, [allCategories]);

  const selectedCategory = selectedCategoryId && selectedCategoryId !== 'all'
    ? categoryMap.get(selectedCategoryId)
    : null;
  const subCategories = selectedCategory?.children ?? [];
  const hasSubCategories = subCategories.length > 0;

  const categoryIdsToShow = useMemo(() => {
    if (selectedCategoryId === 'all') return null;
    if (hasSubCategories) {
      if (selectedSubCategoryId) return [selectedSubCategoryId];
      return [selectedCategoryId as number, ...subCategories.map((c) => c.id)];
    }
    return [selectedCategoryId as number];
  }, [selectedCategoryId, selectedSubCategoryId, hasSubCategories, subCategories]);

  const displayServices = useMemo(() => {
    if (!categoryIdsToShow) return services;
    return services.filter((s) => s.categoryId != null && categoryIdsToShow.includes(s.categoryId));
  }, [services, categoryIdsToShow]);

  const handleCategorySelect = (id: number | 'all') => {
    setSelectedCategoryId(id);
    setSelectedSubCategoryId(null);
  };

  const handleSubCategorySelect = (id: number) => {
    setSelectedSubCategoryId(id);
  };

  const handleStartProject = (service: Service) => {
    onStartProject(service);
  };

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-slate-800/60 p-12 text-center">
        <Wrench className="w-12 h-12 mx-auto mb-3 text-amber-500/50" />
        <p className="text-slate-400">No services available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-amber-200">Our Services</h2>

      {/* Main Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-amber-500/20 pb-3">
        <button
          type="button"
          onClick={() => handleCategorySelect('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            selectedCategoryId === 'all'
              ? 'bg-amber-500/30 border border-amber-500/50 text-amber-100'
              : 'border border-transparent text-slate-400 hover:text-amber-200 hover:border-amber-500/30'
          )}
        >
          All
        </button>
        {topLevel.map((cat) => {
          const IconComp = cat.iconName ? getServiceCategoryIcon(cat.iconName) : null;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2',
                selectedCategoryId === cat.id
                  ? 'bg-amber-500/30 border border-amber-500/50 text-amber-100'
                  : 'border border-transparent text-slate-400 hover:text-amber-200 hover:border-amber-500/30'
              )}
            >
              {cat.iconUrl ? (
                <img src={getImageUrl(cat.iconUrl)} alt="" className="w-4 h-4 object-contain" />
              ) : IconComp ? (
                <IconComp className="w-4 h-4" />
              ) : null}
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Sub-Category Tabs (when parent has children) */}
      {hasSubCategories && (
        <div className="flex flex-wrap gap-2 border-b border-amber-500/10 pb-3">
          <button
            type="button"
            onClick={() => setSelectedSubCategoryId(null)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              selectedSubCategoryId === null
                ? 'bg-amber-500/20 text-amber-200'
                : 'text-slate-400 hover:text-amber-200'
            )}
          >
            All in {selectedCategory?.name}
          </button>
          {subCategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSubCategorySelect(sub.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors inline-flex items-center gap-1.5',
                selectedSubCategoryId === sub.id
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-slate-400 hover:text-amber-200'
              )}
            >
              {sub.iconUrl ? (
                <img src={getImageUrl(sub.iconUrl)} alt="" className="w-3.5 h-3.5 object-contain" />
              ) : sub.iconName && getServiceCategoryIcon(sub.iconName) ? (
                (() => {
                  const SubIcon = getServiceCategoryIcon(sub.iconName!);
                  return SubIcon ? <SubIcon className="w-3.5 h-3.5" /> : null;
                })()
              ) : null}
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Services Grid */}
      {displayServices.length === 0 ? (
        <div className="py-12 text-center text-slate-400 rounded-xl border border-amber-500/20 bg-slate-800/40">
          <Wrench className="w-10 h-10 mx-auto mb-2 text-amber-500/40" />
          <p>No services in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayServices.map((service) => (
            <ServiceCard key={service.id} service={service} onStartProject={handleStartProject} />
          ))}
        </div>
      )}
    </div>
  );
}
