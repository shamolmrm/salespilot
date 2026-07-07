'use client';

import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, fullName } from '@/lib/utils';
import type { Customer } from '@/types';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  deletingId?: string;
}

export function CustomerTable({ customers, isLoading, onEdit, onDelete, deletingId }: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No customers found. Add your first customer to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">
              {fullName(customer.firstName, customer.lastName)}
            </TableCell>
            <TableCell className="text-muted-foreground">{customer.email ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{customer.phone ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{customer.company?.name ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(customer.id)}
                  disabled={deletingId === customer.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === customer.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
