import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GamePanel } from '@/components/GamePanel';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { colorApi } from '@/lib/api';
import { Palette, Loader2, CheckCircle, Eye } from 'lucide-react';

const colorSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
});

type ColorSettingsFormData = z.infer<typeof colorSettingsSchema>;

interface ColorSettings {
  primaryColor: string;
  secondaryColor: string;
}

// Helper function to darken a color
const darkenColor = (color: string, amount: number): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  const fullHex = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  // Convert to RGB
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  // Darken
  const darkerR = Math.max(0, r - amount);
  const darkerG = Math.max(0, g - amount);
  const darkerB = Math.max(0, b - amount);
  
  // Convert back to hex
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

export default function ManageColors() {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  // Fetch color settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['color-settings'],
    queryFn: async () => {
      const response = await colorApi.getColorSettings();
      return response.data.data as ColorSettings;
    },
  });

  const settings = settingsResponse || {
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ColorSettingsFormData>({
    resolver: zodResolver(colorSettingsSchema),
    defaultValues: {
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settingsResponse) {
      reset({
        primaryColor: settingsResponse.primaryColor,
        secondaryColor: settingsResponse.secondaryColor,
      });
    }
  }, [settingsResponse, reset]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: ColorSettingsFormData) => colorApi.updateColorSettings(data),
    onSuccess: async () => {
      // Invalidate both query keys to ensure public landing page updates
      await queryClient.invalidateQueries({ queryKey: ['color-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['color-settings-public'] });
      await queryClient.refetchQueries({ queryKey: ['color-settings'] });
      await queryClient.refetchQueries({ queryKey: ['color-settings-public'] });
      alert('Color settings updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating color settings:', error);
      alert(error.message || 'Failed to update color settings');
    },
  });

  const onSubmit = (data: ColorSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-amber-200/80">Loading color settings...</div>
      </div>
    );
  }

  const formData = watch();
  const darkerSecondary = darkenColor(formData.secondaryColor || settings.secondaryColor, 30);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 p-4 rounded-xl border border-amber-500/20 bg-slate-800/40">
        <Palette className="h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-3xl font-bold text-amber-100">Manage Colors</h1>
          <p className="text-amber-200/80 mt-1">Set primary and secondary colors for your landing page</p>
        </div>
      </div>

      <div className="space-y-6">
        <GamePanel>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-amber-100">Live Preview</h2>
                <p className="text-sm text-amber-200/70">Preview how colors will appear on your landing page</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="border-amber-500/50 text-amber-100 hover:bg-amber-500/20">
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
            {showPreview && (
              <div className="space-y-4 mt-4">
                {/* Gradient Preview */}
                <div
                  className="h-32 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    background: `linear-gradient(to bottom right, ${formData.primaryColor || settings.primaryColor}, ${formData.secondaryColor || settings.secondaryColor}, ${darkerSecondary})`,
                  }}
                >
                  Hero Section Gradient
                </div>

                {/* Button Preview */}
                <div className="flex gap-4">
                  <Button
                    style={{
                      backgroundColor: formData.primaryColor || settings.primaryColor,
                      color: '#ffffff',
                    }}
                  >
                    Primary Button
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      borderColor: formData.primaryColor || settings.primaryColor,
                      color: formData.primaryColor || settings.primaryColor,
                    }}
                  >
                    Secondary Button
                  </Button>
                </div>

                {/* Stats Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-3xl font-bold mb-1" style={{ color: formData.primaryColor || settings.primaryColor }}>
                      1000+
                    </div>
                    <div className="text-sm text-amber-200/70">Stats Number</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-3xl font-bold mb-1" style={{ color: formData.primaryColor || settings.primaryColor }}>
                      50K+
                    </div>
                    <div className="text-sm text-amber-200/70">Stats Number</div>
                  </div>
                </div>

                {/* Icon Preview */}
                <div className="flex items-center gap-2 p-4 border rounded-lg">
                  <Palette
                    className="w-6 h-6"
                    style={{ color: formData.primaryColor || settings.primaryColor }}
                  />
                  <span className="text-amber-100">Icon with primary color</span>
                </div>
              </div>
            )}
            {!showPreview && (
              <div className="flex items-center justify-center p-12 border-2 border-dashed border-amber-500/30 rounded-lg bg-slate-800/60 mt-4">
                <div className="text-center text-amber-200/70">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-amber-500/60" />
                  <p className="text-sm">Click "Show Preview" to see live preview</p>
                </div>
              </div>
            )}
          </div>
        </GamePanel>

        <GamePanel>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-amber-100">Color Settings</h2>
            <p className="text-sm text-amber-200/70 mb-4">Set the primary and secondary colors that will be used throughout your landing page</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-slate-800/60 rounded-lg border border-amber-500/20">
                  <Label htmlFor="primary-color" className="text-amber-200/90">Primary Color</Label>
                  <ColorPicker
                    label="Primary Color"
                    value={watch('primaryColor') || settings.primaryColor}
                    onChange={(value) => reset({ ...watch(), primaryColor: value })}
                  />
                  {errors.primaryColor && <p className="text-sm text-red-400 mt-1">{errors.primaryColor.message}</p>}
                  <p className="text-xs text-amber-200/70 mt-2">
                    This color will be used for primary buttons, gradients, stats, icons, and highlights.
                  </p>
                </div>

                <div className="space-y-4 p-4 bg-slate-800/60 rounded-lg border border-amber-500/20">
                  <Label htmlFor="secondary-color" className="text-amber-200/90">Secondary Color</Label>
                  <ColorPicker
                    label="Secondary Color"
                    value={watch('secondaryColor') || settings.secondaryColor}
                    onChange={(value) => reset({ ...watch(), secondaryColor: value })}
                  />
                  {errors.secondaryColor && <p className="text-sm text-red-400 mt-1">{errors.secondaryColor.message}</p>}
                  <p className="text-xs text-amber-200/70 mt-2">
                    This color will be used in gradients and as accent color throughout the page.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/20 rounded-lg border border-amber-500/40">
                <h4 className="text-sm font-semibold text-amber-200 mb-2">Color Application:</h4>
                <ul className="text-xs text-amber-200/90 space-y-1">
                  <li>• Hero section gradients will use both primary and secondary colors</li>
                  <li>• Primary buttons will use the primary color</li>
                  <li>• Stats numbers and icons will use the primary color</li>
                  <li>• Background overlays will use the primary color with opacity</li>
                  <li>• All indigo/purple colors will be replaced with your custom colors</li>
                </ul>
              </div>

              <Button type="submit" disabled={updateSettingsMutation.isPending} className="w-full bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50">
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Color Settings
                  </>
                )}
              </Button>
            </form>
          </div>
        </GamePanel>
      </div>
    </div>
  );
}
