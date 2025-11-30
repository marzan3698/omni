import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ArrowLeft, Edit, Package, DollarSign, Building2, Image as ImageIcon, Tag, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch product
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) return null;
      const response = await productApi.getById(parseInt(id), user.companyId);
      return response.data.data as Product;
    },
    enabled: !!id && !!user?.companyId,
  });

  const formatPrice = (price: string | number, currency: 'BDT' | 'USD') => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const symbol = currency === 'BDT' ? '৳' : '$';
    return `${symbol}${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateProfit = () => {
    if (!productData) return null;
    const purchase = typeof productData.purchasePrice === 'string' 
      ? parseFloat(productData.purchasePrice) 
      : productData.purchasePrice;
    const sale = typeof productData.salePrice === 'string' 
      ? parseFloat(productData.salePrice) 
      : productData.salePrice;
    return sale - purchase;
  };

  const calculateProfitMargin = () => {
    if (!productData) return null;
    const purchase = typeof productData.purchasePrice === 'string' 
      ? parseFloat(productData.purchasePrice) 
      : productData.purchasePrice;
    const sale = typeof productData.salePrice === 'string' 
      ? parseFloat(productData.salePrice) 
      : productData.salePrice;
    if (purchase === 0) return 0;
    return ((sale - purchase) / purchase) * 100;
  };

  const profit = calculateProfit();
  const profitMargin = calculateProfitMargin();

  if (isLoading) {
    return (
      <PermissionGuard permission="can_manage_products">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-pulse" />
            <p className="text-slate-600">Loading product...</p>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  if (error || !productData) {
    return (
      <PermissionGuard permission="can_manage_products">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
            <p className="text-slate-600 mb-4">
              {error instanceof Error ? error.message : 'The product you are looking for does not exist.'}
            </p>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  const attributes = productData.quickReplies?.filter(qr => qr.type === 'attribute') || [];
  const salesMessages = productData.quickReplies?.filter(qr => qr.type === 'sales') || [];

  return (
    <PermissionGuard 
      permission="can_manage_products"
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You don't have permission to view this product.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{productData.name}</h1>
              <p className="text-slate-600 mt-1">Product Details</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/products/${productData.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productData.imageUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={productData.imageUrl.startsWith('http') 
                        ? productData.imageUrl 
                        : `http://localhost:5001${productData.imageUrl}`}
                      alt={productData.name}
                      className="w-full max-w-md h-auto rounded-lg border border-gray-200 shadow-sm object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {productData.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{productData.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Replies - Attributes */}
            {attributes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Product Attributes
                  </CardTitle>
                  <CardDescription>Key-value pairs for product attributes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
                      >
                        <div className="text-sm font-medium text-indigo-900 mb-1">
                          {attr.key || 'Attribute'}
                        </div>
                        <div className="text-base text-indigo-700">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Replies - Sales Messages */}
            {salesMessages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Sales Messages
                  </CardTitle>
                  <CardDescription>Quick reply messages for sales conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesMessages.map((msg, index) => (
                      <div
                        key={index}
                        className="p-4 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <p className="text-green-900">{msg.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <DollarSign className="w-5 h-5" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Purchase Price</span>
                    <span className="text-lg font-semibold text-slate-900">
                      {formatPrice(productData.purchasePrice, productData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Sale Price</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatPrice(productData.salePrice, productData.currency)}
                    </span>
                  </div>
                  <div className="border-t border-indigo-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Profit</span>
                      <span className={cn(
                        "text-lg font-bold",
                        profit && profit > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {profit !== null ? formatPrice(profit, productData.currency) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500">Profit Margin</span>
                      <span className={cn(
                        "text-sm font-semibold",
                        profitMargin && profitMargin > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-indigo-200">
                  <div className="text-xs text-slate-500">Currency</div>
                  <div className="text-sm font-medium text-indigo-700 mt-1">
                    {productData.currency === 'BDT' ? 'Bangladeshi Taka (৳)' : 'US Dollar ($)'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Company */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Category</div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium">
                      {productData.category.name}
                    </span>
                  </div>
                </div>
                {productData.productCompany && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Company</div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{productData.productCompany}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product ID</span>
                  <span className="font-mono text-slate-700">#{productData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-700">
                    {new Date(productData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="text-slate-700">
                    {new Date(productData.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

