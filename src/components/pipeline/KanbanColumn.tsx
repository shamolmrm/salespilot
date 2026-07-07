'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import { formatCurrency } from '@/lib/utils';
import type { Deal, DealStage } from '@/types';

const STAGE_COLORS: Record<DealStage, string> = {
  PROSPECTING: 'border-t-slate-400',
  QUALIFICATION: 'border-t-blue-400',
  PROPOSAL: 'border-t-purple-400',
  NEGOTIATION: 'border-t-orange-400',
  CLOSED_WON: 'border-t-green-500',
  CLOSED_LOST: 'border-t-red-500',
};

interface KanbanColumnProps {
  stage: DealStage;
  label: string;
  deals: Deal[];
}

export function KanbanColumn({ stage, label, deals }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={cn('flex flex-col min-w-[260px] max-w-[260px] shrink-0 rounded-lg border-t-4', STAGE_COLORS[stage])}>
      {/* Column header */}
      <div className="px-3 py-2.5 bg-muted/50 rounded-tl-sm rounded-tr-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium">
            {deals.length}
          </span>
        </div>
        {deals.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(totalValue)}</p>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] space-y-2 p-2 rounded-bl-lg rounded-br-lg transition-colors',
          isOver ? 'bg-primary/5' : 'bg-background',
        )}
      >
        {deals.map((deal) => (
          <KanbanCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}
