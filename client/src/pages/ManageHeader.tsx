import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { headerApi, themeApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { Layout, Palette, Eye, Loader2, CheckCircle, Menu, Upload, Image as ImageIcon, RotateCcw } from 'lucide-react';

const headerSettingsSchema = z.object({
  menuAbout: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuServices: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuContact: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuTerms: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuPrivacy: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  menuSitemap: z.string().max(50, 'Menu item text must be 50 characters or less').optional().or(z.literal('')),
  buttonPrimaryText: z.string().max(50, 'Button text must be 50 characters or less').optional().or(z.literal('')),
  buttonSecondaryText: z.string().max(50, 'Button text must be 50 characters or less').optional().or(z.literal('')),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  buttonBgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  buttonTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  buttonSecondaryBgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional().or(z.literal('transparent')),
  buttonSecondaryTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  isFixed: z.boolean().optional(),
  isTransparent: z.boolean().optional(),
  logo: z.string().optional().or(z.literal('')),
  logoType: z.enum(['wide', 'with-text']).optional(),
});

type HeaderSettingsFormData = z.infer<typeof headerSettingsSchema>;

interface HeaderSettings {
  menuAbout: string;
  menuServices: string;
  menuContact: string;
  menuTerms: string;
  menuPrivacy: string;
  menuSitemap: string;
  buttonPrimaryText: string;
  buttonSecondaryText: string;
  backgroundColor: string;
  textColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonSecondaryBgColor: string;
  buttonSecondaryTextColor: string;
  isFixed: boolean;
  isTransparent: boolean;
  logo: string | null;
  logoType: 'wide' | 'with-text';
}

export default function ManageHeader() {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Fetch theme settings for site name
  const { data: themeSettings } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      try {
        const response = await themeApi.getThemeSettings();
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  // Fetch header settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['header-settings'],
    queryFn: async () => {
      const response = await headerApi.getHeaderSettings();
      return response.data.data as HeaderSettings;
    },
  });

  const settings = settingsResponse || {
    menuAbout: 'About',
    menuServices: 'Services',
    menuContact: 'Contact',
    menuTerms: 'Terms',
    menuPrivacy: 'Privacy',
    menuSitemap: 'Sitemap',
    buttonPrimaryText: 'Get Started',
    buttonSecondaryText: 'Sign In',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    buttonBgColor: '#4f46e5',
    buttonTextColor: '#ffffff',
    buttonSecondaryBgColor: 'transparent',
    buttonSecondaryTextColor: '#1e293b',
    isFixed: false,
    isTransparent: false,
    logo: null,
    logoType: 'with-text',
  };

  // Initialize form with settings
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<HeaderSettingsFormData>({
    resolver: zodResolver(headerSettingsSchema),
    defaultValues: {
      menuAbout: settings.menuAbout,
      menuServices: settings.menuServices,
      menuContact: settings.menuContact,
      menuTerms: settings.menuTerms,
      menuPrivacy: settings.menuPrivacy,
      menuSitemap: settings.menuSitemap,
      buttonPrimaryText: settings.buttonPrimaryText,
      buttonSecondaryText: settings.buttonSecondaryText,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      buttonBgColor: settings.buttonBgColor,
      buttonTextColor: settings.buttonTextColor,
      buttonSecondaryBgColor: settings.buttonSecondaryBgColor,
      buttonSecondaryTextColor: settings.buttonSecondaryTextColor,
      isFixed: settings.isFixed,
      isTransparent: settings.isTransparent,
      logo: settings.logo || '',
      logoType: settings.logoType || 'with-text',
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settingsResponse) {
      reset({
        menuAbout: settingsResponse.menuAbout,
        menuServices: settingsResponse.menuServices,
        menuContact: settingsResponse.menuContact,
        menuTerms: settingsResponse.menuTerms,
        menuPrivacy: settingsResponse.menuPrivacy,
        menuSitemap: settingsResponse.menuSitemap,
        buttonPrimaryText: settingsResponse.buttonPrimaryText,
        buttonSecondaryText: settingsResponse.buttonSecondaryText,
        backgroundColor: settingsResponse.backgroundColor,
        textColor: settingsResponse.textColor,
        buttonBgColor: settingsResponse.buttonBgColor,
        buttonTextColor: settingsResponse.buttonTextColor,
        buttonSecondaryBgColor: settingsResponse.buttonSecondaryBgColor,
        buttonSecondaryTextColor: settingsResponse.buttonSecondaryTextColor,
        isFixed: settingsResponse.isFixed,
        isTransparent: settingsResponse.isTransparent,
        logo: settingsResponse.logo || '',
        logoType: settingsResponse.logoType || 'with-text',
      });
      if (settingsResponse.logo) {
        setLogoPreview(settingsResponse.logo);
      }
    }
  }, [settingsResponse, reset]);

  // Logo upload mutation
  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => headerApi.uploadHeaderLogo(file),
    onSuccess: async (response) => {
      setUploadStatus('success');
      if (response.data.data?.logoPath) {
        setLogoPreview(response.data.data.logoPath);
      }
      // Invalidate and refetch settings to get the updated logo
      await queryClient.invalidateQueries({ queryKey: ['header-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['header-settings-public'] });
      await queryClient.refetchQueries({ queryKey: ['header-settings'] });
      await queryClient.refetchQueries({ queryKey: ['header-settings-public'] });
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
    onError: (error) => {
      console.error('Logo upload error:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: HeaderSettingsFormData) => headerApi.updateHeaderSettings(data),
    onSuccess: async () => {
      // Invalidate both query keys to ensure public header updates
      await queryClient.invalidateQueries({ queryKey: ['header-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['header-settings-public'] });
      await queryClient.refetchQueries({ queryKey: ['header-settings'] });
      await queryClient.refetchQueries({ queryKey: ['header-settings-public'] });
      alert('Header settings updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating header settings:', error);
      alert(error.message || 'Failed to update header settings');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, WebP, and SVG images are allowed.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB.');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      alert('Please select a logo file first');
      return;
    }

    setUploadStatus('uploading');
    logoUploadMutation.mutate(logoFile);
  };

  const handleLogoReset = async () => {
    if (!logoPreview && !settingsResponse?.logo) {
      alert('No logo to reset');
      return;
    }

    if (!confirm('Are you sure you want to remove the header logo?')) {
      return;
    }

    try {
      // Clear local state
      setLogoPreview(null);
      setLogoFile(null);
      
      // Clear the file input
      const fileInput = document.getElementById('header-logo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Update settings with empty logo
      await updateSettingsMutation.mutateAsync({
        ...watch(),
        logo: '',
      });

      // Refetch settings to get updated state
      await queryClient.invalidateQueries({ queryKey: ['header-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['header-settings-public'] });
      await queryClient.refetchQueries({ queryKey: ['header-settings'] });
      await queryClient.refetchQueries({ queryKey: ['header-settings-public'] });
      
      alert('Header logo removed successfully!');
    } catch (error: any) {
      console.error('Error resetting logo:', error);
      alert(error.message || 'Failed to reset logo');
    }
  };

  const onSubmit = (data: HeaderSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading header settings...</div>
      </div>
    );
  }

  const formData = watch();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Menu className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Manage Header Design</h1>
          <p className="text-gray-600 mt-1">Customize your landing page header appearance and behavior</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Live Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Preview how your header will look</CardDescription>
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
            {showPreview && (
              <div className="relative">
                <header
                  className={`border-b border-gray-200 ${formData.isFixed ? 'fixed top-0 z-50 w-full' : formData.isTransparent ? 'absolute top-0 z-50 w-full' : 'relative'}`}
                  style={{
                    backgroundColor: formData.isTransparent ? 'transparent' : formData.backgroundColor || '#ffffff',
                    color: formData.textColor || '#1e293b',
                    backdropFilter: formData.isTransparent ? 'blur(8px)' : 'none',
                  }}
                >
                  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const currentLogo = logoPreview || settingsResponse?.logo;
                        const logoType = formData.logoType || 'with-text';
                        if (currentLogo) {
                          return (
                            <>
                              <img
                                src={getImageUrl(currentLogo)}
                                alt="Logo"
                                className={logoType === 'wide' ? 'h-12 w-auto max-w-[250px]' : 'h-10 w-auto max-w-[180px]'}
                                style={{ objectFit: 'contain' }}
                              />
                              {logoType === 'with-text' && (
                                <span className="text-xl font-bold" style={{ color: formData.textColor || '#1e293b' }}>
                                  {themeSettings?.siteName || 'Omni CRM'}
                                </span>
                              )}
                            </>
                          );
                        }
                        return (
                          <>
                            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
                              <span className="text-white font-bold text-xl">O</span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: formData.textColor || '#1e293b' }}>
                              {themeSettings?.siteName || 'Omni CRM'}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <a href="#" style={{ color: formData.textColor || '#1e293b' }}>
                        {formData.menuAbout || 'About'}
                      </a>
                      <a href="#" style={{ color: formData.textColor || '#1e293b' }}>
                        {formData.menuServices || 'Services'}
                      </a>
                      <a href="#" style={{ color: formData.textColor || '#1e293b' }}>
                        {formData.menuContact || 'Contact'}
                      </a>
                      <a href="#" style={{ color: formData.textColor || '#1e293b' }}>
                        {formData.menuTerms || 'Terms'}
                      </a>
                      <a href="#" style={{ color: formData.textColor || '#1e293b' }}>
                        {formData.menuPrivacy || 'Privacy'}
                      </a>
                      <a href="#" style={{ color: formData.textColor || '#1e293b' }}>
                        {formData.menuSitemap || 'Sitemap'}
                      </a>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        style={{
                          backgroundColor: formData.buttonSecondaryBgColor === 'transparent' ? 'transparent' : formData.buttonSecondaryBgColor || 'transparent',
                          color: formData.buttonSecondaryTextColor || '#1e293b',
                        }}
                      >
                        {formData.buttonSecondaryText || 'Sign In'}
                      </Button>
                      <Button
                        style={{
                          backgroundColor: formData.buttonBgColor || '#4f46e5',
                          color: formData.buttonTextColor || '#ffffff',
                        }}
                      >
                        {formData.buttonPrimaryText || 'Get Started'}
                      </Button>
                    </div>
                  </div>
                </header>
                {formData.isFixed && (
                  <div className="h-20 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                    Content area (header is fixed above)
                  </div>
                )}
                {formData.isTransparent && !formData.isFixed && (
                  <div className="h-96 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-lg">
                    Hero Section (header overlays this)
                  </div>
                )}
              </div>
            )}
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

        {/* Header Design Form */}
        <Card>
          <CardHeader>
            <CardTitle>Header Design Settings</CardTitle>
            <CardDescription>Customize the header menu items, buttons, colors, and positioning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Menu Items Section */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">Menu Items</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="menu-about">About</Label>
                    <Input
                      id="menu-about"
                      {...register('menuAbout')}
                      placeholder="About"
                      className="mt-2"
                    />
                    {errors.menuAbout && (
                      <p className="text-sm text-red-600 mt-1">{errors.menuAbout.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="menu-services">Services</Label>
                    <Input
                      id="menu-services"
                      {...register('menuServices')}
                      placeholder="Services"
                      className="mt-2"
                    />
                    {errors.menuServices && (
                      <p className="text-sm text-red-600 mt-1">{errors.menuServices.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="menu-contact">Contact</Label>
                    <Input
                      id="menu-contact"
                      {...register('menuContact')}
                      placeholder="Contact"
                      className="mt-2"
                    />
                    {errors.menuContact && (
                      <p className="text-sm text-red-600 mt-1">{errors.menuContact.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="menu-terms">Terms</Label>
                    <Input
                      id="menu-terms"
                      {...register('menuTerms')}
                      placeholder="Terms"
                      className="mt-2"
                    />
                    {errors.menuTerms && (
                      <p className="text-sm text-red-600 mt-1">{errors.menuTerms.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="menu-privacy">Privacy</Label>
                    <Input
                      id="menu-privacy"
                      {...register('menuPrivacy')}
                      placeholder="Privacy"
                      className="mt-2"
                    />
                    {errors.menuPrivacy && (
                      <p className="text-sm text-red-600 mt-1">{errors.menuPrivacy.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="menu-sitemap">Sitemap</Label>
                    <Input
                      id="menu-sitemap"
                      {...register('menuSitemap')}
                      placeholder="Sitemap"
                      className="mt-2"
                    />
                    {errors.menuSitemap && (
                      <p className="text-sm text-red-600 mt-1">{errors.menuSitemap.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Section */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">Header Logo</h3>
                </div>
                <div>
                  <Label htmlFor="logo-type">Logo Type</Label>
                  <select
                    id="logo-type"
                    {...register('logoType')}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="with-text">Logo with Text</option>
                    <option value="wide">Wide Logo (without text)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {watch('logoType') === 'wide' 
                      ? 'Recommended size: 250px × 80px (or SVG for best quality)'
                      : 'Recommended size: 180px × 50px (or SVG for best quality)'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="header-logo">Logo Image (SVG, PNG, JPG, WebP supported)</Label>
                  <div className="mt-2 flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                    {(() => {
                      const currentLogo = logoPreview || settingsResponse?.logo;
                      return currentLogo ? (
                        <img
                          src={getImageUrl(currentLogo)}
                          alt="Header logo preview"
                          className={`object-contain ${watch('logoType') === 'wide' ? 'max-h-20' : 'max-h-12'}`}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No logo uploaded</p>
                        </div>
                      );
                    })()}
                  </div>
                  <Input
                    id="header-logo"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="mt-2"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={!logoFile || uploadStatus === 'uploading'}
                      className="flex-1"
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
                          Upload Logo
                        </>
                      )}
                    </Button>
                    {(logoPreview || settingsResponse?.logo) && (
                      <Button
                        type="button"
                        onClick={handleLogoReset}
                        disabled={updateSettingsMutation.isPending}
                        variant="outline"
                        className="flex-1"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Logo Requirements:</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• <strong>Formats:</strong> SVG (recommended), PNG, JPG, WebP</li>
                      <li>• <strong>Maximum File Size:</strong> 2MB</li>
                      <li>• <strong>SVG Support:</strong> Best for scalability and quality</li>
                      <li>• <strong>Logo with Text:</strong> Recommended 180px × 50px</li>
                      <li>• <strong>Wide Logo:</strong> Recommended 250px × 80px</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Button Text Section */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-slate-900">Button Text</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="button-primary-text">Primary Button Text</Label>
                    <Input
                      id="button-primary-text"
                      {...register('buttonPrimaryText')}
                      placeholder="Get Started"
                      className="mt-2"
                    />
                    {errors.buttonPrimaryText && (
                      <p className="text-sm text-red-600 mt-1">{errors.buttonPrimaryText.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="button-secondary-text">Secondary Button Text</Label>
                    <Input
                      id="button-secondary-text"
                      {...register('buttonSecondaryText')}
                      placeholder="Sign In"
                      className="mt-2"
                    />
                    {errors.buttonSecondaryText && (
                      <p className="text-sm text-red-600 mt-1">{errors.buttonSecondaryText.message}</p>
                    )}
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
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700">Header Colors</h4>
                    <ColorPicker
                      label="Background Color"
                      value={watch('backgroundColor') || '#ffffff'}
                      onChange={(value) => {
                        const currentValues = watch();
                        reset({ ...currentValues, backgroundColor: value });
                      }}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={watch('textColor') || '#1e293b'}
                      onChange={(value) => {
                        const currentValues = watch();
                        reset({ ...currentValues, textColor: value });
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700">Primary Button</h4>
                    <ColorPicker
                      label="Background Color"
                      value={watch('buttonBgColor') || '#4f46e5'}
                      onChange={(value) => {
                        const currentValues = watch();
                        reset({ ...currentValues, buttonBgColor: value });
                      }}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={watch('buttonTextColor') || '#ffffff'}
                      onChange={(value) => {
                        const currentValues = watch();
                        reset({ ...currentValues, buttonTextColor: value });
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700">Secondary Button</h4>
                    <ColorPicker
                      label="Background Color"
                      value={watch('buttonSecondaryBgColor') || 'transparent'}
                      onChange={(value) => {
                        const currentValues = watch();
                        reset({ ...currentValues, buttonSecondaryBgColor: value });
                      }}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={watch('buttonSecondaryTextColor') || '#1e293b'}
                      onChange={(value) => {
                        const currentValues = watch();
                        reset({ ...currentValues, buttonSecondaryTextColor: value });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Header Positioning Section */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-slate-900">Header Positioning</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is-fixed"
                      {...register('isFixed')}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <Label htmlFor="is-fixed" className="cursor-pointer">
                      Fixed Header (sticky at top when scrolling)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is-transparent"
                      {...register('isTransparent')}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <Label htmlFor="is-transparent" className="cursor-pointer">
                      Transparent Header (overlay hero section)
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can enable both options: Fixed + Transparent will create a sticky transparent header that overlays the hero section.
                  </p>
                </div>
              </div>

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
                  'Save Header Settings'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
