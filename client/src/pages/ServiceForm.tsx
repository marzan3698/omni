import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { serviceApi, serviceCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { formatDaysToMonthsDays } from '@/lib/utils';

export function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    categoryId: 0 as number,
    title: '',
    details: '',
    pricing: '',
    useDeliveryDate: true,
    durationDays: '' as string,
    deliveryStartDate: '',
    deliveryEndDate: '',
    currency: 'BDT' as 'BDT' | 'USD',
    attributes: {
      keyValuePairs: {} as { [key: string]: string },
      tags: [] as string[],
    },
  });

  const [newKeyValue, setNewKeyValue] = useState({ key: '', value: '' });
  const [newTag, setNewTag] = useState('');

  const { data: categoriesResponse } = useQuery({
    queryKey: ['service-categories', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const res = await serviceCategoryApi.getAll(user.companyId);
      return (res.data.data || []) as { id: number; name: string; parent?: { name: string } | null }[];
    },
    enabled: !!user?.companyId,
  });

  const categories = categoriesResponse || [];

  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await serviceApi.getById(parseInt(id));
      return response.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (serviceData) {
      const attributes = typeof serviceData.attributes === 'string'
        ? JSON.parse(serviceData.attributes)
        : serviceData.attributes;
      const useDelivery = serviceData.useDeliveryDate !== false;
      const catId = serviceData.categoryId ?? serviceData.category?.id ?? 0;
      setFormData({
        categoryId: catId,
        title: serviceData.title || '',
        details: serviceData.details || '',
        pricing: String(serviceData.pricing || ''),
        useDeliveryDate: useDelivery,
        durationDays: serviceData.durationDays != null ? String(serviceData.durationDays) : '',
        deliveryStartDate: serviceData.deliveryStartDate
          ? new Date(serviceData.deliveryStartDate).toISOString().split('T')[0]
          : '',
        deliveryEndDate: serviceData.deliveryEndDate
          ? new Date(serviceData.deliveryEndDate).toISOString().split('T')[0]
          : '',
        currency: (serviceData.currency === 'USD' ? 'USD' : 'BDT') as 'BDT' | 'USD',
        attributes: {
          keyValuePairs: attributes?.keyValuePairs || {},
          tags: attributes?.tags || [],
        },
      });
    }
  }, [serviceData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => serviceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      navigate('/services');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => serviceApi.update(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      navigate('/services');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId && categories.length > 0) {
      alert('Please select a category');
      return;
    }
    const data: Record<string, unknown> = {
      categoryId: formData.categoryId || undefined,
      title: formData.title,
      details: formData.details,
      pricing: parseFloat(formData.pricing),
      useDeliveryDate: formData.useDeliveryDate,
      currency: formData.currency,
      attributes: formData.attributes,
    };
    if (formData.useDeliveryDate) {
      data.deliveryStartDate = formData.deliveryStartDate || undefined;
      data.deliveryEndDate = formData.deliveryEndDate || undefined;
    } else {
      data.durationDays = formData.durationDays ? parseInt(formData.durationDays, 10) : undefined;
      data.deliveryStartDate = undefined;
      data.deliveryEndDate = undefined;
    }

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addKeyValue = () => {
    if (newKeyValue.key && newKeyValue.value) {
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          keyValuePairs: {
            ...formData.attributes.keyValuePairs,
            [newKeyValue.key]: newKeyValue.value,
          },
        },
      });
      setNewKeyValue({ key: '', value: '' });
    }
  };

  const removeKeyValue = (key: string) => {
    const newPairs = { ...formData.attributes.keyValuePairs };
    delete newPairs[key];
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        keyValuePairs: newPairs,
      },
    });
  };

  const addTag = () => {
    if (newTag && !formData.attributes.tags.includes(newTag)) {
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          tags: [...formData.attributes.tags, newTag],
        },
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        tags: formData.attributes.tags.filter((t) => t !== tag),
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/services')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Services
      </Button>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Service' : 'Create New Service'}</CardTitle>
          <CardDescription>
            {isEdit ? 'Update service details' : 'Add a new digital marketing service'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value, 10) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} › ${c.name}` : c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No categories yet. <Link to="/service-categories" className="underline">Add a service category</Link> first.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="details">Details *</Label>
              <textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricing">Pricing *</Label>
                <Input
                  id="pricing"
                  type="number"
                  step="0.01"
                  value={formData.pricing}
                  onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'BDT' | 'USD' })}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                >
                  <option value="BDT">BDT (টাকা ৳)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="useDeliveryDate">ডেলিভারি ডেট ব্যবহার করুন</Label>
                <p className="text-sm text-slate-500">অফ করলে Duration (দিন) ব্যবহার হবে</p>
              </div>
              <Switch
                id="useDeliveryDate"
                checked={formData.useDeliveryDate}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, useDeliveryDate: checked })
                }
              />
            </div>

            {formData.useDeliveryDate ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryStartDate">Delivery Start Date *</Label>
                  <Input
                    id="deliveryStartDate"
                    type="date"
                    value={formData.deliveryStartDate}
                    onChange={(e) => setFormData({ ...formData, deliveryStartDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryEndDate">Delivery End Date *</Label>
                  <Input
                    id="deliveryEndDate"
                    type="date"
                    value={formData.deliveryEndDate}
                    onChange={(e) => setFormData({ ...formData, deliveryEndDate: e.target.value })}
                    min={formData.deliveryStartDate}
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="durationDays">Duration (দিন) *</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  placeholder="যেমন: 40"
                  required={!formData.useDeliveryDate}
                />
                {formData.durationDays && (
                  <p className="text-sm text-indigo-600 mt-1">
                    মেয়াদ: {formatDaysToMonthsDays(parseInt(formData.durationDays, 10) || 0)}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Attributes - Key-Value Pairs</Label>
              <p className="text-sm text-slate-500 mt-1 mb-2">
                Value এ &apos;yes&apos; বা &apos;no&apos; দিলে ক্লায়েন্ট ড্যাশবোর্ডে যথাক্রমে ✓ (টিক) ও ✗ (ক্রস) চিহ্ন দেখাবে।
              </p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={newKeyValue.key}
                    onChange={(e) => setNewKeyValue({ ...newKeyValue, key: e.target.value })}
                  />
                  <Input
                    placeholder="Value"
                    value={newKeyValue.value}
                    onChange={(e) => setNewKeyValue({ ...newKeyValue, value: e.target.value })}
                  />
                  <Button type="button" onClick={addKeyValue}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {Object.entries(formData.attributes.keyValuePairs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="flex-1">
                      <strong>{key}:</strong> {value}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeKeyValue(key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Attributes - Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tag name"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.attributes.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  (!isEdit && categories.length === 0)
                }
              >
                {isEdit ? 'Update Service' : 'Create Service'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/services')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

