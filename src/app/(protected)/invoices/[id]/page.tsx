'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { useDownloadPDF } from '@/hooks/useQuotations';
import { ArrowLeft, FileDown, CreditCard } from 'lucide-react';
import { useRouter as useNav } from 'next/navigation';

const STATUS_COLOR: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary', SENT: 'default', PARTIALLY_PAID: 'outline', PAID: 'default', OVERDUE: 'destructive', CANCELLED: 'secondary',
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: inv, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const downloadPDF = useDownloadPDF('invoices');

  const setStatus = async (status: string) => {
    try {
      await updateInvoice.mutateAsync({ id, data: { status } });
      toast({ title: `Invoice ${status.toLowerCase().replace('_', ' ')}` });
    } catch {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  if (!inv) return <div className="p-6 text-muted-foreground text-sm">Not found</div>;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: inv.currency });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={18} /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Invoice {inv.number}</h1>
            <Badge variant={STATUS_COLOR[inv.status]}>{inv.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Created {new Date(inv.createdAt).toLocaleDateString()}{inv.dueDate ? ` · Due ${new Date(inv.dueDate).toLocaleDateString()}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => { try { await downloadPDF(id, inv.number); } catch { toast({ title: 'PDF failed', variant: 'destructive' }); } }}>
            <FileDown size={14} className="mr-1" />PDF
          </Button>
          <Button size="sm" onClick={() => router.push(`/payments?invoiceId=${id}`)}>
            <CreditCard size={14} className="mr-1" />Pay
          </Button>
          {inv.status === 'DRAFT' && <Button size="sm" variant="outline" onClick={() => setStatus('SENT')}>Mark Sent</Button>}
          {inv.status === 'OVERDUE' && <Button size="sm" variant="outline" className="text-destructive" onClick={() => setStatus('CANCELLED')}>Cancel</Button>}
        </div>
      </div>

      {inv.customer && (
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">CUSTOMER</p>
          <p className="font-medium">{inv.customer.firstName} {inv.customer.lastName}</p>
          {inv.customer.email && <p className="text-sm text-muted-foreground">{inv.customer.email}</p>}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium text-right">Qty</th>
              <th className="px-4 py-2 font-medium text-right">Unit Price</th>
              <th className="px-4 py-2 font-medium text-right">Discount</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2 text-right">{item.quantity}</td>
                <td className="px-4 py-2 text-right">{fmt(item.unitPrice)}</td>
                <td className="px-4 py-2 text-right">{fmt(item.discount)}</td>
                <td className="px-4 py-2 text-right font-medium">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t bg-muted/30 p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(inv.subtotal)}</span></div>
          {inv.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>−{fmt(inv.discount)}</span></div>}
          {inv.taxAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({inv.taxRate}%)</span><span>{fmt(inv.taxAmount)}</span></div>}
          <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
            <span>Total</span><span>{fmt(inv.total)}</span>
          </div>
          {inv.amountPaid > 0 && (
            <>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>−{fmt(inv.amountPaid)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-1"><span>Amount Due</span><span>{fmt(inv.amountDue)}</span></div>
            </>
          )}
        </div>
      </div>

      {inv.payments.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm">Payment History</h2>
          {inv.payments.map((p) => (
            <div key={p.id} className="rounded-lg border px-4 py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{p.provider}</span>
                {p.last4 && <span className="text-muted-foreground ml-2">····{p.last4}</span>}
                {p.payerEmail && <span className="text-muted-foreground ml-2">{p.payerEmail}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span>{fmt(p.amount)}</span>
                <Badge variant={p.status === 'COMPLETED' ? 'default' : p.status === 'REFUNDED' ? 'secondary' : 'outline'}>{p.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
