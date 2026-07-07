'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/useLeads';
import { LeadTable } from '@/components/leads/LeadTable';
import { LeadForm } from '@/components/leads/LeadForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { Lead } from '@/types';
import type { CreateLeadInput } from '@/lib/validations/lead';

export default function LeadsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | undefined>();

  const { data, isLoading } = useLeads({ search });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  async function handleSubmit(data: CreateLeadInput) {
    if (editing) {
      await updateLead.mutateAsync({ id: editing.id, data });
      toast({ title: 'Lead updated' });
    } else {
      await createLead.mutateAsync(data);
      toast({ title: 'Lead created' });
    }
    setEditing(null);
  }

  function handleEdit(lead: Lead) {
    setEditing(lead);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead?')) return;
    setDeletingId(id);
    try {
      await deleteLead.mutateAsync(id);
      toast({ title: 'Lead deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search leads…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <LeadTable
          leads={data?.leads ?? []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>

      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total} lead{data.total !== 1 ? 's' : ''} total
        </p>
      )}

      <LeadForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
