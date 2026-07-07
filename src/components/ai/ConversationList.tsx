'use client';

import { Trash2, MessageSquare, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ConversationSummary } from '@/hooks/useAI';

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button onClick={onNew} className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">No conversations yet</p>
        )}
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id}>
              <div
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                  activeId === c.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-muted-foreground',
                )}
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate text-xs">{c.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="invisible ml-auto shrink-0 group-hover:visible"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
