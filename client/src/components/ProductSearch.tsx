import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  const selectedProducts = filteredProducts.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Products */}
      {selectedProductIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">
            Selected Products ({selectedProductIds.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm"
              >
                <Package className="w-3 h-3" />
                <span>{product.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="ml-1 hover:text-indigo-900"
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
        <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Searching...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No products found for "{debouncedSearchTerm}"
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleToggleProduct(product.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-indigo-50'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-slate-500 truncate">
                            {product.description}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-1">
                          Category: {product.category.name}
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
        <div className="text-center py-8 text-slate-500 text-sm">
          Type a product name to search and add products to this campaign
        </div>
      )}
    </div>
  );
}

