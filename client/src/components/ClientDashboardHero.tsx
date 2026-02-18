import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
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

interface ClientDashboardHeroProps {
  onStartProject: () => void;
}

export function ClientDashboardHero({ onStartProject }: ClientDashboardHeroProps) {
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

  const heroTitle = heroSettings?.title || 'Your Projects, Simplified';
  const heroSubtitle =
    heroSettings?.subtitle ||
    'Start a new project and collaborate with us. Browse our services below.';
  const backgroundType = heroSettings?.backgroundType || 'gradient';
  const backgroundImage = heroSettings?.backgroundImage;
  const backgroundVideoYoutube = heroSettings?.backgroundVideoYoutube;
  const backgroundVideoLocal = heroSettings?.backgroundVideoLocal;
  const youtubeVideoId = extractYouTubeId(backgroundVideoYoutube);
  const overlayColor = heroSettings?.overlayColor || '#0f172a';
  const overlayOpacity = heroSettings?.overlayOpacity ?? 0.7;

  return (
    <section
      className="relative overflow-hidden min-h-[280px] md:min-h-[360px] rounded-xl"
      style={
        backgroundType === 'gradient'
          ? {
              background:
                'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c0a1a 80%, #1e1b4b 100%)',
            }
          : undefined
      }
    >
      {backgroundType === 'image' && backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getImageUrl(backgroundImage)})` }}
        />
      )}
      {backgroundType === 'video_youtube' && youtubeVideoId && (
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '56.25vw',
              minHeight: '100%',
              minWidth: '177.78vh',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              zIndex: 0,
            }}
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&mute=1&controls=0&playlist=${youtubeVideoId}&modestbranding=1&rel=0`}
            allow="autoplay; encrypted-media"
          />
        </div>
      )}
      {backgroundType === 'video_local' && backgroundVideoLocal && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={getImageUrl(backgroundVideoLocal)}
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      <div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: hexToRgba(overlayColor, overlayOpacity) }}
      />

      <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-12 md:py-20 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-100 mb-3">
          {heroTitle}
        </h1>
        {heroSubtitle && (
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            {heroSubtitle}
          </p>
        )}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onStartProject}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              border-2 border-amber-500/50 bg-amber-500/30 text-amber-100
              hover:bg-amber-500/50 hover:border-amber-500/70"
          >
            <Briefcase className="w-5 h-5" />
            Start New Project
          </button>
        </div>
      </div>
    </section>
  );
}
