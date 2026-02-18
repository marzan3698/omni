import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productApi, serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Package, Wrench, Briefcase } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  description: string | null;
  salePrice: string | number;
  currency: string;
  imageUrl: string | null;
  category?: { id: number; name: string };
}

interface Service {
  id: number;
  title: string;
  details: string;
  pricing: number | string;
  deliveryStartDate: string | null;
  deliveryEndDate: string | null;
  isActive?: boolean;
}

interface ProductsServicesSectionProps {
  companyId: number;
  /** When true, show only products (no services tab). Used when services are shown in ClientServicesByCategory. */
  productsOnly?: boolean;
}

export function ProductsServicesSection({ companyId, productsOnly = false }: ProductsServicesSectionProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'services'>(productsOnly ? 'products' : 'services');

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['products-list', companyId],
    queryFn: async () => {
      const response = await productApi.list(companyId);
      return response.data.data || [];
    },
    enabled: !!companyId,
  });

  const { data: servicesResponse, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
    enabled: !productsOnly,
  });

  const products = (productsResponse || []) as Product[];
  const services = (servicesResponse || []) as Service[];

  const handleStartProjectFromService = (service: Service) => {
    navigate('/client/projects');
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('open-project-form', { detail: { preSelectService: service } })
      );
    }, 100);
  };

  const handleProductCTA = () => {
    navigate('/client/projects');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-project-form'));
    }, 100);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-amber-200">
        {productsOnly ? 'Our Products' : 'Our Services & Products'}
      </h2>

      {!productsOnly && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-amber-500/20">
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'services'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-amber-200'
              )}
            >
              <Wrench className="inline w-4 h-4 mr-2 -mt-0.5" />
              Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'products'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-amber-200'
              )}
            >
              <Package className="inline w-4 h-4 mr-2 -mt-0.5" />
              Products
            </button>
          </div>

          {/* Services Tab - Pricing Table */}
          {activeTab === 'services' && (
        <div className="game-card-border rounded-xl overflow-hidden border border-amber-500/30 bg-slate-800/60">
          {servicesLoading ? (
            <div className="p-8 grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-700/50 animate-pulse rounded" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-amber-500/50" />
              <p>No services available at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-amber-500/20">
                    <th className="text-left py-4 px-4 font-semibold text-amber-200/90">Service</th>
                    <th className="text-left py-4 px-4 font-semibold text-amber-200/90 hidden md:table-cell">Details</th>
                    <th className="text-right py-4 px-4 font-semibold text-amber-200/90">Price</th>
                    <th className="text-left py-4 px-4 font-semibold text-amber-200/90 hidden lg:table-cell">Delivery</th>
                    <th className="text-right py-4 px-4 font-semibold text-amber-200/90 w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-amber-500/10 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-amber-100">{service.title}</p>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <p className="text-sm text-slate-400 line-clamp-2 max-w-xs">{service.details}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-amber-400">৳{Number(service.pricing).toLocaleString()}</span>
                        <span className="text-slate-500 text-sm ml-1">BDT</span>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell text-sm text-slate-400">
                        {service.deliveryStartDate && service.deliveryEndDate
                          ? `${new Date(service.deliveryStartDate).toLocaleDateString()} - ${new Date(service.deliveryEndDate).toLocaleDateString()}`
                          : '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleStartProjectFromService(service)}
                          className="border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
                        >
                          <Briefcase className="w-4 h-4 mr-1" />
                          Start Project
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          )}
        </>
      )}

      {/* Products Tab - E-commerce Grid */}
      {(productsOnly || activeTab === 'products') && (
        <div>
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="game-card-border rounded-xl overflow-hidden border border-amber-500/30 bg-slate-800/60">
                  <div className="h-40 bg-slate-700/50 animate-pulse" />
                  <div className="p-4">
                    <div className="h-5 bg-slate-600/50 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-slate-600/50 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-slate-400 rounded-xl border border-amber-500/30 game-card-border bg-slate-800/60">
              <Package className="w-12 h-12 mx-auto mb-3 text-amber-500/50" />
              <p>No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="game-card-border rounded-xl overflow-hidden border border-amber-500/30 bg-slate-800/60 hover:border-amber-500/50 transition-colors"
                >
                  <div className="relative h-40 bg-slate-700/50">
                    {product.imageUrl ? (
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-amber-500/50" />
                      </div>
                    )}
                    {product.category && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/30 rounded text-xs font-medium text-amber-200">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-amber-100 line-clamp-2 mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">৳{Number(product.salePrice).toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleProductCTA}
                        className="border border-amber-500/50 bg-slate-800/60 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
                      >
                        Contact for Quote
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
