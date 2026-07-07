'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSendEmail, useAiEmailReply, type EmailAccount, type EmailMessage } from '@/hooks/useEmail';
import { useToast } from '@/components/ui/use-toast';

const Schema = z.object({
  accountId: z.string().min(1, 'Select an account'),
  to: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Required').regex(/^[^\r\n]+$/, 'No line breaks'),
  body: z.string().min(1, 'Required'),
});
type FormValues = z.infer<typeof Schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  replyTo?: EmailMessage;
}

export function ComposeModal({ open, onClose, accounts, replyTo }: Props) {
  const sendEmail = useSendEmail();
  const aiReply = useAiEmailReply();
  const { toast } = useToast();
  const [aiInstruction, setAiInstruction] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      accountId: accounts[0]?.id ?? '',
      to: replyTo?.fromEmail ?? '',
      subject: replyTo ? `Re: ${replyTo.subject}` : '',
      body: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        accountId: accounts[0]?.id ?? '',
        to: replyTo?.fromEmail ?? '',
        subject: replyTo ? `Re: ${replyTo.subject}` : '',
        body: '',
      });
    }
  }, [open, replyTo, accounts, reset]);

  const onSubmit = async (values: FormValues) => {
    const creds = window.electronAPI
      ? await window.electronAPI.invoke('get-email-credentials', values.accountId)
      : null;
    if (!creds) {
      toast({ title: 'Error', description: 'Email credentials not found. Re-add the account.', variant: 'destructive' });
      return;
    }
    try {
      await sendEmail.mutateAsync({ ...values, smtpPassword: creds.smtpPassword });
      toast({ title: 'Email sent' });
      onClose();
    } catch (err: unknown) {
      toast({ title: 'Send failed', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleAiReply = async () => {
    if (!replyTo) return;
    try {
      const res = await aiReply.mutateAsync({ emailId: replyTo.id, instruction: aiInstruction });
      setValue('body', res.reply);
    } catch (err: unknown) {
      toast({ title: 'AI Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{replyTo ? 'Reply to Email' : 'Compose Email'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>From Account</Label>
            <Select
              value={watch('accountId')}
              onValueChange={(v) => setValue('accountId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.fromEmail})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>To</Label>
            <Input {...register('to')} placeholder="recipient@example.com" />
            {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Subject</Label>
            <Input {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          {replyTo && (
            <div className="flex gap-2">
              <Input
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="AI instruction (optional)…"
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAiReply} disabled={aiReply.isPending} className="gap-1 shrink-0">
                {aiReply.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI Reply
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label>Body</Label>
            <Textarea {...register('body')} rows={8} className="resize-none font-mono text-sm" />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
