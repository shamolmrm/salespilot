'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, FileDown, Send, FileText } from 'lucide-react';
import type { Quotation } from '@/hooks/useQuotations';

const STATUS_COLOR: Record<Quotation['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SENT: 'default',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'outline',
};

interface Props {
  quotations: Quotation[];
  onEdit: (q: Quotation) => void;
  onDelete: (id: string) => void;
  onDownloadPDF: (id: string, number: string) => void;
  onView: (id: string) => void;
}

export function QuotationTable({ quotations, onEdit, onDelete, onDownloadPDF, onView }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmId === id) { onDelete(id); setConfirmId(null); }
    else { setConfirmId(id); setTimeout(() => setConfirmId(null), 3000); }
  };

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText size={40} className="mb-3 opacity-30" />
        <p>No quotations yet</p>
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
            <th className="pb-2 pr-4 font-medium">Valid Until</th>
            <th className="pb-2 pr-4 font-medium">Created</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {quotations.map((q) => (
            <tr key={q.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 pr-4 font-medium">
                <button className="text-primary hover:underline" onClick={() => onView(q.id)}>{q.number}</button>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : '—'}
              </td>
              <td className="py-2 pr-4">
                <Badge variant={STATUS_COLOR[q.status]}>{q.status}</Badge>
              </td>
              <td className="py-2 pr-4 text-right font-medium">
                {q.total.toLocaleString('en-US', { style: 'currency', currency: q.currency })}
              </td>
              <td className="py-2 pr-4 text-muted-foreground text-xs">
                {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
              </td>
              <td className="py-2 pr-4 text-muted-foreground text-xs">
                {new Date(q.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" onClick={() => onDownloadPDF(q.id, q.number)}>
                    <FileDown size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => onEdit(q)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={`h-7 w-7 ${confirmId === q.id ? 'text-destructive' : ''}`}
                    title={confirmId === q.id ? 'Click again to confirm' : 'Delete'}
                    onClick={() => handleDelete(q.id)}
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
