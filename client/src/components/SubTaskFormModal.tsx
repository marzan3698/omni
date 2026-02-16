import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const subTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instructions: z.string().optional(),
  weight: z.number().min(0.1, 'Weight must be at least 0.1').max(10, 'Weight cannot exceed 10').default(1),
  order: z.number().int().optional(),
});

type SubTaskFormData = z.infer<typeof subTaskSchema>;

interface SubTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubTaskFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<SubTaskFormData>;
}

export function SubTaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
}: SubTaskFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubTaskFormData>({
    resolver: zodResolver(subTaskSchema),
    defaultValues: {
      title: initialData?.title || '',
      instructions: initialData?.instructions || '',
      weight: initialData?.weight || 1,
      order: initialData?.order || undefined,
    },
  });

  const handleFormSubmit = (data: SubTaskFormData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const btnOutline = 'bg-slate-800/60 border-amber-500/50 text-amber-100 hover:bg-amber-500/20 hover:border-amber-500/70';
  const inputDark = 'bg-slate-800/60 border-amber-500/20 text-amber-100';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="game-panel rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-500/30">
        <div className="sticky top-0 border-b border-amber-500/20 p-6 flex items-center justify-between bg-slate-900/95 z-10">
          <h2 className="text-xl font-semibold text-amber-100">Add Sub-task</h2>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/20">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <Label htmlFor="title" className="text-amber-200/90">Title <span className="text-red-400">*</span></Label>
            <Input id="title" {...register('title')} placeholder="Enter sub-task title" className={cn('mt-1', inputDark, errors.title && 'border-red-500/50')} />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="instructions" className="text-amber-200/90">Instructions</Label>
            <Textarea id="instructions" {...register('instructions')} placeholder="Enter detailed instructions for this sub-task" rows={4} className={cn('mt-1', inputDark)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="text-amber-200/90">Weight (for progress calculation)</Label>
              <Input id="weight" type="number" step="0.1" min="0.1" max="10" {...register('weight', { valueAsNumber: true })} placeholder="1.0" className={cn('mt-1', inputDark, errors.weight && 'border-red-500/50')} />
              {errors.weight && <p className="mt-1 text-xs text-red-400">{errors.weight.message}</p>}
              <p className="mt-1 text-xs text-amber-200/70">Default: 1.0. Higher weight = more impact on progress</p>
            </div>
            <div>
              <Label htmlFor="order" className="text-amber-200/90">Display Order (optional)</Label>
              <Input id="order" type="number" {...register('order', { valueAsNumber: true, setValueAs: (v) => (v === '' ? undefined : Number(v)) })} placeholder="Auto" className={cn('mt-1', inputDark)} />
              <p className="mt-1 text-xs text-amber-200/70">Leave empty for auto-ordering</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className={btnOutline}>Cancel</Button>
            <Button type="submit" className="bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Sub-task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

