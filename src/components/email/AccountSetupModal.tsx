'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAddEmailAccount } from '@/hooks/useEmail';
import { useToast } from '@/components/ui/use-toast';

const Schema = z.object({
  name: z.string().min(1, 'Required'),
  fromEmail: z.string().email('Invalid email'),
  smtpHost: z.string().min(1, 'Required'),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpUser: z.string().min(1, 'Required'),
  smtpPassword: z.string().min(1, 'Required'),
  imapHost: z.string().optional(),
  imapPort: z.coerce.number().int().min(1).max(65535).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  imapUser: z.string().optional(),
  imapPassword: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AccountSetupModal({ open, onClose }: Props) {
  const addAccount = useAddEmailAccount();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { smtpPort: 587 },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await addAccount.mutateAsync(values);
      // Store credentials encrypted in Electron safeStorage
      if (window.electronAPI) {
        await window.electronAPI.invoke(
          'store-email-credentials',
          result.id,
          result.smtpPassword,
          result.imapPassword,
        );
      }
      toast({ title: 'Email account added' });
      reset();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save account';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Email Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Display Name</Label>
              <Input {...register('name')} placeholder="Work Email" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>From Email</Label>
              <Input {...register('fromEmail')} placeholder="you@company.com" />
              {errors.fromEmail && <p className="text-xs text-destructive">{errors.fromEmail.message}</p>}
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">SMTP (Sending)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>SMTP Host</Label>
              <Input {...register('smtpHost')} placeholder="smtp.gmail.com" />
              {errors.smtpHost && <p className="text-xs text-destructive">{errors.smtpHost.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Port</Label>
              <Input {...register('smtpPort')} type="number" placeholder="587" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Username</Label>
              <Input {...register('smtpUser')} placeholder="you@company.com" />
              {errors.smtpUser && <p className="text-xs text-destructive">{errors.smtpUser.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Password / App Password</Label>
              <Input {...register('smtpPassword')} type="password" />
              {errors.smtpPassword && <p className="text-xs text-destructive">{errors.smtpPassword.message}</p>}
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">IMAP (Receiving — optional)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>IMAP Host</Label>
              <Input {...register('imapHost')} placeholder="imap.gmail.com" />
            </div>
            <div className="space-y-1">
              <Label>Port</Label>
              <Input {...register('imapPort')} type="number" placeholder="993" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>IMAP Username</Label>
              <Input {...register('imapUser')} placeholder="you@company.com" />
            </div>
            <div className="space-y-1">
              <Label>IMAP Password</Label>
              <Input {...register('imapPassword')} type="password" placeholder="Leave blank to reuse SMTP" />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Save Account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
