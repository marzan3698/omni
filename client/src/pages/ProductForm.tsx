import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi, productCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ArrowLeft, ArrowRight, X, Plus, Trash2, Upload, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickReply {
  type: 'attribute' | 'sales';
  key?: string;
  value: string;
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'attribute' | 'sales'>('attribute');

  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    description: '',
    purchasePrice: '',
    salePrice: '',
    currency: 'BDT' as 'BDT' | 'USD',
    // Step 2
    categoryId: '',
    productCompany: '',
    imageUrl: '',
    // Step 3
    quickReplies: [] as QuickReply[],
  });

  // Fetch product if editing
  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id, user?.companyId],
    queryFn: async () => {
      if (!id || !user?.companyId) return null;
      const response = await productApi.getById(parseInt(id), user.companyId);
      return response.data.data;
    },
    enabled: !!id && !!user?.companyId,
  });

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['product-categories', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const response = await productCategoryApi.getAll(user.companyId);
      return response.data.data || [];
    },
    enabled: !!user?.companyId,
  });

  const categories = categoriesResponse || [];

  // Load product data when editing
  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        purchasePrice: String(productData.purchasePrice || ''),
        salePrice: String(productData.salePrice || ''),
        currency: productData.currency || 'BDT',
        categoryId: String(productData.categoryId || ''),
        productCompany: productData.productCompany || '',
        imageUrl: productData.imageUrl || '',
        quickReplies: (productData.quickReplies as QuickReply[]) || [],
      });
      if (productData.imageUrl) {
        setImagePreview(productData.imageUrl.startsWith('http') ? productData.imageUrl : `http://localhost:5001${productData.imageUrl}`);
      }
    }
  }, [productData]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image
  const uploadImage = async (): Promise<string> => {
    if (!imageFile) {
      return formData.imageUrl;
    }

    setUploadingImage(true);
    try {
      const response = await productApi.uploadImage(imageFile);
      return response.data.data.imageUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload image first if new file selected
      if (imageFile) {
        try {
          const imageUrl = await uploadImage();
          data.imageUrl = imageUrl || undefined;
        } catch (error) {
          // If image upload fails, continue without image
          console.error('Image upload failed:', error);
          data.imageUrl = undefined;
        }
      } else {
        // If no new image file, use existing imageUrl or undefined
        data.imageUrl = formData.imageUrl || undefined;
      }

      if (id) {
        return productApi.update(parseInt(id), data, user?.companyId || 0);
      }
      return productApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      alert(id ? 'Product updated successfully!' : 'Product created successfully!');
      navigate('/products');
    },
    onError: (error: any) => {
      console.error('Product save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save product';
      alert(errorMessage);
    },
  });

  // Validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        alert('Product name is required');
        return false;
      }
      if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
        alert('Purchase price must be greater than 0');
        return false;
      }
      if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
        alert('Sale price must be greater than 0');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.categoryId) {
        alert('Product category is required');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 3));
    }
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    if (!user?.companyId) {
      alert('User company ID is missing');
      return;
    }

    const submitData: any = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      purchasePrice: parseFloat(formData.purchasePrice),
      salePrice: parseFloat(formData.salePrice),
      currency: formData.currency,
      categoryId: parseInt(formData.categoryId),
      productCompany: formData.productCompany?.trim() || undefined,
      quickReplies: formData.quickReplies.length > 0 ? formData.quickReplies : undefined,
    };
    
    // Only include imageUrl if it has a value (will be set by mutation if image is uploaded)
    // Don't include it here to avoid sending empty strings

    saveProductMutation.mutate(submitData);
  };

  // Quick reply handlers
  const addQuickReply = () => {
    const newReply: QuickReply = {
      type: activeTab,
      key: activeTab === 'attribute' ? '' : undefined,
      value: '',
    };
    setFormData({
      ...formData,
      quickReplies: [...formData.quickReplies, newReply],
    });
  };

  const removeQuickReply = (index: number) => {
    setFormData({
      ...formData,
      quickReplies: formData.quickReplies.filter((_, i) => i !== index),
    });
  };

  const updateQuickReply = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...formData.quickReplies];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, quickReplies: updated });
  };

  if (loadingProduct && id) {
    return (
      <PermissionGuard permission="can_manage_products">
        <div className="text-center py-8">Loading product...</div>
      </PermissionGuard>
    );
  }

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
            <h1 className="text-3xl font-bold text-slate-900">
              {id ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-slate-600 mt-1">
              {id ? 'Update product information' : 'Create a new product in 3 simple steps'}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Step Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                        currentStep === step
                          ? 'bg-indigo-600 text-white'
                          : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {currentStep > step ? '✓' : step}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <div
                        className={cn(
                          'text-sm font-medium',
                          currentStep === step ? 'text-indigo-600' : 'text-gray-600'
                        )}
                      >
                        {step === 1 && 'Basic Information'}
                        {step === 2 && 'Category & Image'}
                        {step === 3 && 'Quick Replies'}
                      </div>
                    </div>
                  </div>
                  {step < 3 && (
                    <div
                      className={cn(
                        'flex-1 h-1 mx-4',
                        currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep} of 3: {' '}
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Category & Image'}
              {currentStep === 3 && 'Quick Replies'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Only submit on step 3
              if (currentStep === 3) {
                handleSubmit(e);
              }
            }} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Product Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter product description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="purchasePrice">Purchase Price *</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="salePrice">Sale Price *</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'BDT' | 'USD' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Category & Image */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryId">Product Category *</Label>
                    <select
                      id="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="productCompany">Product Company</Label>
                    <Input
                      id="productCompany"
                      value={formData.productCompany}
                      onChange={(e) => setFormData({ ...formData, productCompany: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Product Image</Label>
                    <div className="mt-2">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        {imageFile ? 'Change Image' : 'Upload Image'}
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Quick Replies */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab('attribute')}
                      className={cn(
                        'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                        activeTab === 'attribute'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      )}
                    >
                      Attributes
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sales')}
                      className={cn(
                        'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                        activeTab === 'sales'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      )}
                    >
                      Sales Messages
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.quickReplies
                      .filter((qr) => qr.type === activeTab)
                      .map((qr, index) => {
                        const globalIndex = formData.quickReplies.findIndex((q) => q === qr);
                        return (
                          <div key={globalIndex} className="flex gap-2 items-start p-3 border border-gray-200 rounded-md">
                            {activeTab === 'attribute' && (
                              <div className="flex-1">
                                <Input
                                  placeholder="Key (e.g., Color)"
                                  value={qr.key || ''}
                                  onChange={(e) => updateQuickReply(globalIndex, 'key', e.target.value)}
                                  className="mb-2"
                                />
                                <Input
                                  placeholder="Value (e.g., Red)"
                                  value={qr.value}
                                  onChange={(e) => updateQuickReply(globalIndex, 'value', e.target.value)}
                                />
                              </div>
                            )}
                            {activeTab === 'sales' && (
                              <Input
                                placeholder="Sales message (e.g., Limited stock available!)"
                                value={qr.value}
                                onChange={(e) => updateQuickReply(globalIndex, 'value', e.target.value)}
                                className="flex-1"
                              />
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuickReply(globalIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}

                    <Button type="button" variant="outline" onClick={addQuickReply} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add {activeTab === 'attribute' ? 'Attribute' : 'Sales Message'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePrevious(e);
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentStep < 3 ? (
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNext(e);
                      }}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={saveProductMutation.isPending || uploadingImage}>
                      {uploadingImage
                        ? 'Uploading Image...'
                        : saveProductMutation.isPending
                        ? 'Saving...'
                        : id
                        ? 'Update Product'
                        : 'Create Product'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

