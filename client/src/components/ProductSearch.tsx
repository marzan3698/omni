import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, X, Package, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  description: string | null;
  category: {
    id: number;
    name: string;
  };
}

interface ProductSearchProps {
  companyId: number;
  selectedProductIds: number[];
  onSelectionChange: (productIds: number[]) => void;
  excludedProductIds?: number[];
}

export function ProductSearch({
  companyId,
  selectedProductIds,
  onSelectionChange,
  excludedProductIds = [],
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products-search', companyId, debouncedSearchTerm],
    queryFn: async () => {
      const response = await productApi.getAll(companyId, {
        search: debouncedSearchTerm?.trim() || undefined,
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
      return response.data.data as Product[];
    },
    enabled: !!companyId && debouncedSearchTerm.trim().length > 0,
  });

  const products = productsResponse || [];
  const filteredProducts = products.filter(
    (p) => !excludedProductIds.includes(p.id)
  );

  const handleToggleProduct = (productId: number) => {
    if (selectedProductIds.includes(productId)) {
      onSelectionChange(selectedProductIds.filter((id) => id !== productId));
    } else {
      onSelectionChange([...selectedProductIds, productId]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    onSelectionChange(selectedProductIds.filter((id) => id !== productId));
  };

  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500/50" />
        <Input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
        />
      </div>

      {/* Selected Products */}
      {selectedProductIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest">
            Selected Products ({selectedProductIds.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-sm animate-game-score-pop"
              >
                <Package className="w-3 h-3 text-amber-500/50" />
                <span className="font-medium">{product.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="ml-1 hover:text-amber-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {debouncedSearchTerm.trim() && (
        <div className="border border-amber-500/20 bg-slate-900/50 rounded-lg max-h-64 overflow-y-auto backdrop-blur-sm shadow-2xl">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-amber-200/40 animate-pulse">
              Searching...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-sm text-amber-200/40 italic">
              No products found for "{debouncedSearchTerm}"
            </div>
          ) : (
            <div className="divide-y divide-amber-500/5">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleToggleProduct(product.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-amber-500/10 transition-colors group',
                      isSelected && 'bg-amber-500/5'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center transition-all',
                          isSelected
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-amber-500/20 bg-slate-900 group-hover:border-amber-500/40'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-slate-900 font-bold" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-100 break-words">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-[10px] text-amber-200/40 truncate mt-0.5">
                            {product.description}
                          </div>
                        )}
                        <div className="text-[10px] text-amber-500/40 mt-1 uppercase tracking-widest font-bold">
                          {product.category.name}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!debouncedSearchTerm.trim() && selectedProductIds.length === 0 && (
        <div className="text-center py-8 text-amber-200/40 text-sm italic">
          Type a product name to search and add products to this campaign
        </div>
      )}
    </div>
  );
}
