'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { CreateDealSchema, type CreateDealInput } from '@/lib/validations/deal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { STAGE_LABELS } from '@/types';
import type { Deal } from '@/types';

interface DealFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDealInput) => Promise<void>;
  initial?: Deal | null;
}

export function DealForm({ open, onClose, onSubmit, initial }: DealFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDealInput>({
    resolver: zodResolver(CreateDealSchema),
    defaultValues: {
      stage: 'PROSPECTING',
      priority: 'MEDIUM',
      value: 0,
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        title: initial.title,
        value: initial.value,
        stage: initial.stage,
        priority: initial.priority,
        notes: initial.notes ?? '',
        expectedCloseDate: initial.expectedCloseDate
          ? initial.expectedCloseDate.slice(0, 10)
          : '',
      });
    } else {
      reset({ stage: 'PROSPECTING', priority: 'MEDIUM', value: 0 });
    }
  }, [initial, reset]);

  async function submit(data: CreateDealInput) {
    await onSubmit(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Deal' : 'New Deal'}</DialogTitle>
        </DialogHeader>

        <form id="deal-form" onSubmit={handleSubmit(submit)} className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="value">Value ($)</Label>
              <Input id="value" type="number" min={0} step={0.01} {...register('value')} />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedCloseDate">Close Date</Label>
              <Input id="expectedCloseDate" type="date" {...register('expectedCloseDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={watch('stage')} onValueChange={(v) => setValue('stage', v as CreateDealInput['stage'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v as CreateDealInput['priority'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" form="deal-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
