import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { getStaticFileUrl, cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Zap, 
  Star, 
  CheckCircle2, 
  Package, 
  Globe, 
  Tag, 
  Play, 
  ChevronRight,
  Clock,
  ShieldCheck,
  Award,
  Video
} from 'lucide-react';

interface Service {
  id: number;
  title: string;
  shortDescription: string | null;
  details: string;
  pricing: number | string;
  priceType: 'ONE_TIME' | 'RECURRING';
  renewalInterval: 'MONTHLY' | 'SIX_MONTH' | 'YEARLY' | null;
  thumbnailType: 'IMAGE' | 'YOUTUBE' | 'LOCAL_VIDEO';
  thumbnailUrl: string | null;
  gallery: string[];
  attributes: {
    keyValuePairs?: Record<string, string>;
    tags?: string[];
  };
  category: {
    id: number;
    name: string;
  };
  currency: 'BDT' | 'USD';
}

export default function ServiceView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0); 
  const [isAdded, setIsAdded] = useState(false);

  // Fetch service
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id, user?.companyId],
    queryFn: async () => {
      if (!id) return null;
      const response = await serviceApi.getById(parseInt(id));
      return response.data.data as Service;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading premium service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Package className="w-20 h-20 text-red-500/20 mb-6" />
        <h2 className="text-3xl font-extrabold text-white mb-2">Service Not Found</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          The service you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Button 
          onClick={() => navigate('/client/dashboard')}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Shop
        </Button>
      </div>
    );
  }

  const allMedia = [
    { type: service.thumbnailType, url: service.thumbnailUrl },
    ...(service.gallery || []).map(url => ({ type: 'IMAGE' as const, url }))
  ].filter(m => m.url);

  const currentMedia = allMedia[activeMediaIndex] || allMedia[0];

  const getYTId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentYTId = currentMedia?.type === 'YOUTUBE' ? getYTId(currentMedia.url!) : null;

  const handleAddToCart = () => {
    addToCart(service);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(service);
    navigate('/client/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <button onClick={() => navigate('/client/dashboard')} className="hover:text-amber-500 transition-colors">Shop</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-400">{service.category.name}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-amber-500">{service.title}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Media Section */}
        <div className="space-y-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 relative group shadow-2xl shadow-black/50">
            {currentYTId ? (
              <iframe
                src={`https://www.youtube.com/embed/${currentYTId}?autoplay=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : currentMedia?.type === 'LOCAL_VIDEO' ? (
              <video 
                src={getStaticFileUrl(currentMedia.url!)} 
                controls 
                autoPlay 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={getStaticFileUrl(currentMedia?.url || '')} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={service.title}
              />
            )}
            
            {/* Action Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="px-4 py-1.5 bg-amber-500/90 text-slate-900 text-xs font-black uppercase tracking-widest rounded-full backdrop-blur-md">
                Featured
              </div>
              {service.priceType === 'RECURRING' && (
                <div className="px-4 py-1.5 bg-blue-500/90 text-white text-xs font-black uppercase tracking-widest rounded-full backdrop-blur-md">
                   {service.renewalInterval?.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {allMedia.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {allMedia.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={cn(
                    "relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300",
                    idx === activeMediaIndex 
                      ? "border-amber-500 scale-105 shadow-lg shadow-amber-500/20" 
                      : "border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600"
                  )}
                >
                  {media.type === 'YOUTUBE' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-amber-500">
                      <Play className="w-8 h-8 fill-amber-500" />
                    </div>
                  ) : media.type === 'LOCAL_VIDEO' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-amber-500">
                      <Video className="w-8 h-8 fill-amber-500 text-amber-500" />
                    </div>
                  ) : (
                    <img src={getStaticFileUrl(media.url!)} className="w-full h-full object-cover" alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Section */}
        <div className="flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
              </div>
              <span className="text-slate-500 text-sm font-semibold">4.9 (1,240 Reviews)</span>
              <span className="text-slate-800 mx-2">•</span>
              <span className="text-emerald-500 text-sm font-bold">12k+ Projects Delivered</span>
            </div>
            
            <h1 className="text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              {service.title}
            </h1>
            
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              {service.shortDescription || 'Experience premium service quality with our expert solutions tailored for your business needs.'}
            </p>
          </div>

          {/* Pricing & Actions */}
          <Card className="bg-slate-900/50 border-slate-800 rounded-3xl mb-8 overflow-hidden backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-amber-500">৳{Number(service.pricing).toLocaleString()}</span>
                <span className="text-slate-500 text-lg">/ {service.priceType === 'RECURRING' ? service.renewalInterval?.toLowerCase().replace('_', ' ') : 'Fixed Price'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                    <div className="text-sm">
                        <p className="text-white font-bold">Safe & Secure</p>
                        <p className="text-slate-500">100% Protection</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <Award className="w-6 h-6 text-amber-500" />
                    <div className="text-sm">
                        <p className="text-white font-bold">Top Quality</p>
                        <p className="text-slate-500">Hand-picked Experts</p>
                    </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleAddToCart}
                  size="lg" 
                  variant="outline"
                  className={cn(
                    "flex-1 h-16 rounded-2xl border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-slate-900 transition-all text-lg font-black tracking-wide",
                    isAdded && "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:text-white"
                  )}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 mr-3" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6 mr-3" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleBuyNow}
                  size="lg"
                  className="flex-1 h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-lg font-black tracking-wide shadow-xl shadow-amber-500/20"
                >
                  <Zap className="w-6 h-6 mr-3 fill-slate-900" />
                  Order Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          {service.attributes.keyValuePairs && Object.keys(service.attributes.keyValuePairs).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                Service Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(service.attributes.keyValuePairs).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{key}:</span>
                    <span className="text-white text-sm font-bold truncate">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details/Description */}
      <div className="pt-12 border-t border-slate-800">
        <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
          <Globe className="w-8 h-8 text-amber-500" />
          Comprehensive Details
        </h2>
        <Card className="bg-slate-900/30 border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-8 md:p-12">
            <div 
              className="prose prose-invert prose-amber max-w-none text-slate-300 leading-loose text-lg"
              dangerouslySetInnerHTML={{ __html: service.details }} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Trust Badges Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-slate-800 opacity-50">
        <div className="flex flex-col items-center gap-2 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure Payments</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
            <Clock className="w-10 h-10 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Fast Delivery</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
            <Globe className="w-10 h-10 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Global Support</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
            <Award className="w-10 h-10 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Quality Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
