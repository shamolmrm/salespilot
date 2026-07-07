'use client';

import { usePipeline, useMoveDeal } from '@/hooks/useDeals';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import type { DealStage } from '@/types';

export default function PipelinePage() {
  const { toast } = useToast();
  const { data, isLoading } = usePipeline();
  const moveDeal = useMoveDeal();

  async function handleMove(dealId: string, stage: DealStage) {
    try {
      await moveDeal.mutateAsync({ dealId, stage });
    } catch {
      toast({ title: 'Failed to move deal', variant: 'destructive' });
    }
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-[260px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <h1 className="text-2xl font-bold shrink-0">Pipeline</h1>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard board={data} onMove={handleMove} />
      </div>
    </div>
  );
}
