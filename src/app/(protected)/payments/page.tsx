'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useInvoices } from '@/hooks/useInvoices';
import { useRefundPayment } from '@/hooks/usePayments';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { CreditCard, RefreshCw } from 'lucide-react';
import type { Invoice } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { toast } = useToast();
  const { user } = useAuth();
  const refundPayment = useRefundPayment();
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);

  const canRefund = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const handleRefund = async (paymentId: string) => {
    try {
      await refundPayment.mutateAsync({ paymentId });
      toast({ title: 'Refund issued' });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Refund failed', variant: 'destructive' });
    }
  };

  const allPayments = invoices
    .flatMap((inv) => inv.payments.map((p) => ({ ...p, invoice: inv })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingInvoices = invoices.filter((inv) => inv.amountDue > 0 && inv.status !== 'CANCELLED');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard size={22} />
        <h1 className="text-xl font-semibold">Payments</h1>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pending Invoices</h2>
        {pendingInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No pending invoices</p>
        ) : (
          <div className="space-y-2">
            {pendingInvoices.map((inv) => (
              <div key={inv.id} className="rounded-lg border px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium">{inv.number}</span>
                  {inv.customer && <span className="text-muted-foreground text-sm ml-2">— {inv.customer.firstName} {inv.customer.lastName}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{inv.amountDue.toLocaleString('en-US', { style: 'currency', currency: inv.currency })}</span>
                  <Button size="sm" onClick={() => setPayModalInvoice(inv)}>
                    <CreditCard size={14} className="mr-1" />Pay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Payment History</h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : allPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Invoice</th>
                  <th className="pb-2 pr-4 font-medium">Provider</th>
                  <th className="pb-2 pr-4 font-medium">Payer</th>
                  <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  {canRefund && <th className="pb-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {allPayments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-medium">{p.invoice.number}</td>
                    <td className="py-2 pr-4">{p.provider}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.payerEmail ?? (p.last4 ? `····${p.last4}` : '—')}</td>
                    <td className="py-2 pr-4 text-right">{p.amount.toLocaleString('en-US', { style: 'currency', currency: p.currency })}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={p.status === 'COMPLETED' ? 'default' : p.status === 'REFUNDED' ? 'secondary' : 'outline'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    {canRefund && (
                      <td className="py-2">
                        {p.status === 'COMPLETED' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleRefund(p.id)} disabled={refundPayment.isPending}>
                            <RefreshCw size={12} className="mr-1" />Refund
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payModalInvoice && (
        <PaymentModal open={!!payModalInvoice} onClose={() => setPayModalInvoice(null)} invoice={payModalInvoice} />
      )}
    </div>
  );
}
