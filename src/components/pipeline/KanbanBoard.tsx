'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { DEAL_STAGES, STAGE_LABELS } from '@/types';
import type { Deal, DealStage, PipelineBoard } from '@/types';

interface KanbanBoardProps {
  board: PipelineBoard;
  onMove: (dealId: string, stage: DealStage) => void;
}

function findDeal(board: PipelineBoard, id: string): Deal | undefined {
  for (const deals of Object.values(board)) {
    const found = deals.find((d) => d.id === id);
    if (found) return found;
  }
}

export function KanbanBoard({ board, onMove }: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveDeal(findDeal(board, String(event.active.id)) ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const targetStage = String(over.id) as DealStage;
    if (!DEAL_STAGES.includes(targetStage)) return;

    const currentDeal = findDeal(board, String(active.id));
    if (!currentDeal || currentDeal.stage === targetStage) return;

    onMove(String(active.id), targetStage);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full items-start">
        {DEAL_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={STAGE_LABELS[stage]}
            deals={board[stage] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <KanbanCard deal={activeDeal} />}
      </DragOverlay>
    </DndContext>
  );
}
