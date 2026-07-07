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
import { LineItemEditor } from '@/components/shared/LineItemEditor';
import type { Control, FieldValues } from 'react-hook-form';
import type { Invoice } from '@/hooks/useInvoices';

const Schema = z.object({
  customerId: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.coerce.number().positive().default(1),
  discountType: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1, 'Required'),
    quantity: z.coerce.number().min(0.001),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).default(0),
  })).min(1),
});
type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => Promise<void>;
  initial?: Invoice;
}

export function InvoiceForm({ open, onClose, onSubmit, initial }: Props) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      customerId: initial?.customerId ?? '',
      currency: initial?.currency ?? 'USD',
      exchangeRate: initial?.exchangeRate ?? 1,
      discountType: initial?.discountType ?? 'FIXED',
      discount: initial?.discount ?? 0,
      taxRate: initial?.taxRate ?? 0,
      notes: initial?.notes ?? '',
      terms: initial?.terms ?? '',
      dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
      items: initial?.items?.map((i) => ({ productId: i.productId ?? '', description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })) ?? [{ productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0 }],
    },
  });

  const currency = watch('currency');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Edit Invoice ${initial.number}` : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input {...register('currency')} maxLength={3} className="uppercase" />
            </div>
            <div className="space-y-1">
              <Label>Exchange Rate</Label>
              <Input {...register('exchangeRate')} type="number" step="0.000001" min="0.000001" />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input {...register('dueDate')} type="date" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Line Items *</Label>
            <LineItemEditor control={control as unknown as Control<FieldValues>} watch={watch} setValue={setValue} currency={currency} />
            {errors.items && <p className="text-xs text-destructive">At least one item required</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Discount Type</Label>
              <Select value={watch('discountType')} onValueChange={(v) => setValue('discountType', v as 'FIXED' | 'PERCENTAGE')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage %</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Discount</Label>
              <Input {...register('discount')} type="number" min="0" step="0.01" />
            </div>
            <div className="space-y-1">
              <Label>Tax Rate %</Label>
              <Input {...register('taxRate')} type="number" min="0" max="100" step="0.01" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={2} className="resize-none" />
          </div>
          <div className="space-y-1">
            <Label>Terms & Conditions</Label>
            <Textarea {...register('terms')} rows={2} className="resize-none" />
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
