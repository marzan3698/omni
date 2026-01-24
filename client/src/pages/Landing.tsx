import { ComponentType, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Play, Pause, Download, Upload, ShoppingCart, Heart, Star, Zap, Shield, Globe, Mail, Phone, Calendar, Clock, User, Users, Settings, Search, Menu, X, Plus, Minus, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Check, Briefcase, Target, BarChart3, MessageSquare, Newspaper, TrendingUp, LineChart, Facebook, MessageCircle, DollarSign, Award, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';
import { socialApi } from '@/lib/social';
import { contentApi } from '@/lib/content';
import { themeApi, heroApi, headerApi, colorApi } from '@/lib/api';
import { PublicHeader } from '@/components/PublicHeader';
import { getImageUrl } from '@/lib/imageUtils';

export function Landing() {
  const { data: analytics } = useQuery({
    queryKey: ['public-conversation-analytics'],
    queryFn: () => socialApi.getPublicAnalytics(30),
  });

  // Fetch theme settings for site name
  const { data: themeSettings } = useQuery({
    queryKey: ['theme-settings-public'],
    queryFn: async () => {
      try {
        const response = await themeApi.getThemeSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const siteName = themeSettings?.siteName || 'Omni CRM';

  // Fetch hero settings
  const { data: heroSettings } = useQuery({
    queryKey: ['hero-settings-public'],
    queryFn: async () => {
      try {
        const response = await heroApi.getHeroSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Helper function to extract YouTube video ID
  const extractYouTubeId = (url: string | null): string | null => {
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
  };

  // Use hero settings or defaults
  const heroTitle = heroSettings?.title || 'Streamline Your Business Operations';
  const heroSubtitle = heroSettings?.subtitle || 'Complete CRM and project management solution for modern businesses. Manage leads, campaigns, projects, and clients all in one place.';
  const heroTrustIndicator = heroSettings?.trustIndicator || 'Trusted by 1000+ businesses worldwide';
  const heroCtaPrimary = heroSettings?.ctaPrimaryText || 'Start Free Trial';
  const heroCtaSecondary = heroSettings?.ctaSecondaryText || 'Sign In';
  const backgroundType = heroSettings?.backgroundType || 'gradient';
  const backgroundImage = heroSettings?.backgroundImage;
  const backgroundVideoYoutube = heroSettings?.backgroundVideoYoutube;
  const backgroundVideoLocal = heroSettings?.backgroundVideoLocal;
  const youtubeVideoId = extractYouTubeId(backgroundVideoYoutube);
  
  // New design system settings
  const buttonStyle = heroSettings?.buttonStyle || 'solid';
  const buttonPrimaryColor = heroSettings?.buttonPrimaryColor || '#ffffff';
  const buttonPrimaryTextColor = heroSettings?.buttonPrimaryTextColor || '#4f46e5';
  const buttonSecondaryColor = heroSettings?.buttonSecondaryColor || 'transparent';
  const buttonSecondaryTextColor = heroSettings?.buttonSecondaryTextColor || '#ffffff';
  const titleColor = heroSettings?.titleColor || '#ffffff';
  const subtitleColor = heroSettings?.subtitleColor || '#e0e7ff';
  const trustIndicatorColor = heroSettings?.trustIndicatorColor || '#ffffff';
  const overlayColor = heroSettings?.overlayColor || '#4f46e5';
  const overlayOpacity = heroSettings?.overlayOpacity || 0.9;
  const textAlignment = heroSettings?.textAlignment || 'center';
  const featureHighlight1 = heroSettings?.featureHighlight1 || 'No credit card required';
  const featureHighlight2 = heroSettings?.featureHighlight2 || '14-day free trial';
  const featureHighlight3 = heroSettings?.featureHighlight3 || 'Cancel anytime';
  const featureHighlightsAlignment = heroSettings?.featureHighlightsAlignment || 'center';
  const buttonSize = heroSettings?.buttonSize || 'lg';
  const buttonPrimaryIcon = heroSettings?.buttonPrimaryIcon || null;
  const buttonSecondaryIcon = heroSettings?.buttonSecondaryIcon || null;
  const addonImage = heroSettings?.addonImage || null;
  const addonImageAlignment = (heroSettings?.addonImageAlignment && heroSettings.addonImageAlignment !== '') 
    ? heroSettings.addonImageAlignment 
    : 'center';

  // Icon mapping for lucide-react icons
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    ArrowRight,
    ArrowLeft,
    ArrowUp,
    ArrowDown,
    Play,
    Pause,
    Download,
    Upload,
    ShoppingCart,
    Heart,
    Star,
    Zap,
    Shield,
    Globe,
    Mail,
    Phone,
    Calendar,
    Clock,
    User,
    Users,
    Settings,
    Search,
    Menu,
    X,
    Plus,
    Minus,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    Check,
    CheckCircle,
  };

  // Helper function to get icon component by name
  const getIconComponent = (iconName: string | null | undefined): React.ComponentType<{ className?: string }> | null => {
    if (!iconName) return null;
    return iconMap[iconName] || null;
  };

  const PrimaryIcon = getIconComponent(buttonPrimaryIcon);
  const SecondaryIcon = getIconComponent(buttonSecondaryIcon);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Helper function to get button classes based on style and size
  const getButtonClasses = (isPrimary: boolean) => {
    const sizeClasses: Record<string, string> = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-6 text-lg',
      xl: 'px-10 py-8 text-xl',
    };
    const baseClasses = `${sizeClasses[buttonSize] || 'px-8 py-6 text-lg'} transition-all font-medium rounded-md`;
    const styleClasses: Record<string, string> = {
      solid: '',
      outline: 'border-2 bg-transparent',
      gradient: 'bg-gradient-to-r',
      pill: 'rounded-full',
      'soft-shadow': 'shadow-lg hover:shadow-xl',
    };
    return `${baseClasses} ${styleClasses[buttonStyle] || ''}`;
  };

  // Helper function to get button style
  const getButtonStyle = (isPrimary: boolean) => {
    const baseStyle: React.CSSProperties = {};
    
    if (buttonStyle === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderColor = isPrimary ? buttonPrimaryColor : buttonSecondaryTextColor;
      baseStyle.color = isPrimary ? buttonPrimaryColor : buttonSecondaryTextColor;
    } else if (buttonStyle === 'gradient') {
      // Create gradient from primary color to a darker shade
      const primaryR = parseInt(buttonPrimaryColor.slice(1, 3), 16);
      const primaryG = parseInt(buttonPrimaryColor.slice(3, 5), 16);
      const primaryB = parseInt(buttonPrimaryColor.slice(5, 7), 16);
      const darkerR = Math.max(0, primaryR - 30);
      const darkerG = Math.max(0, primaryG - 30);
      const darkerB = Math.max(0, primaryB - 30);
      baseStyle.background = `linear-gradient(to right, ${buttonPrimaryColor}, rgb(${darkerR}, ${darkerG}, ${darkerB}))`;
      baseStyle.color = buttonPrimaryTextColor;
    } else {
      baseStyle.backgroundColor = isPrimary ? buttonPrimaryColor : (buttonSecondaryColor === 'transparent' ? 'transparent' : buttonSecondaryColor);
      baseStyle.color = isPrimary ? buttonPrimaryTextColor : buttonSecondaryTextColor;
      if (buttonStyle === 'outline' || (isPrimary === false && buttonSecondaryColor === 'transparent')) {
        baseStyle.borderColor = isPrimary ? buttonPrimaryColor : buttonSecondaryTextColor;
      }
    }
    
    return baseStyle;
  };

  // Get alignment classes
  const getAlignmentClasses = () => {
    const alignMap: Record<string, string> = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return alignMap[textAlignment] || 'text-center';
  };

  const getJustifyClasses = () => {
    const justifyMap: Record<string, string> = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    };
    return justifyMap[textAlignment] || 'justify-center';
  };

  const getFeatureHighlightsJustifyClasses = () => {
    const justifyMap: Record<string, string> = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    };
    return justifyMap[featureHighlightsAlignment] || 'justify-center';
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ['public-reviews'],
    queryFn: () => contentApi.getPublicReviews(6),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['public-posts'],
    queryFn: () => contentApi.getPublicPosts(3),
  });

  const dailySeries = analytics?.daily.slice(-14) || [];
  const maxMessages = dailySeries.reduce((max, d) => Math.max(max, d.messages), 0);

  // Fetch color settings
  const { data: colorSettings } = useQuery({
    queryKey: ['color-settings-public'],
    queryFn: async () => {
      try {
        const response = await colorApi.getColorSettings();
        return response.data.data;
      } catch (error) {
        console.error('Error fetching color settings:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 30 * 1000, // Cache for 30 seconds (shorter for faster updates)
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Use color settings or defaults
  const primaryColor = colorSettings?.primaryColor || '#4f46e5';
  const secondaryColor = colorSettings?.secondaryColor || '#7c3aed';

  // Helper function to darken a color
  const darkenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const fullHex = hex.length === 3
      ? hex.split('').map(char => char + char).join('')
      : hex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    const darkerR = Math.max(0, r - amount);
    const darkerG = Math.max(0, g - amount);
    const darkerB = Math.max(0, b - amount);
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  };

  const darkerSecondary = darkenColor(secondaryColor, 30);

  const platformStats = [
    { label: 'Facebook', value: analytics?.platformBreakdown.facebook || 0, color: primaryColor },
    { label: 'Chatwoot', value: analytics?.platformBreakdown.chatwoot || 0, color: 'text-emerald-600' },
    { label: 'Other', value: analytics?.platformBreakdown.other || 0, color: 'text-slate-600' },
  ];

  const footerSections = [
    {
      title: 'Explore',
      links: ['Product', 'Pricing', 'Integrations', 'Security', 'Status'],
    },
    {
      title: 'Solutions',
      links: ['Sales Teams', 'Marketing Teams', 'Service Teams', 'Startups', 'Enterprise'],
    },
    {
      title: 'Resources',
      links: ['Blog', 'Guides', 'Docs', 'API Reference', 'Community'],
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Contact', 'Legal', 'Privacy'],
    },
  ];

  const [videoPlaying, setVideoPlaying] = useState(false);

  // Fetch header settings to determine spacing
  const { data: headerSettings } = useQuery({
    queryKey: ['header-settings-public'],
    queryFn: async () => {
      try {
        const response = await headerApi.getHeaderSettings();
        return response.data.data;
      } catch (error) {
        console.error('Error fetching header settings:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 30 * 1000, // Cache for 30 seconds (shorter for faster updates)
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const isHeaderFixed = headerSettings?.isFixed || false;
  const isHeaderTransparent = headerSettings?.isTransparent || false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicHeader />

      {/* Enhanced Hero Banner Section */}
      <section 
        className={`relative overflow-hidden text-white ${isHeaderFixed ? 'pt-20' : ''}`}
        style={{
        background: backgroundType === 'gradient' 
          ? `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor}, ${darkerSecondary})` 
          : 'transparent'
      }}>
        {/* Background based on type */}
        {backgroundType === 'image' && backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getImageUrl(backgroundImage)})` }}
          />
        )}
        {backgroundType === 'video_youtube' && youtubeVideoId && (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                width: '100vw',
                height: '56.25vw', // 16:9 aspect ratio
                minHeight: '100vh',
                minWidth: '177.78vh', // 16:9 aspect ratio
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
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
        {backgroundType === 'gradient' && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        )}
        
        {/* Overlay for better text readability */}
        <div
          className="absolute inset-0 z-0"
          style={{ backgroundColor: hexToRgba(overlayColor, overlayOpacity) }}
        ></div>
        
        <div className={`relative container mx-auto px-4 py-24 md:py-32 z-20 ${getAlignmentClasses()}`}>
          <div className={`max-w-4xl ${textAlignment === 'center' ? 'mx-auto' : textAlignment === 'right' ? 'ml-auto' : ''} animate-fade-in`}>
            {heroTrustIndicator && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6"
                style={{ color: trustIndicatorColor }}
              >
                <Award className="w-4 h-4" />
                {heroTrustIndicator}
              </div>
            )}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              style={{ color: titleColor }}
            >
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p
                className="text-xl md:text-2xl mb-8 max-w-2xl"
                style={{
                  color: subtitleColor,
                  marginLeft: textAlignment === 'center' ? 'auto' : textAlignment === 'right' ? 'auto' : '0',
                  marginRight: textAlignment === 'center' ? 'auto' : textAlignment === 'left' ? 'auto' : '0',
                }}
              >
                {heroSubtitle}
              </p>
            )}
            <div className={`flex flex-col sm:flex-row gap-4 ${getJustifyClasses()} mb-12`}>
              {heroCtaPrimary && (
                <Link to="/register">
                  <button
                    className={`${getButtonClasses(true)} flex items-center justify-center`}
                    style={getButtonStyle(true)}
                  >
                    {PrimaryIcon ? (
                      <PrimaryIcon className={`${buttonSize === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                    ) : buttonSize === 'sm' ? (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    ) : null}
                    <span>{heroCtaPrimary}</span>
                    {!PrimaryIcon && buttonSize !== 'sm' && <ArrowRight className="ml-2 w-5 h-5" />}
                  </button>
                </Link>
              )}
              {heroCtaSecondary && (
                <Link to="/login">
                  <button
                    className={`${getButtonClasses(false)} flex items-center justify-center`}
                    style={getButtonStyle(false)}
                  >
                    {SecondaryIcon && <SecondaryIcon className={`${buttonSize === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />}
                    <span>{heroCtaSecondary}</span>
                  </button>
                </Link>
              )}
            </div>
            {/* Addon Image - Absolutely Positioned */}
            {addonImage && (
              <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: addonImageAlignment === 'center' 
                    ? 'center' 
                    : addonImageAlignment === 'right' 
                    ? 'flex-end' 
                    : 'flex-start',
                  padding: addonImageAlignment === 'left' 
                    ? '2rem 2rem 2rem 0' 
                    : addonImageAlignment === 'right' 
                    ? '2rem 0 2rem 2rem' 
                    : '2rem',
                }}
              >
                <img
                  src={getImageUrl(addonImage)}
                  alt="Hero addon"
                  className="object-contain pointer-events-auto"
                  style={{
                    maxWidth: '35%',
                    maxHeight: '80vh',
                    width: 'auto',
                    height: 'auto',
                  }}
                  onError={(e) => {
                    console.error('Failed to load addon image:', addonImage);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Addon image loaded successfully:', addonImage);
                  }}
                />
              </div>
            )}
            {(featureHighlight1 || featureHighlight2 || featureHighlight3) && (
              <div className={`flex items-center gap-8 text-sm ${getFeatureHighlightsJustifyClasses()}`} style={{ color: subtitleColor }}>
                {featureHighlight1 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{featureHighlight1}</span>
                  </div>
                )}
                {featureHighlight2 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{featureHighlight2}</span>
                  </div>
                )}
                {featureHighlight3 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{featureHighlight3}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/70" />
          </div>
        </div>
      </section>

      {/* Trust Indicators / Stats Bar */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: primaryColor }}>1000+</div>
              <div className="text-sm text-slate-600">Active Companies</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: primaryColor }}>50K+</div>
              <div className="text-sm text-slate-600">Messages Processed</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: primaryColor }}>99.9%</div>
              <div className="text-sm text-slate-600">Uptime SLA</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: primaryColor }}>24/7</div>
              <div className="text-sm text-slate-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              <Play className="w-4 h-4" />
              Product Demo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              See Omni CRM in Action
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Watch how teams use Omni CRM to streamline their operations, manage leads, and grow their business.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900 aspect-video">
            {!videoPlaying ? (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <button
                  onClick={() => setVideoPlaying(true)}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  <Play className="w-10 h-10 ml-1" style={{ color: primaryColor }} fill="currentColor" />
                </button>
              </div>
            ) : (
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Omni CRM Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
              <h3 className="font-semibold text-slate-900 mb-2">Quick Setup</h3>
              <p className="text-sm text-slate-600">Get started in minutes, not days</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
              <h3 className="font-semibold text-slate-900 mb-2">Secure & Reliable</h3>
              <p className="text-sm text-slate-600">Enterprise-grade security built-in</p>
            </div>
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
              <h3 className="font-semibold text-slate-900 mb-2">Global Scale</h3>
              <p className="text-sm text-slate-600">Works anywhere, anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <Target className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Everything You Need to Manage Your Business
        </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              All-in-one platform designed to help you manage clients, campaigns, projects, and teams efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: 'Client Management',
              description: 'Register clients, projects, and track milestones seamlessly.',
              points: ['Easy project creation', 'E-signature support', 'Status tracking'],
                image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
            },
            {
              icon: Target,
              title: 'Campaign Management',
              description: 'Plan, launch, and report on marketing campaigns.',
              points: ['Multi-client campaigns', 'Product assignments', 'Lead tracking'],
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
            },
            {
              icon: Briefcase,
              title: 'Project Tracking',
              description: 'Monitor delivery health from draft to completion.',
              points: ['Real-time updates', 'Document management', 'Timeline visibility'],
                image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
            },
            {
              icon: BarChart3,
              title: 'Lead Analytics',
              description: 'Actionable insights for every campaign and channel.',
              points: ['Campaign-based leads', 'Detailed insights', 'Filter by source'],
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
            },
            {
                icon: Shield,
              title: 'Secure & Reliable',
              description: 'Enterprise-grade security and observability.',
              points: ['Data encryption', '99.9% uptime', 'Regular backups'],
                image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
            },
            {
              icon: Users,
              title: 'Team Collaboration',
              description: 'Roles, permissions, and shared dashboards.',
              points: ['Role-based access', 'Shared dashboards', 'Real-time sync'],
                image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
              },
            ].map((item, idx) => (
              <Card key={item.title} className="shadow-sm border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-t to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(to top, ${primaryColor}CC, transparent)`,
                    }}
                  ></div>
                </div>
              <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: `${primaryColor}20`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                      }}
                    >
                      <item.icon 
                        className="w-6 h-6 transition-colors" 
                        style={{ color: primaryColor }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = primaryColor;
                        }}
                      />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(to bottom right, ${primaryColor}10, ${secondaryColor}10)`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <Zap className="w-4 h-4" />
              Why Choose Omni
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built for Modern Teams
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Experience the difference with a platform designed for speed, security, and scalability.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: 'Save Time',
                description: 'Automate repetitive tasks and focus on what matters most.',
                stat: '50% faster',
              },
              {
                icon: DollarSign,
                title: 'Reduce Costs',
                description: 'All-in-one solution eliminates the need for multiple tools.',
                stat: '60% savings',
              },
              {
                icon: TrendingUp,
                title: 'Grow Faster',
                description: 'Scale your operations without scaling your team size.',
                stat: '3x growth',
              },
              {
                icon: Award,
                title: 'Stay Ahead',
                description: 'Latest features and updates to keep you competitive.',
                stat: 'Monthly updates',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 mb-3">{benefit.description}</p>
                <div className="text-sm font-semibold" style={{ color: primaryColor }}>{benefit.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Showcase */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
              <Globe className="w-4 h-4" />
              Integrations
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Connect with Your Favorite Tools
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Seamlessly integrate with the platforms you already use to streamline your workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Facebook Messenger',
                icon: Facebook,
                description: 'Connect your Facebook pages and manage conversations directly from Omni.',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
              },
              {
                name: 'Chatwoot',
                icon: MessageCircle,
                description: 'Sync conversations and manage customer support across all channels.',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
              },
              {
                name: 'WhatsApp Business',
                icon: MessageSquare,
                description: 'Coming soon: Direct WhatsApp integration for instant messaging.',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
              },
            ].map((integration) => (
              <Card key={integration.name} className="shadow-sm border-gray-200 hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full ${integration.bgColor} flex items-center justify-center mx-auto mb-4`}>
                    <integration.icon className={`w-8 h-8 ${integration.color}`} />
                  </div>
                  <CardTitle className="text-xl">{integration.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{integration.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Conversation Analytics */}
      <section className="bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Conversation Insights
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-3">
                Live conversation health in one glance
              </h2>
              <p className="text-slate-600 mb-6 max-w-xl">
                Track message volume, open vs closed threads, and platform performance pulled directly from your inbox data.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Total Conversations"
                  value={analytics?.totalConversations ?? '—'}
                  icon={LineChart}
                  accent={`${primaryColor}20`}
                  accentText={primaryColor}
                />
                <StatCard
                  title="Open Conversations"
                  value={analytics?.openConversations ?? '—'}
                  icon={TrendingUp}
                  accent="bg-amber-100 text-amber-700"
                />
                <StatCard
                  title="Closed"
                  value={analytics?.closedConversations ?? '—'}
                  icon={CheckCircle}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-600">Platform mix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {platformStats.map((p) => (
                      <div key={p.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{p.label}</span>
                        <span className={`font-semibold ${p.color}`}>{p.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Message trend (14 days)</CardTitle>
                    <CardDescription>Pulled from live conversation activity</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="inline-block w-3 h-3 rounded-full bg-indigo-500"></span>
                    Messages
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-2">
                  {dailySeries.map((day) => {
                    const height = maxMessages ? Math.round((day.messages / maxMessages) * 100) : 0;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-md transition-all"
                          style={{ backgroundColor: primaryColor }}
                          style={{ height: `${Math.max(6, height)}%` }}
                          title={`${day.messages} messages on ${day.date}`}
                        />
                        <span className="text-[11px] text-slate-500">
                          {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(day.date))}
                        </span>
                      </div>
                    );
                  })}
                  {dailySeries.length === 0 && (
                    <div className="text-sm text-slate-500">No activity yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Reviews / Testimonials */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
          <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              Customer Reviews
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Loved by modern teams</h2>
              <p className="text-lg text-slate-600">Feedback from teams running their operations on Omni.</p>
            </div>
            <Link to="/register" className="mt-4 md:mt-0">
              <Button size="lg" variant="outline" className="border-2">
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, idx) => (
              <Card key={review.id} className="shadow-sm border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {review.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{review.authorName}</CardTitle>
                      <CardDescription className="text-sm">{review.role || 'Customer'}</CardDescription>
        </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                </div>
              </CardHeader>
              <CardContent>
                  <p className="text-slate-700 leading-relaxed">"{review.comment}"</p>
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && (
              <div className="col-span-full text-center text-slate-500 py-12">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p>Reviews will appear once added.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <DollarSign className="w-4 h-4" />
              Simple Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Choose the Right Plan for You
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start free, upgrade as you grow. All plans include our core features.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'forever',
                description: 'Perfect for small teams getting started',
                features: ['Up to 5 users', 'Basic CRM features', 'Email support', '5GB storage'],
                cta: 'Get Started',
                popular: false,
              },
              {
                name: 'Professional',
                price: '$29',
                period: 'per month',
                description: 'Best for growing businesses',
                features: ['Unlimited users', 'Advanced analytics', 'Priority support', '100GB storage', 'API access'],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'pricing',
                description: 'For large organizations',
                features: ['Everything in Professional', 'Custom integrations', 'Dedicated support', 'Unlimited storage', 'SLA guarantee'],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan) => (
              <Card key={plan.name} className={`shadow-sm border-2 ${plan.popular ? 'border-indigo-600 relative' : 'border-gray-200'} hover:shadow-lg transition-all`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span 
                      className="text-white px-4 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >Most Popular</span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period !== 'forever' && <span className="text-slate-600 ml-2">{plan.period}</span>}
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="block">
                    <Button
                      size="lg"
                      className={`w-full ${plan.popular ? 'text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                      style={plan.popular ? {
                        backgroundColor: primaryColor,
                      } : {}}
                      onMouseEnter={(e) => {
                        if (plan.popular) {
                          e.currentTarget.style.backgroundColor = darkenColor(primaryColor, 20);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (plan.popular) {
                          e.currentTarget.style.backgroundColor = primaryColor;
                        }
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Blog Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
                <Newspaper className="w-4 h-4" />
                Latest from the blog
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Insights, playbooks, and releases</h2>
              <p className="text-lg text-slate-600">Stay ahead with product updates and GTM guides.</p>
            </div>
            <Link to="/register" className="mt-4 md:mt-0">
              <Button 
                size="lg" 
                variant="ghost" 
                style={{ color: primaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = darkenColor(primaryColor, 20);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = primaryColor;
                }}
              >
                Join Omni
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="shadow-sm border-gray-200 h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden group">
                <div 
                  className="relative h-48 overflow-hidden"
                  style={{
                    background: `linear-gradient(to bottom right, ${primaryColor}80, ${secondaryColor}80)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-white/30" />
                  </div>
                </div>
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: primaryColor }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Coming soon'}
                  </p>
                  <h3 
                    className="text-xl font-semibold text-slate-900 mb-3 transition-colors"
                    style={{ color: 'inherit' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#0f172a';
                    }}
                  >{post.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 flex-1">{post.excerpt || 'Read the latest updates from the Omni team.'}</p>
                  <div 
                    className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
                    style={{ color: primaryColor }}
                  >
                    Read more
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && (
              <div className="col-span-full text-center text-slate-500 py-12">
                <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p>Blog posts will appear once published.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section 
        className="relative text-white py-20 overflow-hidden"
        style={{
          background: `linear-gradient(to bottom right, ${primaryColor}, ${darkenColor(primaryColor, 20)}, ${darkenColor(secondaryColor, 40)})`,
        }}
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Join thousands of businesses using Omni CRM to manage their operations and grow faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-lg">
              Create Your Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Contact Sales
            </Button>
          </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{featureHighlight1}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{featureHighlight2}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{featureHighlight3}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {footerSections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 tracking-tight">{section.title}</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link to={`/${link.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-indigo-600 transition-colors">
                      {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                <span className="text-white font-bold text-lg">O</span>
                </div>
                <div>
                  <div className="text-slate-900 font-semibold text-base">{siteName}</div>
                  <div className="text-xs text-slate-500">Enterprise CRM & Project Management</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
              <span className="hidden md:inline-block text-slate-300">|</span>
                <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                <span className="hidden md:inline-block text-slate-300">|</span>
                <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            </div>
            <div className="text-slate-500">
                Made with ❤️ in Bangladesh &middot; United States
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  accentText?: string;
}

function StatCard({ title, value, icon: Icon, accent, accentText }: StatCardProps) {
  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{
              backgroundColor: accent.includes('#') ? accent : (accent.includes('bg-') ? undefined : `${accent}20`),
              color: accentText || (accent.includes('text-') ? undefined : accent),
            }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm text-slate-600">{title}</CardTitle>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

