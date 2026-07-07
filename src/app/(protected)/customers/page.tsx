'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { Customer } from '@/types';
import type { CreateCustomerInput } from '@/lib/validations/customer';

export default function CustomersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | undefined>();

  const { data, isLoading } = useCustomers({ search });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  async function handleSubmit(data: CreateCustomerInput) {
    if (editing) {
      await updateCustomer.mutateAsync({ id: editing.id, data });
      toast({ title: 'Customer updated' });
    } else {
      await createCustomer.mutateAsync(data);
      toast({ title: 'Customer created' });
    }
    setEditing(null);
  }

  function handleEdit(customer: Customer) {
    setEditing(customer);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer?')) return;
    setDeletingId(id);
    try {
      await deleteCustomer.mutateAsync(id);
      toast({ title: 'Customer deleted' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <CustomerTable
          customers={data?.customers ?? []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>

      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total} customer{data.total !== 1 ? 's' : ''} total
        </p>
      )}

      <CustomerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
