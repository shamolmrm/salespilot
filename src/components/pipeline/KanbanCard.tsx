'use client';

import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, fullName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types';

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'text-red-500',
  MEDIUM: 'text-yellow-500',
  LOW: 'text-green-500',
};

interface KanbanCardProps {
  deal: Deal;
}

export function KanbanCard({ deal }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn('touch-none', isDragging && 'opacity-50')}>
      <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...listeners} {...attributes} className="mt-0.5 shrink-0 text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{deal.title}</p>
              {deal.customer && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {fullName(deal.customer.firstName, deal.customer.lastName)}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(deal.value)}
                </span>
                <span className={cn('text-xs font-medium', PRIORITY_COLOR[deal.priority])}>
                  {deal.priority}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
