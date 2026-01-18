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
import { themeApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { Palette, Upload, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

const themeSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
});

type ThemeSettingsFormData = z.infer<typeof themeSettingsSchema>;

interface ThemeSettings {
  siteLogo: string | null;
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export default function ThemeDesign() {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Fetch theme settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      const response = await themeApi.getThemeSettings();
      return response.data.data as ThemeSettings;
    },
  });

  const settings = settingsResponse || {
    siteLogo: null,
    siteName: 'Omni CRM',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
  };

  // Initialize form with settings
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ThemeSettingsFormData>({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: {
      siteName: settings.siteName,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      contactAddress: settings.contactAddress,
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settingsResponse) {
      reset({
        siteName: settingsResponse.siteName,
        contactEmail: settingsResponse.contactEmail,
        contactPhone: settingsResponse.contactPhone,
        contactAddress: settingsResponse.contactAddress,
      });
      if (settingsResponse.siteLogo) {
        setLogoPreview(settingsResponse.siteLogo);
      }
    }
  }, [settingsResponse, reset]);

  // Logo upload mutation
  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => themeApi.uploadLogo(file),
    onSuccess: (response) => {
      setUploadStatus('success');
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      if (response.data.data?.logoPath) {
        setLogoPreview(response.data.data.logoPath);
      }
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
    onError: () => {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: ThemeSettingsFormData) => themeApi.updateThemeSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      alert('Theme settings updated successfully!');
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to update theme settings');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.');
        return;
      }

      // Validate file size (2MB)
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

  const onSubmit = (data: ThemeSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading theme settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Theme Design</h1>
          <p className="text-gray-600 mt-1">Customize your site logo, name, and contact information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Site Logo</CardTitle>
            <CardDescription>Upload your site logo. It will be displayed in the header and sidebar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Preview */}
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              {logoPreview ? (
                <img
                  src={getImageUrl(logoPreview)}
                  alt="Logo preview"
                  className="max-w-full max-h-32 object-contain"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No logo uploaded</p>
                </div>
              )}
            </div>

            {/* Logo Upload Input */}
            <div>
              <Label htmlFor="logo-upload">Select Logo</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="mt-2"
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleLogoUpload}
              disabled={!logoFile || uploadStatus === 'uploading'}
              className="w-full"
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
              ) : uploadStatus === 'error' ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Upload Failed
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </>
              )}
            </Button>

            {/* Logo Requirements */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Logo Requirements:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Recommended Size:</strong> 200x50 pixels (width x height)</li>
                <li>• <strong>Maximum Size:</strong> 500x150 pixels</li>
                <li>• <strong>File Formats:</strong> PNG, JPG, JPEG, SVG, WebP</li>
                <li>• <strong>Maximum File Size:</strong> 2MB</li>
                <li>• <strong>Aspect Ratio:</strong> 4:1 (width:height) recommended for best display</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Site Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
            <CardDescription>Update your site name and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Site Name */}
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  {...register('siteName')}
                  placeholder="Omni CRM"
                  className="mt-2"
                />
                {errors.siteName && (
                  <p className="text-sm text-red-600 mt-1">{errors.siteName.message}</p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  {...register('contactEmail')}
                  placeholder="contact@example.com"
                  className="mt-2"
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactEmail.message}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  {...register('contactPhone')}
                  placeholder="+1 (555) 123-4567"
                  className="mt-2"
                />
                {errors.contactPhone && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactPhone.message}</p>
                )}
              </div>

              {/* Contact Address */}
              <div>
                <Label htmlFor="contact-address">Contact Address</Label>
                <Textarea
                  id="contact-address"
                  {...register('contactAddress')}
                  placeholder="123 Innovation Road, Level 5, Dhaka, Bangladesh"
                  className="mt-2"
                  rows={3}
                />
                {errors.contactAddress && (
                  <p className="text-sm text-red-600 mt-1">{errors.contactAddress.message}</p>
                )}
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
                  'Save Settings'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

