'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useQuotation, useUpdateQuotation, useDownloadPDF } from '@/hooks/useQuotations';
import { ArrowLeft, FileDown, CheckCircle, XCircle, Send } from 'lucide-react';

const STATUS_COLOR: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary', SENT: 'default', ACCEPTED: 'default', REJECTED: 'destructive', EXPIRED: 'outline',
};

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: q, isLoading } = useQuotation(id);
  const updateQuotation = useUpdateQuotation();
  const downloadPDF = useDownloadPDF('quotations');

  const setStatus = async (status: string) => {
    try {
      await updateQuotation.mutateAsync({ id, data: { status } });
      toast({ title: `Quotation ${status.toLowerCase()}` });
    } catch {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handleDownload = async () => {
    try {
      if (q) await downloadPDF(id, q.number);
    } catch {
      toast({ title: 'PDF failed', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  if (!q) return <div className="p-6 text-muted-foreground text-sm">Not found</div>;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: q.currency });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={18} /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Quotation {q.number}</h1>
            <Badge variant={STATUS_COLOR[q.status]}>{q.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Created {new Date(q.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}><FileDown size={14} className="mr-1" />PDF</Button>
          {q.status === 'DRAFT' && <Button size="sm" variant="outline" onClick={() => setStatus('SENT')}><Send size={14} className="mr-1" />Mark Sent</Button>}
          {q.status === 'SENT' && (
            <>
              <Button size="sm" variant="outline" className="text-green-600" onClick={() => setStatus('ACCEPTED')}><CheckCircle size={14} className="mr-1" />Accept</Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setStatus('REJECTED')}><XCircle size={14} className="mr-1" />Reject</Button>
            </>
          )}
        </div>
      </div>

      {q.customer && (
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">CUSTOMER</p>
          <p className="font-medium">{q.customer.firstName} {q.customer.lastName}</p>
          {q.customer.email && <p className="text-sm text-muted-foreground">{q.customer.email}</p>}
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
            {q.items.map((item) => (
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
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(q.subtotal)}</span></div>
          {q.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount{q.discountType === 'PERCENTAGE' ? ` (${q.taxRate}%)` : ''}</span><span>−{fmt(q.discount)}</span></div>}
          {q.taxAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({q.taxRate}%)</span><span>{fmt(q.taxAmount)}</span></div>}
          <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
            <span>Total</span><span>{fmt(q.total)}</span>
          </div>
        </div>
      </div>

      {(q.notes || q.terms) && (
        <div className="grid grid-cols-2 gap-4">
          {q.notes && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground font-medium mb-1">NOTES</p><p className="text-sm">{q.notes}</p></div>}
          {q.terms && <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground font-medium mb-1">TERMS</p><p className="text-sm">{q.terms}</p></div>}
        </div>
      )}
    </div>
  );
}
