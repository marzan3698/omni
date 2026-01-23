import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ColorPicker } from '@/components/ui/color-picker';
import { heroApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { Layout, Upload, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Video, Youtube, Palette, Eye, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Play, Pause, Download, Upload as UploadIcon, ShoppingCart, Heart, Star, Zap, Shield, Globe, Mail, Phone, Calendar, Clock, User, Users, Settings, Search, Menu, X, Plus, Minus, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Check, X as XIcon } from 'lucide-react';

const heroSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  subtitle: z.string().max(200, 'Subtitle must be 200 characters or less').optional().or(z.literal('')),
  trustIndicator: z.string().max(100, 'Trust indicator must be 100 characters or less').optional().or(z.literal('')),
  backgroundType: z.enum(['image', 'video_youtube', 'video_local', 'gradient']),
  backgroundVideoYoutube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
  ctaPrimaryText: z.string().max(50, 'Primary CTA text must be 50 characters or less').optional().or(z.literal('')),
  ctaSecondaryText: z.string().max(50, 'Secondary CTA text must be 50 characters or less').optional().or(z.literal('')),
  buttonStyle: z.enum(['solid', 'outline', 'gradient', 'pill', 'soft-shadow']).optional(),
  buttonPrimaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  buttonPrimaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  buttonSecondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  buttonSecondaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  titleColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  subtitleColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  trustIndicatorColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  overlayColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
  featureHighlight1: z.string().max(100, 'Feature highlight must be 100 characters or less').optional().or(z.literal('')),
  featureHighlight2: z.string().max(100, 'Feature highlight must be 100 characters or less').optional().or(z.literal('')),
  featureHighlight3: z.string().max(100, 'Feature highlight must be 100 characters or less').optional().or(z.literal('')),
  featureHighlightsAlignment: z.enum(['left', 'center', 'right']).optional(),
  // Button and addon image settings
  buttonSize: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  buttonPrimaryIcon: z.string().max(50, 'Icon name must be 50 characters or less').optional().or(z.literal('')),
  buttonSecondaryIcon: z.string().max(50, 'Icon name must be 50 characters or less').optional().or(z.literal('')),
  addonImageAlignment: z.enum(['left', 'center', 'right']).optional(),
});

type HeroSettingsFormData = z.infer<typeof heroSettingsSchema>;

interface HeroSettings {
  title: string;
  subtitle: string;
  trustIndicator: string;
  backgroundType: 'image' | 'video_youtube' | 'video_local' | 'gradient';
  backgroundImage: string | null;
  backgroundVideoYoutube: string | null;
  backgroundVideoLocal: string | null;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  buttonStyle?: 'solid' | 'outline' | 'gradient' | 'pill' | 'soft-shadow';
  buttonPrimaryColor?: string;
  buttonPrimaryTextColor?: string;
  buttonSecondaryColor?: string;
  buttonSecondaryTextColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  trustIndicatorColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlignment?: 'left' | 'center' | 'right';
  featureHighlight1?: string;
  featureHighlight2?: string;
  featureHighlight3?: string;
  featureHighlightsAlignment?: 'left' | 'center' | 'right';
  buttonSize?: 'sm' | 'md' | 'lg' | 'xl';
  buttonPrimaryIcon?: string;
  buttonSecondaryIcon?: string;
  addonImage?: string | null;
  addonImageAlignment?: 'left' | 'center' | 'right';
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
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

// Icon mapping for lucide-react icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Download,
  Upload: UploadIcon,
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
  X: XIcon,
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
function getIconComponent(iconName: string | null | undefined): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}

// Available icons for selection
const availableIcons = [
  { name: 'ArrowRight', label: 'Arrow Right' },
  { name: 'ArrowLeft', label: 'Arrow Left' },
  { name: 'Play', label: 'Play' },
  { name: 'Download', label: 'Download' },
  { name: 'Upload', label: 'Upload' },
  { name: 'ShoppingCart', label: 'Shopping Cart' },
  { name: 'Heart', label: 'Heart' },
  { name: 'Star', label: 'Star' },
  { name: 'Zap', label: 'Zap' },
  { name: 'Shield', label: 'Shield' },
  { name: 'Globe', label: 'Globe' },
  { name: 'Mail', label: 'Mail' },
  { name: 'Phone', label: 'Phone' },
  { name: 'Calendar', label: 'Calendar' },
  { name: 'Clock', label: 'Clock' },
  { name: 'User', label: 'User' },
  { name: 'Users', label: 'Users' },
  { name: 'Settings', label: 'Settings' },
  { name: 'Search', label: 'Search' },
  { name: 'Check', label: 'Check' },
  { name: 'CheckCircle', label: 'Check Circle' },
  { name: 'Plus', label: 'Plus' },
  { name: 'Minus', label: 'Minus' },
  { name: 'ChevronRight', label: 'Chevron Right' },
  { name: 'ChevronLeft', label: 'Chevron Left' },
  { name: 'ChevronDown', label: 'Chevron Down' },
  { name: 'ChevronUp', label: 'Chevron Up' },
];

export default function ManageHomepage() {
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [addonImagePreview, setAddonImagePreview] = useState<string | null>(null);
  const [addonImageFile, setAddonImageFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch hero settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['hero-settings'],
    queryFn: async () => {
      const response = await heroApi.getHeroSettings();
      return response.data.data as HeroSettings;
    },
  });

  const settings = settingsResponse || {
    title: 'Streamline Your Business Operations',
    subtitle: 'Complete CRM and project management solution for modern businesses. Manage leads, campaigns, projects, and clients all in one place.',
    trustIndicator: 'Trusted by 1000+ businesses worldwide',
    backgroundType: 'gradient',
    backgroundImage: null,
    backgroundVideoYoutube: null,
    backgroundVideoLocal: null,
    ctaPrimaryText: 'Start Free Trial',
    ctaSecondaryText: 'Sign In',
    featureHighlight1: 'No credit card required',
    featureHighlight2: '14-day free trial',
    featureHighlight3: 'Cancel anytime',
    featureHighlightsAlignment: 'center',
    buttonStyle: 'solid',
    buttonSize: 'lg',
    buttonPrimaryIcon: null,
    buttonSecondaryIcon: null,
    addonImage: null,
    addonImageAlignment: 'center',
    buttonPrimaryColor: '#ffffff',
    buttonPrimaryTextColor: '#4f46e5',
    buttonSecondaryColor: 'transparent',
    buttonSecondaryTextColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#e0e7ff',
    trustIndicatorColor: '#ffffff',
    overlayColor: '#4f46e5',
    overlayOpacity: 0.9,
    textAlignment: 'center',
  };

  // Initialize form with settings
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<HeroSettingsFormData>({
    resolver: zodResolver(heroSettingsSchema),
    defaultValues: {
      title: settings.title,
      subtitle: settings.subtitle,
      trustIndicator: settings.trustIndicator,
      backgroundType: settings.backgroundType,
      backgroundVideoYoutube: settings.backgroundVideoYoutube || '',
      ctaPrimaryText: settings.ctaPrimaryText,
      ctaSecondaryText: settings.ctaSecondaryText,
      buttonStyle: settings.buttonStyle || 'solid',
      buttonPrimaryColor: settings.buttonPrimaryColor || '#ffffff',
      buttonPrimaryTextColor: settings.buttonPrimaryTextColor || '#4f46e5',
      buttonSecondaryColor: settings.buttonSecondaryColor || 'transparent',
      buttonSecondaryTextColor: settings.buttonSecondaryTextColor || '#ffffff',
      titleColor: settings.titleColor || '#ffffff',
      subtitleColor: settings.subtitleColor || '#e0e7ff',
      trustIndicatorColor: settings.trustIndicatorColor || '#ffffff',
      overlayColor: settings.overlayColor || '#4f46e5',
      overlayOpacity: settings.overlayOpacity || 0.9,
      textAlignment: settings.textAlignment || 'center',
      featureHighlight1: settings.featureHighlight1 || 'No credit card required',
      featureHighlight2: settings.featureHighlight2 || '14-day free trial',
      featureHighlight3: settings.featureHighlight3 || 'Cancel anytime',
      featureHighlightsAlignment: settings.featureHighlightsAlignment || 'center',
      buttonSize: settings.buttonSize || 'lg',
      buttonPrimaryIcon: settings.buttonPrimaryIcon || '',
      buttonSecondaryIcon: settings.buttonSecondaryIcon || '',
      addonImageAlignment: (settings.addonImageAlignment && settings.addonImageAlignment !== '') 
        ? settings.addonImageAlignment 
        : 'center',
    },
  });

  const backgroundType = watch('backgroundType');

  // Update form when settings load
  useEffect(() => {
    if (settingsResponse) {
      reset({
        title: settingsResponse.title,
        subtitle: settingsResponse.subtitle,
        trustIndicator: settingsResponse.trustIndicator,
        backgroundType: settingsResponse.backgroundType,
        backgroundVideoYoutube: settingsResponse.backgroundVideoYoutube || '',
        ctaPrimaryText: settingsResponse.ctaPrimaryText,
        ctaSecondaryText: settingsResponse.ctaSecondaryText,
        buttonStyle: settingsResponse.buttonStyle || 'solid',
        buttonPrimaryColor: settingsResponse.buttonPrimaryColor || '#ffffff',
        buttonPrimaryTextColor: settingsResponse.buttonPrimaryTextColor || '#4f46e5',
        buttonSecondaryColor: settingsResponse.buttonSecondaryColor || 'transparent',
        buttonSecondaryTextColor: settingsResponse.buttonSecondaryTextColor || '#ffffff',
        titleColor: settingsResponse.titleColor || '#ffffff',
        subtitleColor: settingsResponse.subtitleColor || '#e0e7ff',
        trustIndicatorColor: settingsResponse.trustIndicatorColor || '#ffffff',
        overlayColor: settingsResponse.overlayColor || '#4f46e5',
        overlayOpacity: settingsResponse.overlayOpacity || 0.9,
        textAlignment: settingsResponse.textAlignment || 'center',
        featureHighlight1: settingsResponse.featureHighlight1 || 'No credit card required',
        featureHighlight2: settingsResponse.featureHighlight2 || '14-day free trial',
        featureHighlight3: settingsResponse.featureHighlight3 || 'Cancel anytime',
        featureHighlightsAlignment: settingsResponse.featureHighlightsAlignment || 'center',
        buttonSize: settingsResponse.buttonSize || 'lg',
        buttonPrimaryIcon: settingsResponse.buttonPrimaryIcon || '',
        buttonSecondaryIcon: settingsResponse.buttonSecondaryIcon || '',
        addonImageAlignment: (settingsResponse.addonImageAlignment && settingsResponse.addonImageAlignment !== '') 
          ? settingsResponse.addonImageAlignment 
          : 'center',
      });
      if (settingsResponse.backgroundImage) {
        setImagePreview(settingsResponse.backgroundImage);
      }
      if (settingsResponse.backgroundVideoLocal) {
        setVideoPreview(settingsResponse.backgroundVideoLocal);
      }
      if (settingsResponse.addonImage) {
        setAddonImagePreview(settingsResponse.addonImage);
      }
    }
  }, [settingsResponse, reset]);

  // Image upload mutation
  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => heroApi.uploadHeroImage(file),
    onSuccess: (response) => {
      setUploadStatus('success');
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
      if (response.data.data?.imagePath) {
        setImagePreview(response.data.data.imagePath);
      }
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
    onError: () => {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
  });

  // Video upload mutation
  const videoUploadMutation = useMutation({
    mutationFn: (file: File) => heroApi.uploadHeroVideo(file),
    onSuccess: (response) => {
      setUploadStatus('success');
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
      if (response.data.data?.videoPath) {
        setVideoPreview(response.data.data.videoPath);
      }
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
    onError: () => {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
  });

  // Addon image upload mutation
  const addonImageUploadMutation = useMutation({
    mutationFn: (file: File) => heroApi.uploadHeroAddonImage(file),
    onSuccess: async (response) => {
      setUploadStatus('success');
      if (response.data.data?.imagePath) {
        setAddonImagePreview(response.data.data.imagePath);
      }
      // Invalidate and refetch settings to get the updated addon image
      await queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
      await queryClient.refetchQueries({ queryKey: ['hero-settings'] });
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
    onError: (error) => {
      console.error('Addon image upload error:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: HeroSettingsFormData) => heroApi.updateHeroSettings(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
      // Refetch settings to get updated values
      await queryClient.refetchQueries({ queryKey: ['hero-settings'] });
      alert('Hero settings updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating hero settings:', error);
      alert(error.message || 'Failed to update hero settings');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['video/mp4', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only MP4 and WebM videos are allowed.');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB.');
        return;
      }

      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      alert('Please select an image file first');
      return;
    }

    setUploadStatus('uploading');
    imageUploadMutation.mutate(imageFile);
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      alert('Please select a video file first');
      return;
    }

    setUploadStatus('uploading');
    videoUploadMutation.mutate(videoFile);
  };

  const handleAddonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }

      setAddonImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddonImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddonImageUpload = async () => {
    if (!addonImageFile) {
      alert('Please select an image file first');
      return;
    }

    setUploadStatus('uploading');
    addonImageUploadMutation.mutate(addonImageFile);
  };

  const onSubmit = (data: HeroSettingsFormData) => {
    // Validate YouTube URL if background type is video_youtube
    if (data.backgroundType === 'video_youtube' && data.backgroundVideoYoutube) {
      const videoId = extractYouTubeId(data.backgroundVideoYoutube);
      if (!videoId) {
        alert('Invalid YouTube URL. Please provide a valid YouTube video URL.');
        return;
      }
    }

    // Log the data being submitted (including addonImageAlignment)
    console.log('Submitting hero settings:', data);
    console.log('Addon image alignment:', data.addonImageAlignment);
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading hero settings...</div>
      </div>
    );
  }

  const formData = watch();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Layout className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Manage Homepage</h1>
          <p className="text-gray-600 mt-1">Customize your homepage hero section</p>
        </div>
      </div>

        <div className="space-y-6">
        {/* Live Preview - Full Width at Top */}
          <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Preview how your hero section will look</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showPreview && (() => {
              const formData = watch();
              const textAlign = formData.textAlignment || 'center';
              const buttonStyle = formData.buttonStyle || 'solid';
              const overlayColor = formData.overlayColor || '#4f46e5';
              const overlayOpacity = formData.overlayOpacity || 0.9;
              
              // Helper function to get button classes based on style and size
              const getButtonClasses = (isPrimary: boolean) => {
                const sizeClasses: Record<string, string> = {
                  sm: 'px-4 py-2 text-sm',
                  md: 'px-6 py-3 text-base',
                  lg: 'px-8 py-6 text-lg',
                  xl: 'px-10 py-8 text-xl',
                };
                const baseClasses = `${sizeClasses[formData.buttonSize || 'lg']} font-medium transition-all rounded-md`;
                const styleClasses: Record<string, string> = {
                  solid: '',
                  outline: 'border-2 bg-transparent',
                  gradient: 'bg-gradient-to-r',
                  pill: 'rounded-full',
                  'soft-shadow': 'shadow-lg hover:shadow-xl',
                };
                return `${baseClasses} ${styleClasses[buttonStyle] || ''}`;
              };

              // Get icon components
              const PrimaryIcon = getIconComponent(formData.buttonPrimaryIcon);
              const SecondaryIcon = getIconComponent(formData.buttonSecondaryIcon);
              
              // Icon size based on button size
              const iconSizeClass = formData.buttonSize === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

              // Helper function to get button style
              const getButtonStyle = (isPrimary: boolean) => {
                const baseStyle: React.CSSProperties = {};
                const primaryColor = formData.buttonPrimaryColor || '#ffffff';
                const primaryTextColor = formData.buttonPrimaryTextColor || '#4f46e5';
                const secondaryColor = formData.buttonSecondaryColor || 'transparent';
                const secondaryTextColor = formData.buttonSecondaryTextColor || '#ffffff';
                
                if (buttonStyle === 'outline') {
                  baseStyle.backgroundColor = 'transparent';
                  baseStyle.borderColor = isPrimary ? primaryColor : secondaryTextColor;
                  baseStyle.color = isPrimary ? primaryColor : secondaryTextColor;
                } else if (buttonStyle === 'gradient') {
                  // Create gradient from primary color to a darker shade
                  const primaryR = parseInt(primaryColor.slice(1, 3), 16);
                  const primaryG = parseInt(primaryColor.slice(3, 5), 16);
                  const primaryB = parseInt(primaryColor.slice(5, 7), 16);
                  const darkerR = Math.max(0, primaryR - 30);
                  const darkerG = Math.max(0, primaryG - 30);
                  const darkerB = Math.max(0, primaryB - 30);
                  baseStyle.background = `linear-gradient(to right, ${primaryColor}, rgb(${darkerR}, ${darkerG}, ${darkerB}))`;
                  baseStyle.color = primaryTextColor;
                } else {
                  baseStyle.backgroundColor = isPrimary ? primaryColor : (secondaryColor === 'transparent' ? 'transparent' : secondaryColor);
                  baseStyle.color = isPrimary ? primaryTextColor : secondaryTextColor;
                  if (isPrimary === false && secondaryColor === 'transparent') {
                    baseStyle.borderColor = secondaryTextColor;
                  }
                }
                
                return baseStyle;
              };

              // Convert hex to rgba for overlay
              const hexToRgba = (hex: string, opacity: number) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
              };

              return (
                <div className="relative overflow-hidden rounded-lg" style={{ minHeight: '500px', background: backgroundType === 'gradient' ? 'linear-gradient(to bottom right, #4f46e5, #7c3aed, #6b21a8)' : 'transparent' }}>
                  {/* Background based on type */}
                  {backgroundType === 'image' && imagePreview && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${getImageUrl(imagePreview)})` }}
                    />
                  )}
                  {backgroundType === 'video_youtube' && formData.backgroundVideoYoutube && (
                    <div className="absolute inset-0">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(formData.backgroundVideoYoutube)}?autoplay=1&loop=1&mute=1&controls=0&playlist=${extractYouTubeId(formData.backgroundVideoYoutube)}`}
                        allow="autoplay"
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  )}
                  {backgroundType === 'video_local' && videoPreview && (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={videoPreview}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}

                  {/* Overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: hexToRgba(overlayColor, overlayOpacity) }}
                  />

                  {/* Content */}
                  <div className={`relative z-10 p-8 text-${textAlign}`}>
                    {formData.trustIndicator && (
                      <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6"
                        style={{ color: formData.trustIndicatorColor || '#ffffff' }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {formData.trustIndicator}
                      </div>
                    )}
                    <h1
                      className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
                      style={{ color: formData.titleColor || '#ffffff' }}
                    >
                      {formData.title || 'Your Hero Title'}
                    </h1>
                    {formData.subtitle && (
                      <p
                        className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
                        style={{ color: formData.subtitleColor || '#e0e7ff', marginLeft: textAlign === 'center' ? 'auto' : textAlign === 'right' ? 'auto' : '0', marginRight: textAlign === 'center' ? 'auto' : textAlign === 'left' ? 'auto' : '0' }}
                      >
                        {formData.subtitle}
                      </p>
                    )}
                    <div className={`flex flex-col sm:flex-row gap-4 ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                      {formData.ctaPrimaryText && (
                        <button
                          className={`${getButtonClasses(true)} flex items-center justify-center`}
                          style={getButtonStyle(true)}
                        >
                          {PrimaryIcon ? (
                            <PrimaryIcon className={`${iconSizeClass} mr-2`} />
                          ) : formData.buttonSize === 'sm' ? (
                            <ArrowRight className={`${iconSizeClass} mr-2`} />
                          ) : null}
                          <span>{formData.ctaPrimaryText}</span>
                          {!PrimaryIcon && formData.buttonSize !== 'sm' && <ArrowRight className={`${iconSizeClass} ml-2`} />}
                        </button>
                      )}
                      {formData.ctaSecondaryText && (
                        <button
                          className={`${getButtonClasses(false)} flex items-center justify-center`}
                          style={getButtonStyle(false)}
                        >
                          {SecondaryIcon && <SecondaryIcon className={`${iconSizeClass} mr-2`} />}
                          <span>{formData.ctaSecondaryText}</span>
                        </button>
                      )}
                    </div>
                    {/* Addon Image - Absolutely Positioned */}
                    {(() => {
                      const currentAddonImage = addonImagePreview || settingsResponse?.addonImage;
                      return currentAddonImage ? (
                        <div 
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: formData.addonImageAlignment === 'center' 
                              ? 'center' 
                              : formData.addonImageAlignment === 'right' 
                              ? 'flex-end' 
                              : 'flex-start',
                            padding: formData.addonImageAlignment === 'left' 
                              ? '1rem 1rem 1rem 0' 
                              : formData.addonImageAlignment === 'right' 
                              ? '1rem 0 1rem 1rem' 
                              : '1rem',
                          }}
                        >
                          <img
                            src={getImageUrl(currentAddonImage)}
                            alt="Hero addon"
                            className="object-contain pointer-events-auto"
                            style={{
                              maxWidth: '35%',
                              maxHeight: '400px',
                              width: 'auto',
                              height: 'auto',
                            }}
                            onError={(e) => {
                              console.error('Failed to load addon image:', currentAddonImage);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : null;
                    })()}
                    {(formData.featureHighlight1 || formData.featureHighlight2 || formData.featureHighlight3) && (
                      <div className={`flex items-center gap-8 text-sm mt-8 ${formData.featureHighlightsAlignment === 'center' ? 'justify-center' : formData.featureHighlightsAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
                        {formData.featureHighlight1 && (
                          <div className="flex items-center gap-2" style={{ color: formData.subtitleColor || '#e0e7ff' }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>{formData.featureHighlight1}</span>
                          </div>
                        )}
                        {formData.featureHighlight2 && (
                          <div className="flex items-center gap-2" style={{ color: formData.subtitleColor || '#e0e7ff' }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>{formData.featureHighlight2}</span>
                          </div>
                        )}
                        {formData.featureHighlight3 && (
                          <div className="flex items-center gap-2" style={{ color: formData.subtitleColor || '#e0e7ff' }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>{formData.featureHighlight3}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {!showPreview && (
              <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Click "Show Preview" to see live preview</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hero Design Form - Full Width at Bottom */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Design Settings</CardTitle>
            <CardDescription>Customize the hero section texts, background, colors, and call-to-action buttons</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Text Content */}
                  <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Hero Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Streamline Your Business Operations"
                    className="mt-2"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    {...register('subtitle')}
                    placeholder="Complete CRM and project management solution for modern businesses..."
                    className="mt-2"
                    rows={3}
                  />
                  {errors.subtitle && (
                    <p className="text-sm text-red-600 mt-1">{errors.subtitle.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="trust-indicator">Trust Indicator</Label>
                  <Input
                    id="trust-indicator"
                    {...register('trustIndicator')}
                    placeholder="Trusted by 1000+ businesses worldwide"
                    className="mt-2"
                  />
                  {errors.trustIndicator && (
                    <p className="text-sm text-red-600 mt-1">{errors.trustIndicator.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cta-primary">Primary CTA Text</Label>
                    <Input
                      id="cta-primary"
                      {...register('ctaPrimaryText')}
                      placeholder="Start Free Trial"
                      className="mt-2"
                    />
                    {errors.ctaPrimaryText && (
                      <p className="text-sm text-red-600 mt-1">{errors.ctaPrimaryText.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="cta-secondary">Secondary CTA Text</Label>
                    <Input
                      id="cta-secondary"
                      {...register('ctaSecondaryText')}
                      placeholder="Sign In"
                      className="mt-2"
                    />
                    {errors.ctaSecondaryText && (
                      <p className="text-sm text-red-600 mt-1">{errors.ctaSecondaryText.message}</p>
                    )}
                      </div>
                    </div>

                    {/* Feature Highlights */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-700">Feature Highlights</h4>
                        <div>
                          <Label htmlFor="feature-highlights-alignment">Alignment</Label>
                          <select
                            id="feature-highlights-alignment"
                            {...register('featureHighlightsAlignment')}
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="feature-highlight-1">Feature Highlight 1</Label>
                          <Input
                            id="feature-highlight-1"
                            {...register('featureHighlight1')}
                            placeholder="No credit card required"
                            className="mt-2"
                          />
                          {errors.featureHighlight1 && (
                            <p className="text-sm text-red-600 mt-1">{errors.featureHighlight1.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="feature-highlight-2">Feature Highlight 2</Label>
                          <Input
                            id="feature-highlight-2"
                            {...register('featureHighlight2')}
                            placeholder="14-day free trial"
                            className="mt-2"
                          />
                          {errors.featureHighlight2 && (
                            <p className="text-sm text-red-600 mt-1">{errors.featureHighlight2.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="feature-highlight-3">Feature Highlight 3</Label>
                          <Input
                            id="feature-highlight-3"
                            {...register('featureHighlight3')}
                            placeholder="Cancel anytime"
                            className="mt-2"
                          />
                          {errors.featureHighlight3 && (
                            <p className="text-sm text-red-600 mt-1">{errors.featureHighlight3.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Layout & Style */}
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="text-alignment">Text Alignment</Label>
                      <select
                        id="text-alignment"
                        {...register('textAlignment')}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="button-style">Button Style</Label>
                      <select
                        id="button-style"
                        {...register('buttonStyle')}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="solid">Solid</option>
                        <option value="outline">Outline</option>
                        <option value="gradient">Gradient</option>
                        <option value="pill">Pill</option>
                        <option value="soft-shadow">Soft Shadow</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="button-size">Button Size</Label>
                      <select
                        id="button-size"
                        {...register('buttonSize')}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="button-primary-icon">Primary Button Icon</Label>
                      <select
                        id="button-primary-icon"
                        {...register('buttonPrimaryIcon')}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">None</option>
                        {availableIcons.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="button-secondary-icon">Secondary Button Icon</Label>
                      <select
                        id="button-secondary-icon"
                        {...register('buttonSecondaryIcon')}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">None</option>
                        {availableIcons.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Addon Image Section */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700">Addon Image</h4>
                      <p className="text-xs text-slate-500 mt-1">Add an image or GIF to the hero section</p>
                    </div>
                    <div>
                      <Label htmlFor="addon-image-alignment">Alignment</Label>
                      <select
                        id="addon-image-alignment"
                        {...register('addonImageAlignment')}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="hero-addon-image">Addon Image (GIF supported)</Label>
                    <div className="mt-2 flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                      {addonImagePreview ? (
                        <img
                          src={getImageUrl(addonImagePreview)}
                          alt="Addon image preview"
                          className="max-w-full max-h-48 object-contain"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No addon image uploaded</p>
                        </div>
                      )}
                    </div>
                    <Input
                      id="hero-addon-image"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAddonImageChange}
                      className="mt-2"
                    />
                    <Button
                      type="button"
                      onClick={handleAddonImageUpload}
                      disabled={!addonImageFile || uploadStatus === 'uploading'}
                      className="w-full mt-2"
                    >
                      {uploadStatus === 'uploading' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : uploadStatus === 'success' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Uploaded Successfully
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Addon Image
                        </>
                      )}
                    </Button>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Image Requirements:</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• <strong>Formats:</strong> JPEG, PNG, WebP, GIF</li>
                        <li>• <strong>Maximum File Size:</strong> 10MB</li>
                        <li>• <strong>GIF Support:</strong> Animated GIFs are supported</li>
                        <li>• <strong>Alignment:</strong> Choose left, center, or right alignment</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Color Customization Section */}
                <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Color Customization</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Button Colors */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-700">Button Colors</h4>
                      <ColorPicker
                        label="Primary Button Background"
                        value={watch('buttonPrimaryColor') || '#ffffff'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, buttonPrimaryColor: value });
                        }}
                      />
                      <ColorPicker
                        label="Primary Button Text"
                        value={watch('buttonPrimaryTextColor') || '#4f46e5'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, buttonPrimaryTextColor: value });
                        }}
                      />
                      <ColorPicker
                        label="Secondary Button Background"
                        value={watch('buttonSecondaryColor') || 'transparent'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, buttonSecondaryColor: value });
                        }}
                      />
                      <ColorPicker
                        label="Secondary Button Text"
                        value={watch('buttonSecondaryTextColor') || '#ffffff'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, buttonSecondaryTextColor: value });
                        }}
                      />
                    </div>

                    {/* Text Colors */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-700">Text Colors</h4>
                      <ColorPicker
                        label="Title Color"
                        value={watch('titleColor') || '#ffffff'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, titleColor: value });
                        }}
                      />
                      <ColorPicker
                        label="Subtitle Color"
                        value={watch('subtitleColor') || '#e0e7ff'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, subtitleColor: value });
                        }}
                      />
                      <ColorPicker
                        label="Trust Indicator Color"
                        value={watch('trustIndicatorColor') || '#ffffff'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, trustIndicatorColor: value });
                        }}
                      />
                    </div>

                    {/* Overlay Colors */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-700">Overlay</h4>
                      <ColorPicker
                        label="Overlay Color"
                        value={watch('overlayColor') || '#4f46e5'}
                        onChange={(value) => {
                          const currentValues = watch();
                          reset({ ...currentValues, overlayColor: value });
                        }}
                      />
                      <div>
                        <Label htmlFor="overlay-opacity">Overlay Opacity: {((watch('overlayOpacity') || 0.9) * 100).toFixed(0)}%</Label>
                        <Input
                          id="overlay-opacity"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          {...register('overlayOpacity', { valueAsNumber: true })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Type */}
                <div>
                  <Label htmlFor="background-type">Background Type</Label>
                  <select
                    id="background-type"
                    {...register('backgroundType')}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="gradient">Gradient (Default)</option>
                    <option value="image">Background Image</option>
                    <option value="video_youtube">YouTube Video</option>
                    <option value="video_local">Local Video Upload</option>
                  </select>
                </div>

                {/* Background Image Upload */}
                {backgroundType === 'image' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label htmlFor="hero-image">Background Image</Label>
                      <div className="mt-2 flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        {imagePreview ? (
                          <img
                            src={getImageUrl(imagePreview)}
                            alt="Hero background preview"
                            className="max-w-full max-h-48 object-contain"
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No image uploaded</p>
                          </div>
                        )}
                      </div>
                      <Input
                        id="hero-image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="mt-2"
                      />
                      <Button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={!imageFile || uploadStatus === 'uploading'}
                        className="w-full mt-2"
                      >
                        {uploadStatus === 'uploading' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : uploadStatus === 'success' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Uploaded Successfully
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Image Requirements:</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• <strong>Recommended Size:</strong> 1920x1080 pixels (16:9 aspect ratio)</li>
                          <li>• <strong>Minimum Size:</strong> 1280x720 pixels</li>
                          <li>• <strong>Maximum File Size:</strong> 5MB</li>
                          <li>• <strong>Formats:</strong> JPEG, PNG, WebP</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube Video URL */}
                {backgroundType === 'video_youtube' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label htmlFor="youtube-url">YouTube Video URL</Label>
                      <Input
                        id="youtube-url"
                        {...register('backgroundVideoYoutube')}
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                        className="mt-2"
                      />
                      {errors.backgroundVideoYoutube && (
                        <p className="text-sm text-red-600 mt-1">{errors.backgroundVideoYoutube.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
                      </p>
                    </div>
                  </div>
                )}

                {/* Local Video Upload */}
                {backgroundType === 'video_local' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label htmlFor="hero-video">Background Video</Label>
                      <div className="mt-2 flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        {videoPreview ? (
                          <video
                            src={videoPreview}
                            controls
                            className="max-w-full max-h-48"
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No video uploaded</p>
                          </div>
                        )}
                      </div>
                      <Input
                        id="hero-video"
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={handleVideoChange}
                        className="mt-2"
                      />
                      <Button
                        type="button"
                        onClick={handleVideoUpload}
                        disabled={!videoFile || uploadStatus === 'uploading'}
                        className="w-full mt-2"
                      >
                        {uploadStatus === 'uploading' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : uploadStatus === 'success' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Uploaded Successfully
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Video
                          </>
                        )}
                      </Button>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Video Requirements:</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• <strong>Recommended Resolution:</strong> 1920x1080 (Full HD)</li>
                          <li>• <strong>Maximum File Size:</strong> 50MB</li>
                          <li>• <strong>Formats:</strong> MP4, WebM</li>
                          <li>• <strong>Duration:</strong> 30-60 seconds recommended</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="w-full"
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Hero Settings'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
