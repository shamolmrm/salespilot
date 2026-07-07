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
import { formatCurrency, formatDate, fullName } from '@/lib/utils';
import { STAGE_LABELS } from '@/types';
import type { Deal } from '@/types';

const PRIORITY_VARIANT: Record<string, 'destructive' | 'warning' | 'secondary' | 'outline'> = {
  HIGH: 'destructive',
  MEDIUM: 'warning',
  LOW: 'secondary',
};

interface DealTableProps {
  deals: Deal[];
  isLoading: boolean;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  deletingId?: string;
}

export function DealTable({ deals, isLoading, onEdit, onDelete, deletingId }: DealTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No deals found. Create your first deal to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Close Date</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => (
          <TableRow key={deal.id}>
            <TableCell className="font-medium">{deal.title}</TableCell>
            <TableCell className="font-medium text-primary">{formatCurrency(deal.value)}</TableCell>
            <TableCell>
              <Badge variant="outline">{STAGE_LABELS[deal.stage]}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={PRIORITY_VARIANT[deal.priority] ?? 'outline'}>
                {deal.priority}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {deal.customer
                ? fullName(deal.customer.firstName, deal.customer.lastName)
                : '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(deal.expectedCloseDate)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(deal)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(deal.id)}
                  disabled={deletingId === deal.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === deal.id ? (
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
