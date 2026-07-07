'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, type Invoice } from '@/hooks/useInvoices';
import { useDownloadPDF } from '@/hooks/useQuotations';
import { Plus, Receipt } from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | undefined>();
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useInvoices();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const downloadPDF = useDownloadPDF('invoices');

  const openCreate = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (inv: Invoice) => { setEditing(inv); setFormOpen(true); };

  const handleSubmit = async (data: unknown) => {
    try {
      if (editing) {
        await updateInvoice.mutateAsync({ id: editing.id, data });
        toast({ title: 'Invoice updated' });
      } else {
        await createInvoice.mutateAsync(data);
        toast({ title: 'Invoice created' });
      }
      setFormOpen(false);
    } catch {
      toast({ title: 'Error saving invoice', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice.mutateAsync(id);
      toast({ title: 'Invoice deleted' });
    } catch {
      toast({ title: 'Error deleting invoice', variant: 'destructive' });
    }
  };

  const handleDownloadPDF = async (id: string, number: string) => {
    try {
      await downloadPDF(id, number);
    } catch {
      toast({ title: 'PDF generation failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={22} />
          <h1 className="text-xl font-semibold">Invoices</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" />
          New Invoice
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : (
        <InvoiceTable
          invoices={invoices}
          onEdit={openEdit}
          onDelete={handleDelete}
          onDownloadPDF={handleDownloadPDF}
          onView={(id) => router.push(`/invoices/${id}`)}
        />
      )}

      <InvoiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
