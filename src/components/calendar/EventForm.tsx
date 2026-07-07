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
import type { CalendarEvent } from '@/hooks/useCalendar';

const Schema = z.object({
  title: z.string().min(1, 'Required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['MEETING', 'TASK', 'REMINDER', 'CALL', 'DEMO']),
  startAt: z.string().min(1, 'Required'),
  endAt: z.string().optional(),
  location: z.string().max(300).optional(),
  attendees: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});
type FormValues = z.infer<typeof Schema>;

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => Promise<void>;
  initial?: CalendarEvent;
}

export function EventForm({ open, onClose, onSubmit, initial }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      type: initial?.type ?? 'MEETING',
      startAt: toLocalInput(initial?.startAt),
      endAt: toLocalInput(initial?.endAt),
      location: initial?.location ?? '',
      attendees: initial?.attendees ?? '',
      status: initial?.status ?? 'SCHEDULED',
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      ...values,
      startAt: new Date(values.startAt).toISOString(),
      endAt: values.endAt ? new Date(values.endAt).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['MEETING', 'TASK', 'REMINDER', 'CALL', 'DEMO'] as const).map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {initial && (
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={watch('status')} onValueChange={(v) => setValue('status', v as FormValues['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start</Label>
              <Input {...register('startAt')} type="datetime-local" />
              {errors.startAt && <p className="text-xs text-destructive">{errors.startAt.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>End (optional)</Label>
              <Input {...register('endAt')} type="datetime-local" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <Input {...register('location')} placeholder="Room / Video link" />
          </div>

          <div className="space-y-1">
            <Label>Attendees (comma-separated emails)</Label>
            <Input {...register('attendees')} placeholder="alice@co.com, bob@co.com" />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register('description')} rows={3} className="resize-none" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {initial ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
