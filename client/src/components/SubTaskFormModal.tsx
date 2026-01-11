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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Add Sub-task</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter sub-task title"
              className={cn('mt-1', errors.title && 'border-red-500')}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions" className="text-sm font-medium text-slate-700">
              Instructions
            </Label>
            <Textarea
              id="instructions"
              {...register('instructions')}
              placeholder="Enter detailed instructions for this sub-task"
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Weight and Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="text-sm font-medium text-slate-700">
                Weight (for progress calculation)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                {...register('weight', { valueAsNumber: true })}
                placeholder="1.0"
                className={cn('mt-1', errors.weight && 'border-red-500')}
              />
              {errors.weight && (
                <p className="mt-1 text-xs text-red-600">{errors.weight.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Default: 1.0. Higher weight = more impact on progress
              </p>
            </div>

            <div>
              <Label htmlFor="order" className="text-sm font-medium text-slate-700">
                Display Order (optional)
              </Label>
              <Input
                id="order"
                type="number"
                {...register('order', { valueAsNumber: true, setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                placeholder="Auto"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave empty for auto-ordering
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Sub-task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

