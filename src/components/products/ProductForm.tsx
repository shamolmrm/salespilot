'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProductCategories, useCreateCategory, type Product } from '@/hooks/useProducts';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

const Schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  price: z.coerce.number().min(0),
  currency: z.string().length(3).default('USD'),
  stockCount: z.coerce.number().int().min(0).default(0),
  unit: z.string().default('item'),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional(),
});
type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => Promise<void>;
  initial?: Product;
}

export function ProductForm({ open, onClose, onSubmit, initial }: Props) {
  const { data: categories = [] } = useProductCategories();
  const createCategory = useCreateCategory();
  const { toast } = useToast();
  const [newCat, setNewCat] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      sku: initial?.sku ?? '',
      price: initial?.price ?? 0,
      currency: initial?.currency ?? 'USD',
      stockCount: initial?.stockCount ?? 0,
      unit: initial?.unit ?? 'item',
      imageUrl: initial?.imageUrl ?? '',
      isActive: initial?.isActive ?? true,
      categoryId: initial?.categoryId ?? '',
    },
  });

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      const cat = await createCategory.mutateAsync({ name: newCat.trim() });
      setValue('categoryId', cat.id);
      setNewCat('');
      toast({ title: 'Category added' });
    } catch {
      toast({ title: 'Category exists or error', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input {...register('sku')} placeholder="PROD-001" />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input {...register('unit')} placeholder="item" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Price *</Label>
              <Input {...register('price')} type="number" step="0.01" min="0" />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input {...register('currency')} placeholder="USD" maxLength={3} className="uppercase" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Stock Count</Label>
            <Input {...register('stockCount')} type="number" min="0" step="1" />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={watch('categoryId') ?? ''} onValueChange={(v) => setValue('categoryId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1">
                <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category…" className="w-32 text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={addCategory}>Add</Button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Image URL (optional)</Label>
            <Input {...register('imageUrl')} placeholder="https://…" />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register('description')} rows={3} className="resize-none" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{initial ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
