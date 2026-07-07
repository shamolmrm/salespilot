'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useManualPayment, useStripeCheckout, usePayPalOrder } from '@/hooks/usePayments';
import type { Invoice } from '@/hooks/useInvoices';
import { CreditCard, Wallet, Banknote, ExternalLink } from 'lucide-react';

const ManualSchema = z.object({
  amount: z.coerce.number().positive('Amount required'),
  payerEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});
type ManualFormValues = z.infer<typeof ManualSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
}

type Tab = 'manual' | 'stripe' | 'paypal';

export function PaymentModal({ open, onClose, invoice }: Props) {
  const [tab, setTab] = useState<Tab>('manual');
  const { toast } = useToast();
  const manualPayment = useManualPayment();
  const stripeCheckout = useStripeCheckout();
  const paypalOrder = usePayPalOrder();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ManualFormValues>({
    resolver: zodResolver(ManualSchema),
    defaultValues: { amount: invoice.amountDue, payerEmail: '', notes: '' },
  });

  const handleManual = async (data: ManualFormValues) => {
    try {
      await manualPayment.mutateAsync({ invoiceId: invoice.id, amount: data.amount, currency: invoice.currency, payerEmail: data.payerEmail || undefined, notes: data.notes });
      toast({ title: 'Payment recorded' });
      onClose();
    } catch {
      toast({ title: 'Error recording payment', variant: 'destructive' });
    }
  };

  const handleStripe = async () => {
    try {
      const { checkoutUrl } = await stripeCheckout.mutateAsync({ invoiceId: invoice.id });
      // In Electron / browser, open the checkout URL
      window.open(checkoutUrl, '_blank');
      toast({ title: 'Stripe checkout opened in browser' });
      onClose();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Stripe error', variant: 'destructive' });
    }
  };

  const handlePayPal = async () => {
    try {
      const { approvalUrl } = await paypalOrder.mutateAsync({ invoiceId: invoice.id });
      window.open(approvalUrl, '_blank');
      toast({ title: 'PayPal checkout opened in browser' });
      onClose();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'PayPal error', variant: 'destructive' });
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: invoice.currency });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment — {invoice.number}</DialogTitle>
          <p className="text-sm text-muted-foreground">Amount due: {fmt(invoice.amountDue)}</p>
        </DialogHeader>

        <div className="flex border rounded-lg overflow-hidden mb-4">
          {([['manual', 'Manual', Banknote], ['stripe', 'Stripe', CreditCard], ['paypal', 'PayPal', Wallet]] as [Tab, string, React.ComponentType<{ size?: number }>][]).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm transition-colors ${tab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'manual' && (
          <form onSubmit={handleSubmit(handleManual)} className="space-y-3">
            <div className="space-y-1">
              <Label>Amount *</Label>
              <Input {...register('amount')} type="number" step="0.01" min="0.01" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Payer Email</Label>
              <Input {...register('payerEmail')} placeholder="payer@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input {...register('notes')} placeholder="Reference, cheque #, etc." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Record Payment</Button>
            </DialogFooter>
          </form>
        )}

        {tab === 'stripe' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Opens Stripe Checkout in a browser tab. The payment will be recorded automatically via webhook.</p>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">Sandbox mode only — use test card <code>4242 4242 4242 4242</code></p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleStripe} disabled={stripeCheckout.isPending}>
                <ExternalLink size={14} className="mr-1" />
                Open Stripe Checkout
              </Button>
            </DialogFooter>
          </div>
        )}

        {tab === 'paypal' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Opens PayPal in a browser tab to complete the payment.</p>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">Sandbox mode only — use your PayPal sandbox buyer account</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handlePayPal} disabled={paypalOrder.isPending}>
                <ExternalLink size={14} className="mr-1" />
                Open PayPal
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
