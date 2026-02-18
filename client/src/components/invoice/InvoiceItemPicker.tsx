import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { DashboardWidgetCard } from '@/components/DashboardWidgetCard';
import { GameCard } from '@/components/GameCard';
import { Plus, Search, Info, X } from 'lucide-react';
import { formatCurrencyWithSymbol, formatDaysToMonthsDays } from '@/lib/utils';
import { cn } from '@/lib/utils';

const inputDark =
  'bg-slate-800/60 border-amber-500/20 text-amber-100 placeholder:text-amber-200/40 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 rounded-lg';

interface ProductDetail {
  id: number;
  name: string;
  description?: string;
  salePrice: number | string;
  purchasePrice?: number | string;
  currency?: string;
  productCompany?: string;
  imageUrl?: string;
  category?: { name?: string };
}

interface ServiceDetail {
  id: number;
  title: string;
  details?: string;
  pricing: number | string;
  currency?: string;
  useDeliveryDate?: boolean;
  durationDays?: number;
  deliveryStartDate?: string;
  deliveryEndDate?: string;
  attributes?: { keyValuePairs?: Record<string, string>; tags?: string[] } | string;
}

interface InvoiceItemPickerProps {
  products: ProductDetail[];
  services: ServiceDetail[];
  productSearch: string;
  serviceSearch: string;
  onProductSearchChange: (v: string) => void;
  onServiceSearchChange: (v: string) => void;
  onAddProduct: (p: { id: number; name: string; salePrice: number }) => void;
  onAddService: (s: { id: number; title: string; pricing: number }) => void;
  onAddCustom: () => void;
  /** Sidebar layout for POS: single column, left side */
  sidebar?: boolean;
}

export function InvoiceItemPicker({
  products,
  services,
  productSearch,
  serviceSearch,
  onProductSearchChange,
  onServiceSearchChange,
  onAddProduct,
  onAddService,
  onAddCustom,
  sidebar = false,
}: InvoiceItemPickerProps) {
  const [detailProduct, setDetailProduct] = useState<ProductDetail | null>(null);
  const [detailService, setDetailService] = useState<ServiceDetail | null>(null);

  return (
    <DashboardWidgetCard index={0} className={sidebar ? 'p-4 h-full flex flex-col min-h-0' : 'p-6'}>
      <h3 className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wider flex-shrink-0">
        Add Items
      </h3>
      <div className={cn(
        'gap-4',
        sidebar ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'grid md:grid-cols-2'
      )}>
        {/* Products */}
        <div className={cn('flex flex-col', sidebar && 'min-h-0 flex-1')}>
          <div className="flex items-center justify-between mb-2 gap-2 flex-shrink-0">
            <span className="text-amber-200/80 text-sm">Products</span>
            <div className={cn('relative', sidebar ? 'flex-1 min-w-0' : 'flex-1 min-w-[200px] max-w-[320px]')}>
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-amber-400/60" />
              <Input
                placeholder="প্রোডাক্ট সার্চ..."
                value={productSearch}
                onChange={(e) => onProductSearchChange(e.target.value)}
                className={cn('pl-7 h-8 text-sm w-full', inputDark)}
              />
            </div>
          </div>
          <div className={cn('flex flex-wrap gap-2', sidebar && 'overflow-y-auto flex-1 min-h-0')}>
            {products.slice(0, 12).map((p, i) => (
              <GameCard key={p.id} index={i} hover className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onAddProduct({
                      id: p.id,
                      name: p.name,
                      salePrice: Number(p.salePrice),
                    })
                  }
                  className="px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  {p.name} - {formatCurrencyWithSymbol(p.salePrice, 'BDT')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailProduct(p);
                    setDetailService(null);
                  }}
                  className="p-1 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/20 rounded transition-colors"
                  title="বিস্তারিত দেখুন"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </GameCard>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className={cn('flex flex-col', sidebar && 'min-h-0 flex-1')}>
          <div className="flex items-center justify-between mb-2 gap-2 flex-shrink-0">
            <span className="text-amber-200/80 text-sm">Services</span>
            <div className={cn('relative', sidebar ? 'flex-1 min-w-0' : 'flex-1 min-w-[200px] max-w-[320px]')}>
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-amber-400/60" />
              <Input
                placeholder="সার্ভিস সার্চ..."
                value={serviceSearch}
                onChange={(e) => onServiceSearchChange(e.target.value)}
                className={cn('pl-7 h-8 text-sm w-full', inputDark)}
              />
            </div>
          </div>
          <div className={cn('gap-2', sidebar ? 'grid grid-cols-1 overflow-y-auto flex-1 min-h-0 content-start' : 'grid sm:grid-cols-2')}>
            {services.map((s, i) => (
              <GameCard key={s.id} index={i} hover className="flex">
                <button
                  type="button"
                  onClick={() =>
                    onAddService({
                      id: s.id,
                      title: s.title,
                      pricing: Number(s.pricing),
                    })
                  }
                  className="flex-1 text-left p-3 hover:bg-amber-500/10 rounded-lg transition-colors min-w-0"
                >
                  <span className="font-medium text-amber-100 truncate block">
                    {s.title}
                  </span>
                  <span className="text-xs text-amber-400">
                    {formatCurrencyWithSymbol(s.pricing, s.currency === 'USD' ? 'USD' : 'BDT')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailService(s);
                    setDetailProduct(null);
                  }}
                  className="p-2 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/20 rounded transition-colors flex-shrink-0"
                  title="বিস্তারিত দেখুন"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </GameCard>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddCustom}
        className={cn('flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0', sidebar ? 'mt-2' : 'mt-4')}
      >
        <Plus className="w-4 h-4" />
        Add Custom Item
      </button>

      {/* Product Detail Modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="game-panel rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden border border-amber-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
              <h4 className="font-semibold text-amber-100">প্রোডাক্ট বিস্তারিত</h4>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="p-2 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-3">
              <div>
                <span className="text-amber-200/70 text-xs">নাম</span>
                <p className="text-amber-100 font-medium">{detailProduct.name}</p>
              </div>
              {detailProduct.description && (
                <div>
                  <span className="text-amber-200/70 text-xs">বিবরণ</span>
                  <p className="text-amber-100 text-sm">{detailProduct.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-amber-200/70 text-xs">বিক্রয়মূল্য</span>
                  <p className="text-amber-100 font-semibold">
                    {formatCurrencyWithSymbol(detailProduct.salePrice, 'BDT')}
                  </p>
                </div>
                {detailProduct.purchasePrice != null && (
                  <div>
                    <span className="text-amber-200/70 text-xs">ক্রয়মূল্য</span>
                    <p className="text-amber-100">
                      {formatCurrencyWithSymbol(detailProduct.purchasePrice, 'BDT')}
                    </p>
                  </div>
                )}
              </div>
              {detailProduct.category?.name && (
                <div>
                  <span className="text-amber-200/70 text-xs">ক্যাটেগরি</span>
                  <p className="text-amber-100">{detailProduct.category.name}</p>
                </div>
              )}
              {detailProduct.productCompany && (
                <div>
                  <span className="text-amber-200/70 text-xs">কোম্পানি</span>
                  <p className="text-amber-100">{detailProduct.productCompany}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => {
                  onAddProduct({
                    id: detailProduct.id,
                    name: detailProduct.name,
                    salePrice: Number(detailProduct.salePrice),
                  });
                  setDetailProduct(null);
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 font-medium rounded-lg"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                ইনভয়েসে যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {detailService && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDetailService(null)}
        >
          <div
            className="game-panel rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden border border-amber-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
              <h4 className="font-semibold text-amber-100">সার্ভিস বিস্তারিত</h4>
              <button
                type="button"
                onClick={() => setDetailService(null)}
                className="p-2 rounded-lg text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-3">
              <div>
                <span className="text-amber-200/70 text-xs">শিরোনাম</span>
                <p className="text-amber-100 font-medium">{detailService.title}</p>
              </div>
              {detailService.details && (
                <div>
                  <span className="text-amber-200/70 text-xs">বিবরণ</span>
                  <p className="text-amber-100 text-sm whitespace-pre-wrap">
                    {detailService.details}
                  </p>
                </div>
              )}
              <div>
                <span className="text-amber-200/70 text-xs">মূল্য</span>
                <p className="text-amber-100 font-semibold">
                  {formatCurrencyWithSymbol(
                    detailService.pricing,
                    detailService.currency === 'USD' ? 'USD' : 'BDT'
                  )}
                </p>
              </div>
              {detailService.useDeliveryDate &&
                detailService.deliveryStartDate &&
                detailService.deliveryEndDate && (
                  <div>
                    <span className="text-amber-200/70 text-xs">মেয়াদ</span>
                    <p className="text-amber-100 text-sm">
                      {new Date(detailService.deliveryStartDate).toLocaleDateString()} –{' '}
                      {new Date(detailService.deliveryEndDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              {!detailService.useDeliveryDate && detailService.durationDays && (
                <div>
                  <span className="text-amber-200/70 text-xs">মেয়াদ</span>
                  <p className="text-amber-100 text-sm">
                    {formatDaysToMonthsDays(detailService.durationDays)}
                  </p>
                </div>
              )}
              {(() => {
                const attrs =
                  typeof detailService.attributes === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(detailService.attributes);
                        } catch {
                          return null;
                        }
                      })()
                    : detailService.attributes;
                return attrs?.tags && attrs.tags.length > 0 ? (
                  <div key="tags">
                    <span className="text-amber-200/70 text-xs">ট্যাগ</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attrs.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-amber-500/20 text-amber-200 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
              {(() => {
                const attrs =
                  typeof detailService.attributes === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(detailService.attributes);
                        } catch {
                          return null;
                        }
                      })()
                    : detailService.attributes;
                return attrs?.keyValuePairs &&
                  Object.keys(attrs.keyValuePairs).length > 0 ? (
                  <div>
                    <span className="text-amber-200/70 text-xs">অ্যাট্রিবিউট</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(attrs.keyValuePairs).map(([key, value]) => (
                        <div key={key} className="text-sm text-amber-100">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="p-4 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => {
                  onAddService({
                    id: detailService.id,
                    title: detailService.title,
                    pricing: Number(detailService.pricing),
                  });
                  setDetailService(null);
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 font-medium rounded-lg"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                ইনভয়েসে যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardWidgetCard>
  );
}
