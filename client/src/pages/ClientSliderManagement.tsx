import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { heroApi } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HeroSlide {
  id: string;
  image: string;
  width: number;
  height: number;
}

export default function ClientSliderManagement() {
  const queryClient = useQueryClient();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);

  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['hero-settings-admin'],
    queryFn: async () => {
      const response = await heroApi.getHeroSettings();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (settingsResponse?.hero_slides) {
      try {
        const parsedSlides = JSON.parse(settingsResponse.hero_slides);
        setSlides(parsedSlides);
      } catch (err) {
        console.error('Failed to parse slides:', err);
        setSlides([]);
      }
    }
  }, [settingsResponse]);

  const slideUploadMutation = useMutation({
    mutationFn: (file: File) => heroApi.uploadHeroSlideImage(file),
    onSuccess: (response, variables) => {
      const imageUrl = response.data.data.imagePath;
      if (uploadingSlideId) {
        setSlides(prev => prev.map(s => 
          s.id === uploadingSlideId ? { ...s, image: imageUrl } : s
        ));
      }
      setUploadingSlideId(null);
      alert('Slide image uploaded successfully');
    },
    onError: () => {
      setUploadingSlideId(null);
      alert('Failed to upload slide image');
    }
  });

  const updateSliderMutation = useMutation({
    mutationFn: (newSlides: HeroSlide[]) => heroApi.updateHeroSliderSettings(newSlides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-settings-admin'] });
      alert('Slider configuration saved');
    },
    onError: () => {
      alert('Failed to save slider configuration');
    }
  });

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: Math.random().toString(36).substr(2, 9),
      image: '',
      width: 1920,
      height: 600
    };
    setSlides([...slides, newSlide]);
  };

  const removeSlide = (id: string) => {
    setSlides(slides.filter(s => s.id !== id));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSlides.length) {
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      setSlides(newSlides);
    }
  };

  const updateSlideProperties = (id: string, updates: Partial<HeroSlide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSlideImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingSlideId(id);
      slideUploadMutation.mutate(file);
    }
  };

  const handleSave = () => {
    if (slides.some(s => !s.image)) {
      alert('Please upload images for all slides before saving.');
      return;
    }
    updateSliderMutation.mutate(slides);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Hero Sliders</h1>
          <p className="text-slate-500">Manage the image slider for the client dashboard hero section.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={addSlide}>
            <Plus className="mr-2 h-4 w-4" /> Add Slide
          </Button>
          <Button onClick={handleSave} disabled={updateSliderMutation.isPending}>
            {updateSliderMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {slides.length === 0 ? (
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
              <ImageIcon className="h-12 w-12 text-slate-300 mb-4" />
              <CardTitle className="text-slate-400">No slides added yet</CardTitle>
              <CardDescription className="mb-4">Click "Add Slide" to start building your hero slider.</CardDescription>
              <Button onClick={addSlide} variant="secondary">
                <Plus className="mr-2 h-4 w-4" /> Add your first slide
              </Button>
            </Card>
          ) : (
            slides.map((slide, index) => (
              <Card key={slide.id} className="overflow-hidden border-slate-200">
                <div className="flex p-4 gap-6">
                  <div className="w-1/3">
                    <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative group">
                      {slide.image ? (
                        <img 
                          src={getImageUrl(slide.image)} 
                          alt={`Slide ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Label htmlFor={`file-${slide.id}`} className="cursor-pointer text-white flex items-center gap-2">
                          <Upload className="h-4 w-4" /> Change
                        </Label>
                        <Input 
                          id={`file-${slide.id}`}
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleSlideImageChange(slide.id, e)}
                          accept="image/*"
                        />
                      </div>
                      {uploadingSlideId === slide.id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-slate-800">Slide #{index + 1}</h3>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={index === 0}
                          onClick={() => moveSlide(index, 'up')}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={index === slides.length - 1}
                          onClick={() => moveSlide(index, 'down')}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeSlide(slide.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Width (Pixels)</Label>
                        <Input 
                          type="number" 
                          value={slide.width} 
                          onChange={(e) => updateSlideProperties(slide.id, { width: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height (Pixels)</Label>
                        <Input 
                          type="number" 
                          value={slide.height} 
                          onChange={(e) => updateSlideProperties(slide.id, { height: parseInt(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    {!slide.image && (
                       <div className="p-2 bg-amber-50 rounded border border-amber-100 flex items-center gap-2 text-[10px] text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                         Image upload required for this slide.
                       </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Design Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Recommended Setup:</h4>
                <ul className="text-xs text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Dimensions:</strong> 1920x600 pixels is best for a modern, wide look.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Aspect Ratio:</strong> Keep all images consistent (e.g., 3:1 or 16:5) for a smooth slider experience.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>File Size:</strong> Below 2MB per image to ensure fast page loading.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Content:</strong> Center the focal point of your image as edges might be cropped on mobile.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">How it works:</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  These images will automatically rotate in the Hero section of the Client Dashboard. 
                  Ensure you have enabled the "Image Slider" background type in the <strong>Hero Design</strong> settings page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
