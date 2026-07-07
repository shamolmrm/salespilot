'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { CreateLeadSchema, type CreateLeadInput } from '@/lib/validations/lead';
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
import type { Lead } from '@/types';

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadInput) => Promise<void>;
  initial?: Lead | null;
}

export function LeadForm({ open, onClose, onSubmit, initial }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: {
      status: 'NEW',
      source: 'OTHER',
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        firstName: initial.firstName,
        lastName: initial.lastName,
        email: initial.email ?? '',
        phone: initial.phone ?? '',
        status: initial.status,
        source: initial.source,
        notes: initial.notes ?? '',
      });
    } else {
      reset({ status: 'NEW', source: 'OTHER' });
    }
  }, [initial, reset]);

  async function submit(data: CreateLeadInput) {
    await onSubmit(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Lead' : 'New Lead'}</DialogTitle>
        </DialogHeader>

        <form id="lead-form" onSubmit={handleSubmit(submit)} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v as CreateLeadInput['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={watch('source')} onValueChange={(v) => setValue('source', v as CreateLeadInput['source'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EMAIL', 'SOCIAL_MEDIA', 'EVENT', 'OTHER'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
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
          <Button type="submit" form="lead-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
