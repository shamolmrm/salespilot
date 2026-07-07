'use client';

import { Mail, FileText, RefreshCw, Send, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TemplateItem } from '@/hooks/useAI';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  FileText,
  RefreshCw,
  Send,
  Mic,
};

interface Props {
  templates: TemplateItem[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function TemplateSelector({ templates, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => {
        const Icon = ICON_MAP[t.icon] ?? Mail;
        const active = selected === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(active ? null : t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-3 w-3" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
