'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal } from '@/hooks/useDeals';
import { DealTable } from '@/components/deals/DealTable';
import { DealForm } from '@/components/deals/DealForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { Deal } from '@/types';
import type { CreateDealInput } from '@/lib/validations/deal';

export default function DealsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deletingId, setDeletingId] = useState<string | undefined>();

  const { data, isLoading } = useDeals({ search });
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  async function handleSubmit(data: CreateDealInput) {
    if (editing) {
      await updateDeal.mutateAsync({ id: editing.id, data });
      toast({ title: 'Deal updated' });
    } else {
      await createDeal.mutateAsync(data);
      toast({ title: 'Deal created' });
    }
    setEditing(null);
  }

  function handleEdit(deal: Deal) {
    setEditing(deal);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this deal?')) return;
    setDeletingId(id);
    try {
      await deleteDeal.mutateAsync(id);
      toast({ title: 'Deal deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deals</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search deals…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <DealTable
          deals={data?.deals ?? []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>

      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total} deal{data.total !== 1 ? 's' : ''} total
        </p>
      )}

      <DealForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
