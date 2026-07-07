'use client';

import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import type { Lead } from '@/types';

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'destructive' | 'default' | 'outline' | 'secondary'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  QUALIFIED: 'success',
  UNQUALIFIED: 'destructive',
  CONVERTED: 'default',
};

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  deletingId?: string;
}

export function LeadTable({ leads, isLoading, onEdit, onDelete, deletingId }: LeadTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No leads found. Create your first lead to get started.
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
          <TableHead>Status</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">
              {fullName(lead.firstName, lead.lastName)}
            </TableCell>
            <TableCell className="text-muted-foreground">{lead.email ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">{lead.phone ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[lead.status] ?? 'outline'}>
                {lead.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground capitalize">
              {lead.source.replace('_', ' ').toLowerCase()}
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(lead)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(lead.id)}
                  disabled={deletingId === lead.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === lead.id ? (
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
