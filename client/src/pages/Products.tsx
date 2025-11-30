import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productApi, productCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Plus, Edit, Trash2, Package, Search, Eye } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  purchasePrice: string | number;
  salePrice: string | number;
  currency: 'BDT' | 'USD';
  productCompany: string | null;
  imageUrl: string | null;
  category: {
    id: number;
    name: string;
  };
  quickReplies: Array<{ type: 'attribute' | 'sales'; key?: string; value: string }> | null;
  createdAt: string;
  updatedAt: string;
}

export default function Products() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

  // Fetch products
  const { data: productsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['products', user?.companyId, selectedCategory, searchTerm],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const filters: any = {};
      if (selectedCategory) filters.categoryId = selectedCategory;
      if (searchTerm) filters.search = searchTerm;
      const response = await productApi.getAll(user.companyId, filters);
      return response.data.data as Product[];
    },
    enabled: !!user?.companyId,
  });

  // Fetch categories for filter
  const { data: categoriesResponse } = useQuery({
    queryKey: ['product-categories', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productCategoryApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const products = productsResponse || [];
  const categories = categoriesResponse || [];

  // Delete mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id, user?.companyId || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Product deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const formatPrice = (price: string | number, currency: 'BDT' | 'USD') => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const symbol = currency === 'BDT' ? '৳' : '$';
    return `${symbol}${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <PermissionGuard 
      permission="can_manage_products"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to access this page.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600 mt-1">Manage your product inventory</p>
          </div>
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500">No products found</p>
                <Button onClick={() => navigate('/products/new')} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Image</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Purchase Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Sale Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5001${product.imageUrl}`}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-slate-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            {product.category.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-700">
                            {formatPrice(product.purchasePrice, product.currency)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-green-600">
                            {formatPrice(product.salePrice, product.currency)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600">
                            {product.productCompany || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/products/${product.id}`)}
                              title="View Product"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/products/${product.id}/edit`)}
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

