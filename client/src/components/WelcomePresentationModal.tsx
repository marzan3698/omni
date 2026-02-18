import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageUtils';

interface Service {
  id: number;
  title: string;
  details: string;
  pricing: number | string;
  deliveryStartDate: string;
  deliveryEndDate: string;
  isActive?: boolean;
  attributes?: any;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  purchasePrice: string | number;
  salePrice: string | number;
  currency: 'BDT' | 'USD';
  productCompany: string | null;
  imageUrl: string | null;
  category?: {
    id: number;
    name: string;
  };
}

interface WelcomePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  products: Product[];
  onStartProject: () => void;
}

interface Slide {
  type: 'welcome' | 'service' | 'product' | 'cta';
  data?: Service | Product;
}

const AUTO_ADVANCE_INTERVAL = 6000; // 6 seconds

export function WelcomePresentationModal({
  isOpen,
  onClose,
  services,
  products,
  onStartProject,
}: WelcomePresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Build slides array
  const slides: Slide[] = [
    { type: 'welcome' },
    ...(services.length > 0 ? services.map((service) => ({ type: 'service' as const, data: service })) : []),
    ...(products.length > 0 ? products.map((product) => ({ type: 'product' as const, data: product })) : []),
    { type: 'cta' },
  ];

  const totalSlides = slides.length;

  // Auto-advance logic
  useEffect(() => {
    if (!isOpen || !isAutoAdvancing || isPaused || totalSlides <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= totalSlides - 1) {
          return 0; // Loop back to start
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, isAutoAdvancing, isPaused, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoAdvancing((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset slide when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setIsAutoAdvancing(true);
      setIsPaused(false);
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000); // Resume after 2 seconds
  }, [totalSlides]);

  const handlePrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000); // Resume after 2 seconds
  }, [totalSlides]);

  const handleToggleAutoAdvance = () => {
    setIsAutoAdvancing((prev) => !prev);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={(e) => {
        if (e.target === modalRef.current) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-[95vw] h-[90vh] rounded-xl overflow-hidden flex flex-col game-card-border"
        style={{
          background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 25%, #0c0a1a 60%, #1e1b4b 100%)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button and controls */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/40 to-transparent p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleAutoAdvance}
              className="text-amber-200 hover:bg-amber-500/20"
            >
              {isAutoAdvancing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <span className="text-amber-200/90 text-sm font-medium">
              Slide {currentSlide + 1} of {totalSlides}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border border-amber-500/50 bg-slate-800/80 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
          >
            <X className="w-4 h-4 mr-1.5" />
            Close
          </Button>
        </div>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700 z-20">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>

        {/* Slide content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <div className="h-full relative">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center p-12",
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                {slide.type === 'welcome' && (
                  <WelcomeSlide onStartProject={onStartProject} onClose={onClose} />
                )}
                {slide.type === 'service' && slide.data && (
                  <ServiceSlide service={slide.data as Service} onStartProject={onStartProject} />
                )}
                {slide.type === 'product' && slide.data && (
                  <ProductSlide product={slide.data as Product} onStartProject={onStartProject} />
                )}
                {slide.type === 'cta' && (
                  <CTASlide onStartProject={onStartProject} onClose={onClose} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            className="border border-amber-500/50 bg-slate-800/80 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentSlide
                    ? 'bg-amber-500 w-8'
                    : 'bg-slate-500 hover:bg-slate-400'
                )}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            className="border border-amber-500/50 bg-slate-800/80 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Welcome Slide Component
function WelcomeSlide({
  onStartProject,
  onClose,
}: {
  onStartProject: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
      <div className="mb-8">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-500/50"
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
        >
          <span className="text-white font-bold text-4xl">O</span>
        </div>
        <h1 className="text-6xl font-bold text-amber-100 mb-4">Welcome to Omni CRM</h1>
        <p className="text-2xl text-slate-300 mb-8">Your Gateway to Digital Excellence</p>
        <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
      </div>
      <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
        Discover our comprehensive range of services and products designed to transform your business. Let&apos;s get started on your journey to success.
      </p>
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={onStartProject}
          className="px-12 py-6 text-lg font-semibold border border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
        >
          Start New Project
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onClose}
          className="px-8 py-6 text-lg font-semibold border border-amber-500/50 bg-slate-800/80 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

// Service Slide Component
function ServiceSlide({ service, onStartProject }: { service: Service; onStartProject: () => void }) {
  const attributes = typeof service.attributes === 'string'
    ? JSON.parse(service.attributes)
    : service.attributes;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center h-full">
      <div>
        <div className="mb-6">
          <span className="px-4 py-2 bg-amber-500/30 text-amber-200 rounded-full text-sm font-medium">Service</span>
        </div>
        <h2 className="text-5xl font-bold text-amber-100 mb-4">{service.title}</h2>
        <p className="text-xl text-slate-300 mb-8 leading-relaxed">{service.details}</p>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-400">৳</span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Starting Price</p>
              <p className="text-3xl font-bold text-amber-200">৳{Number(service.pricing).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Delivery Timeline</p>
              <p className="text-lg font-semibold text-amber-200/90">
                {new Date(service.deliveryStartDate).toLocaleDateString()} - {new Date(service.deliveryEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        {attributes?.tags && attributes.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {attributes.tags.map((tag: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-slate-700/60 text-amber-200/90 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-8">
          <Button
            size="lg"
            onClick={onStartProject}
            className="px-12 py-6 text-lg font-semibold border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
          >
            Start New Project
          </Button>
        </div>
      </div>
      <div className="bg-slate-800/60 rounded-2xl p-8 h-full flex items-center justify-center border border-amber-500/20">
        <div className="text-center">
          <div className="w-32 h-32 bg-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
            <span className="text-5xl">⚡</span>
          </div>
          <p className="text-lg text-slate-300 font-medium">Professional Service</p>
        </div>
      </div>
    </div>
  );
}

// Product Slide Component
function ProductSlide({ product, onStartProject }: { product: Product; onStartProject: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center h-full">
      <div className="order-2 lg:order-1">
        {product.imageUrl ? (
          <div className="rounded-2xl overflow-hidden border border-amber-500/20">
            <img src={getImageUrl(product.imageUrl)} alt={product.name} className="w-full h-[400px] object-cover" />
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl h-[400px] flex items-center justify-center border border-amber-500/20">
            <div className="text-center">
              <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <p className="text-slate-400">No Image Available</p>
            </div>
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <div className="mb-6">
          <span className="px-4 py-2 bg-green-500/30 text-green-300 rounded-full text-sm font-medium">Product</span>
          {product.category && (
            <span className="ml-2 px-4 py-2 bg-slate-700/60 text-amber-200/90 rounded-full text-sm font-medium">
              {product.category.name}
            </span>
          )}
        </div>
        <h2 className="text-5xl font-bold text-amber-100 mb-4">{product.name}</h2>
        {product.description && (
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">{product.description}</p>
        )}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-400">৳</span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Sale Price</p>
              <p className="text-3xl font-bold text-amber-200">৳{Number(product.salePrice).toLocaleString()}</p>
            </div>
          </div>
          {product.productCompany && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Company</p>
                <p className="text-lg font-semibold text-amber-200/90">{product.productCompany}</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Button
            size="lg"
            onClick={onStartProject}
            className="px-12 py-6 text-lg font-semibold border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
          >
            Start New Project
          </Button>
        </div>
      </div>
    </div>
  );
}

// CTA Slide Component
function CTASlide({
  onStartProject,
  onClose,
}: {
  onStartProject: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center max-w-4xl mx-auto">
      <div className="mb-12">
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-amber-500/50"
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #7c3aed 100%)' }}
        >
          <span className="text-white text-6xl">🚀</span>
        </div>
        <h1 className="text-6xl font-bold text-amber-100 mb-6">Ready to Get Started?</h1>
        <p className="text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Let&apos;s create something amazing together. Start your first project today and experience the power of our services and products.
        </p>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={onStartProject}
          className="px-12 py-6 text-lg font-semibold border border-amber-500/50 bg-amber-500/30 text-amber-100 hover:bg-amber-500/50"
        >
          Start New Project
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onClose}
          className="px-8 py-6 text-lg font-semibold border border-amber-500/50 bg-slate-800/80 text-amber-100 hover:bg-amber-500/25 hover:border-amber-500/60"
        >
          Skip for now
        </Button>
      </div>
      <p className="text-slate-400 mt-6 text-sm">Press Escape or click Close to skip</p>
    </div>
  );
}

