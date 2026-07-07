'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, FileDown, Receipt } from 'lucide-react';
import type { Invoice } from '@/hooks/useInvoices';

const STATUS_COLOR: Record<Invoice['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SENT: 'default',
  PARTIALLY_PAID: 'outline',
  PAID: 'default',
  OVERDUE: 'destructive',
  CANCELLED: 'secondary',
};

interface Props {
  invoices: Invoice[];
  onEdit: (inv: Invoice) => void;
  onDelete: (id: string) => void;
  onDownloadPDF: (id: string, number: string) => void;
  onView: (id: string) => void;
}

export function InvoiceTable({ invoices, onEdit, onDelete, onDownloadPDF, onView }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmId === id) { onDelete(id); setConfirmId(null); }
    else { setConfirmId(id); setTimeout(() => setConfirmId(null), 3000); }
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Receipt size={40} className="mb-3 opacity-30" />
        <p>No invoices yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Number</th>
            <th className="pb-2 pr-4 font-medium">Customer</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium text-right">Total</th>
            <th className="pb-2 pr-4 font-medium text-right">Due</th>
            <th className="pb-2 pr-4 font-medium">Due Date</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 pr-4 font-medium">
                <button className="text-primary hover:underline" onClick={() => onView(inv.id)}>{inv.number}</button>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : '—'}
              </td>
              <td className="py-2 pr-4">
                <Badge variant={STATUS_COLOR[inv.status]}>{inv.status.replace('_', ' ')}</Badge>
              </td>
              <td className="py-2 pr-4 text-right font-medium">
                {inv.total.toLocaleString('en-US', { style: 'currency', currency: inv.currency })}
              </td>
              <td className="py-2 pr-4 text-right text-muted-foreground">
                {inv.amountDue > 0 ? inv.amountDue.toLocaleString('en-US', { style: 'currency', currency: inv.currency }) : '—'}
              </td>
              <td className="py-2 pr-4 text-muted-foreground text-xs">
                {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
              </td>
              <td className="py-2">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" onClick={() => onDownloadPDF(inv.id, inv.number)}>
                    <FileDown size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => onEdit(inv)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={`h-7 w-7 ${confirmId === inv.id ? 'text-destructive' : ''}`}
                    title={confirmId === inv.id ? 'Click again to confirm' : 'Delete'}
                    onClick={() => handleDelete(inv.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
