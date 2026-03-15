import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { heroApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface HeroSlide {
  id: string;
  image: string;
  width: number;
  height: number;
}

interface ClientDashboardHeroProps {
  onStartProject: () => void;
}

export function ClientDashboardHero({ onStartProject }: ClientDashboardHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const slideDuration = 5000; // 5 seconds for each slide as requested
  
  const { data: heroSettings } = useQuery({
    queryKey: ['hero-settings-client'],
    queryFn: async () => {
      try {
        const response = await heroApi.getHeroSettings();
        return response.data.data;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const overlayColor = heroSettings?.overlayColor || '#0f172a';
  const overlayOpacity = heroSettings?.overlayOpacity ?? 0.3; // Default lower for pure image focus
  
  const heroSlides: HeroSlide[] = heroSettings?.hero_slides 
    ? JSON.parse(heroSettings.hero_slides) 
    : [];

  useEffect(() => {
    if (heroSlides.length > 1) {
      setProgress(0);
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / slideDuration) * 100, 100);
        setProgress(newProgress);
        
        if (newProgress >= 100) {
          handleNext();
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [heroSlides.length, currentSlide]);

  const handleNext = () => {
    if (heroSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setProgress(0);
  };
  
  const handlePrev = () => {
    if (heroSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setProgress(0);
  };

  const goToSlide = (index: number) => {
    if (index === currentSlide || heroSlides.length <= 1) return;
    setCurrentSlide(index);
    setProgress(0);
  };
  
  return (
    <section
      className="relative overflow-hidden aspect-[1920/600] w-full rounded-[3rem] group shadow-2xl shadow-indigo-500/10 bg-slate-900 border border-white/5"
    >
      {/* Background Slider */}
      <div className="absolute inset-0 overflow-hidden">
        {heroSlides.length > 0 ? (
          <div 
            className="flex w-full h-full transition-transform duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="relative min-w-full h-full overflow-hidden"
              >
                <div
                  className="w-full h-full bg-cover bg-center transition-all duration-700"
                  style={{ 
                    backgroundImage: `url(${getImageUrl(slide.image)})`,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 50%, #0f172a 100%)' }}
          />
        )}
        
        {/* Slider Navigation Controls */}
        {heroSlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-[15] p-5 rounded-full bg-black/20 hover:bg-amber-500 text-white backdrop-blur-3xl transition-all opacity-0 group-hover:opacity-100 border border-white/10 hover:scale-110 active:scale-90 shadow-2xl"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-[15] p-5 rounded-full bg-black/20 hover:bg-amber-500 text-white backdrop-blur-3xl transition-all opacity-0 group-hover:opacity-100 border border-white/10 hover:scale-110 active:scale-90 shadow-2xl"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[15] flex gap-6">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-500 overflow-hidden bg-white/20 relative ${
                    index === currentSlide ? 'w-24' : 'w-6 hover:bg-white/40'
                  }`}
                >
                  {index === currentSlide && (
                    <div 
                      className="absolute inset-0 bg-amber-500 transition-all duration-75 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Slide Counter Indicator */}
      {heroSlides.length > 0 && (
        <div className="absolute top-10 right-10 z-20 hidden md:flex items-center gap-4 px-6 py-3 rounded-full bg-black/30 border border-white/10 backdrop-blur-3xl transition-all hover:bg-black/50 group shadow-2xl">
          <span className="text-white font-black text-sm tracking-widest">
            {currentSlide + 1} <span className="text-white/40 font-medium">/ {heroSlides.length}</span>
          </span>
        </div>
      )}
    </section>
  );
}
