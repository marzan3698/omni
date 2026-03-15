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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Plus, X, Image as ImageIcon, Video, 
  Settings, Layers, ListChecks, Globe, Info, Save, Trash2, 
  ChevronRight, ExternalLink, HelpCircle
} from 'lucide-react';
import { cn, getStaticFileUrl } from '@/lib/utils';

export function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    categoryId: 0 as number,
    title: '',
    shortDescription: '',
    details: '',
    priceType: 'ONE_TIME' as 'ONE_TIME' | 'RENEWAL',
    pricing: '',
    renewalInterval: 'MONTHLY' as 'MONTHLY' | 'SIX_MONTH' | 'YEARLY',
    thumbnailType: 'IMAGE' as 'IMAGE' | 'YOUTUBE' | 'LOCAL_VIDEO',
    thumbnailUrl: '',
    gallery: [] as string[],
    currency: 'BDT' as 'BDT' | 'USD',
    isActive: true,
    attributes: {
      keyValuePairs: {} as { [key: string]: string },
      tags: [] as string[],
    },
  });

  const [newKeyValue, setNewKeyValue] = useState({ key: '', value: '' });
  const [newTag, setNewTag] = useState('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['service-categories', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const res = await serviceCategoryApi.getAll(user.companyId);
      return (res.data.data || []) as any[];
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
      
      setFormData({
        categoryId: serviceData.categoryId || 0,
        title: serviceData.title || '',
        shortDescription: serviceData.shortDescription || '',
        details: serviceData.details || '',
        priceType: serviceData.priceType || 'ONE_TIME',
        pricing: String(serviceData.pricing || ''),
        renewalInterval: serviceData.renewalInterval || 'MONTHLY',
        thumbnailType: serviceData.thumbnailType || 'IMAGE',
        thumbnailUrl: serviceData.thumbnailUrl || '',
        gallery: Array.isArray(serviceData.gallery) ? serviceData.gallery : [],
        currency: (serviceData.currency === 'USD' ? 'USD' : 'BDT') as 'BDT' | 'USD',
        isActive: serviceData.isActive !== false,
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
    const data = {
      ...formData,
      pricing: parseFloat(formData.pricing),
      renewalInterval: formData.priceType === 'RENEWAL' ? formData.renewalInterval : null,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    try {
      const res = await serviceApi.uploadThumbnail(file);
      setFormData({ ...formData, thumbnailUrl: res.data.data.thumbnailUrl });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to upload thumbnail';
      alert(errorMsg);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const res = await serviceApi.uploadGallery(files);
      setFormData({ 
        ...formData, 
        gallery: [...formData.gallery, ...res.data.data.gallery] 
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to upload gallery images';
      alert(errorMsg);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery: formData.gallery.filter((_, i) => i !== index),
    });
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
      attributes: { ...formData.attributes, keyValuePairs: newPairs },
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

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]">Loading service data...</div>;

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/services')} className="rounded-full shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEdit ? `Edit Service: ${formData.title}` : 'Add New Service'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">Service Management</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-sm font-medium text-slate-900">{isEdit ? 'Update' : 'Create'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/services')}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Update Service' : 'Publish Service'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Description Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold uppercase tracking-wider text-slate-500">Service Title</Label>
                <Input
                  id="title"
                  placeholder="Enter service name (e.g. Premium SEO Package)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-lg font-medium border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 py-6"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_desc" className="text-sm font-semibold uppercase tracking-wider text-slate-500">Short Description</Label>
                <Textarea
                  id="short_desc"
                  placeholder="A brief summary shown in catalogs..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="resize-none border-slate-200 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="details" className="text-sm font-semibold uppercase tracking-wider text-slate-500">Full Details & Content</Label>
                  <Button variant="ghost" size="sm" type="button" className="text-indigo-600 h-7 text-xs">
                    <Info className="w-3 h-3 mr-1" />
                    How to write good details?
                  </Button>
                </div>
                <Textarea
                  id="details"
                  placeholder="Describe your service in depth. Benefits, what's included, process, etc."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="min-h-[300px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Data Tabs Card */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <Tabs defaultValue="general" className="w-full">
              <div className="border-b border-slate-100 flex items-center bg-slate-50/50">
                <TabsList className="bg-transparent h-auto p-0 flex flex-wrap lg:flex-nowrap border-r border-slate-100">
                  <TabsTrigger 
                    value="general" 
                    className="flex-1 lg:flex-none py-3 px-6 rounded-none data-[state=active]:bg-white data-[state=active]:border-l-2 data-[state=active]:border-l-indigo-600 border-b lg:border-b-0 border-slate-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="media" 
                    className="flex-1 lg:flex-none py-3 px-6 rounded-none data-[state=active]:bg-white data-[state=active]:border-l-2 data-[state=active]:border-l-indigo-600 border-b lg:border-b-0 border-slate-100"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger 
                    value="attributes" 
                    className="flex-1 lg:flex-none py-3 px-6 rounded-none data-[state=active]:bg-white data-[state=active]:border-l-2 data-[state=active]:border-l-indigo-600"
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    Attributes
                  </TabsTrigger>
                </TabsList>
                <div className="px-4 py-2 flex-1">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 border-slate-200">
                    Product Data — {formData.priceType === 'ONE_TIME' ? 'Simple Service' : 'Recurring Service'}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <TabsContent value="general" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Pricing Model</Label>
                        <div className="flex flex-col gap-2">
                          <Button 
                            type="button"
                            variant={formData.priceType === 'ONE_TIME' ? 'default' : 'outline'}
                            className={cn("justify-start h-12", formData.priceType === 'ONE_TIME' && "bg-indigo-600")}
                            onClick={() => setFormData({ ...formData, priceType: 'ONE_TIME' })}
                          >
                            One-time Payment
                            <Badge variant="secondary" className="ml-auto ml-2 bg-slate-100 text-slate-600">Standard</Badge>
                          </Button>
                          <Button 
                            type="button"
                            variant={formData.priceType === 'RENEWAL' ? 'default' : 'outline'}
                            className={cn("justify-start h-12", formData.priceType === 'RENEWAL' && "bg-emerald-600 hover:bg-emerald-700")}
                            onClick={() => setFormData({ ...formData, priceType: 'RENEWAL' })}
                          >
                            Subscription / Renewal
                            <Badge variant="secondary" className="ml-auto ml-2 bg-emerald-50 text-emerald-600">Recurring</Badge>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="price">Regular Price ({formData.currency})</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                              {formData.currency === 'BDT' ? '৳' : '$'}
                            </span>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={formData.pricing}
                              onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                              className="pl-8 py-6 text-lg font-bold border-slate-200"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="curr">Currency</Label>
                          <select
                            id="curr"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                            className="bg-slate-50 border border-slate-200 rounded-md h-[52px] w-full px-2 text-sm font-medium focus:ring-0"
                          >
                            <option value="BDT">BDT</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>

                      {formData.priceType === 'RENEWAL' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Label>Renewal Interval</Label>
                          <select
                            value={formData.renewalInterval}
                            onChange={(e) => setFormData({ ...formData, renewalInterval: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 px-3 font-medium focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="MONTHLY">Every Month</option>
                            <option value="SIX_MONTH">Every 6 Months</option>
                            <option value="YEARLY">Every Year</option>
                          </select>
                          <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mt-1">
                            <HelpCircle className="w-3 h-3" />
                            CLIENT WILL BE INVOICED RECURRINGLY AT THIS INTERVAL
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="mt-0 space-y-8">
                  {/* Thumbnail Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-md font-bold text-slate-900">Featured Media (Thumbnail)</Label>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        {['IMAGE', 'YOUTUBE', 'LOCAL_VIDEO'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, thumbnailType: type as any })}
                            className={cn(
                              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                              formData.thumbnailType === type 
                                ? "bg-white text-indigo-600 shadow-sm" 
                                : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            {type.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center min-h-[220px] relative transition-colors hover:bg-slate-50 group">
                        {formData.thumbnailUrl ? (
                          <div className="w-full h-full absolute inset-0 rounded-xl overflow-hidden group">
                            {formData.thumbnailType === 'IMAGE' ? (
                              <img src={getStaticFileUrl(formData.thumbnailUrl)} className="w-full h-full object-cover" alt="Thumbnail" />
                            ) : formData.thumbnailType === 'YOUTUBE' ? (
                              <div className="w-full h-full bg-black flex items-center justify-center">
                                {(() => {
                                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                  const match = formData.thumbnailUrl.match(regExp);
                                  const videoId = (match && match[2].length === 11) ? match[2] : null;
                                  return videoId ? (
                                    <img 
                                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                      className="w-full h-full object-cover" 
                                      alt="YouTube Thumbnail"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                                      }}
                                    />
                                  ) : (
                                    <Video className="w-12 h-12 text-white/50" />
                                  );
                                })()}
                                <span className="absolute bottom-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">YouTube</span>
                              </div>
                            ) : (
                              <video src={getStaticFileUrl(formData.thumbnailUrl)} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                type="button" 
                                onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Upload featured media</p>
                            <p className="text-[11px] text-slate-400 mb-4 text-center">Recommended size: 1200x675px (16:9)</p>
                            
                            {formData.thumbnailType === 'YOUTUBE' ? (
                              <div className="w-full max-w-xs px-4">
                                <Input 
                                  placeholder="YouTube Video URL..."
                                  value={formData.thumbnailUrl}
                                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                  className="text-xs h-8 border-slate-200"
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <Button size="sm" type="button" disabled={isUploadingThumbnail} className="bg-slate-900 border-none shadow-sm relative pointer-events-none">
                                  {isUploadingThumbnail ? 'Uploading...' : 'Choose File'}
                                </Button>
                                <input 
                                  type="file" 
                                  onChange={handleThumbnailUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  accept={formData.thumbnailType === 'IMAGE' ? 'image/*' : 'video/*'}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                          <Info className="w-4 h-4 text-amber-500 mt-0.5" />
                          <div className="text-xs text-amber-700 leading-relaxed">
                            <strong>Note:</strong> Featured media is the first thing clients see in the shop. Ensure it is professional and represents your service well. Videos can increase engagement by up to 80%.
                          </div>
                        </div>
                        <ul className="text-[11px] text-slate-500 space-y-2 px-1">
                          <li className="flex items-center gap-2"><ListChecks className="w-3 h-3 text-indigo-500" /> Images support WebP, PNG, JPG (Max 5MB)</li>
                          <li className="flex items-center gap-2"><ListChecks className="w-3 h-3 text-indigo-500" /> Videos support MP4, WebM (Max 50MB)</li>
                          <li className="flex items-center gap-2"><ListChecks className="w-3 h-3 text-indigo-500" /> YouTube links are converted to embeds</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <Label className="text-md font-bold text-slate-900">Media Gallery (Images)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {formData.gallery.map((url, idx) => (
                        <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group border border-slate-200">
                          <img src={getStaticFileUrl(url)} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={`Gallery ${idx}`} />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                             <Button 
                              variant="destructive" 
                              size="icon" 
                              type="button" 
                              className="h-6 w-6 rounded-full"
                              onClick={() => removeGalleryImage(idx)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <label className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-slate-50 bg-slate-50/50 hover:border-slate-300">
                        <Plus className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Add Images</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={handleGalleryUpload}
                          className="hidden" 
                          disabled={isUploadingGallery}
                        />
                      </label>
                    </div>
                    {isUploadingGallery && <p className="text-[10px] text-indigo-600 font-bold animate-pulse uppercase tracking-wider">Uploading gallery images...</p>}
                  </div>
                </TabsContent>

                <TabsContent value="attributes" className="mt-0 space-y-8">
                   <div className="space-y-6">
                    <div>
                      <Label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Custom Specifications (Key-Value)</Label>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="md:col-span-5 space-y-1.5">
                          <Label className="text-[10px]">Attribute Name (e.g. Revision)</Label>
                          <Input
                            placeholder="Key"
                            value={newKeyValue.key}
                            onChange={(e) => setNewKeyValue({ ...newKeyValue, key: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                        <div className="md:col-span-5 space-y-1.5">
                          <Label className="text-[10px]">Value (e.g. Unlimited)</Label>
                          <Input
                            placeholder="Value"
                            value={newKeyValue.value}
                            onChange={(e) => setNewKeyValue({ ...newKeyValue, value: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button type="button" onClick={addKeyValue} className="w-full bg-slate-900">Add</Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {Object.entries(formData.attributes.keyValuePairs).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter w-24 truncate">{key}</span>
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-medium">{value}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" type="button" onClick={() => removeKeyValue(key)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Features Tags</Label>
                      <div className="mt-3 flex gap-2">
                        <Input
                          placeholder="Type feature and press plus..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="h-9"
                        />
                        <Button type="button" onClick={addTag} size="icon" className="h-9 w-9 bg-slate-900 flex-shrink-0">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.attributes.tags.map((tag) => (
                          <Badge key={tag} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                            {tag}
                            <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Sidebar Logic */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publish Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600">Publish Options</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <Save className="w-3 h-3" /> Status:
                  </span>
                  <Badge variant={formData.isActive ? "outline" : "secondary"} className={cn("text-[10px]", formData.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "")}>
                    {formData.isActive ? "Active / Published" : "Draft / Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Visibility:
                  </span>
                  <span className="text-xs font-bold text-indigo-600">Public Shopping Context</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="active_toggle" className="text-xs cursor-pointer select-none">Make Service Active</Label>
                  <Switch 
                    id="active_toggle" 
                    checked={formData.isActive} 
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" type="button" onClick={() => navigate('/services')} className="text-slate-400 text-xs">
                  Discard
                </Button>
                <Button 
                   type="submit"
                   disabled={createMutation.isPending || updateMutation.isPending}
                   className="bg-slate-900 border-none px-6"
                >
                  {isEdit ? 'Save Changes' : 'Create Service'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
               <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 underline decoration-indigo-200">Service Category</CardTitle>
                <Link to="/service-categories" className="text-[10px] font-bold text-indigo-600 hover:underline">Manage</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                {categories.length === 0 ? (
                  <div className="text-center py-8 px-4 opacity-50">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-[11px] font-medium text-slate-500">No categories found.</p>
                    <Link to="/service-categories" className="text-[10px] text-indigo-600 font-bold hover:underline">Add Category First</Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <label 
                        key={cat.id} 
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-slate-50 border border-transparent",
                          formData.categoryId === cat.id ? "bg-indigo-50 border-indigo-100 ring-1 ring-indigo-200" : ""
                        )}
                      >
                        <input 
                          type="radio" 
                          name="category"
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          checked={formData.categoryId === cat.id}
                          onChange={() => setFormData({ ...formData, categoryId: cat.id })}
                        />
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-semibold leading-none mb-0.5", formData.categoryId === cat.id ? "text-indigo-900" : "text-slate-700")}>
                            {cat.name}
                          </span>
                          {cat.parent && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {cat.parent.name}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <div className="p-6 bg-indigo-900 rounded-2xl shadow-xl shadow-indigo-200 flex flex-col items-center text-center text-white relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
            
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm mb-4">
              <Settings className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold mb-2">Service Excellence</h4>
            <p className="text-xs text-indigo-100 leading-relaxed mb-6">
              Recurring services build better long-term relationships with clients. Monthly packages often result in 3x lifetime value.
            </p>
            <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 h-10 text-xs font-bold uppercase tracking-wider">
              Marketing Guide <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

