'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { QuotationForm } from '@/components/quotations/QuotationForm';
import { useQuotations, useCreateQuotation, useUpdateQuotation, useDeleteQuotation, useDownloadPDF, type Quotation } from '@/hooks/useQuotations';
import { Plus, FileText } from 'lucide-react';

export default function QuotationsPage() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | undefined>();
  const { toast } = useToast();

  const { data: quotations = [], isLoading } = useQuotations();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const downloadPDF = useDownloadPDF('quotations');

  const openCreate = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (q: Quotation) => { setEditing(q); setFormOpen(true); };

  const handleSubmit = async (data: unknown) => {
    try {
      if (editing) {
        await updateQuotation.mutateAsync({ id: editing.id, data });
        toast({ title: 'Quotation updated' });
      } else {
        await createQuotation.mutateAsync(data);
        toast({ title: 'Quotation created' });
      }
      setFormOpen(false);
    } catch {
      toast({ title: 'Error saving quotation', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuotation.mutateAsync(id);
      toast({ title: 'Quotation deleted' });
    } catch {
      toast({ title: 'Error deleting quotation', variant: 'destructive' });
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
          <FileText size={22} />
          <h1 className="text-xl font-semibold">Quotations</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" />
          New Quotation
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : (
        <QuotationTable
          quotations={quotations}
          onEdit={openEdit}
          onDelete={handleDelete}
          onDownloadPDF={handleDownloadPDF}
          onView={(id) => router.push(`/quotations/${id}`)}
        />
      )}

      <QuotationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
