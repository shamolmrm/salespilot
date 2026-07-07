'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent, EventType } from '@/hooks/useCalendar';

const TYPE_COLORS: Record<EventType, string> = {
  MEETING: 'bg-blue-500',
  TASK: 'bg-amber-500',
  REMINDER: 'bg-purple-500',
  CALL: 'bg-green-500',
  DEMO: 'bg-rose-500',
};

interface Props {
  events: CalendarEvent[];
  onNew: (date: Date) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export function CalendarView({ events, onNew, onEdit, onDelete, onComplete }: Props) {
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = useMemo(() => {
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [firstDay, daysInMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.startAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = String(d.getDate());
        (map[key] ??= []).push(ev);
      }
    }
    return map;
  }, [events, year, month]);

  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const monthName = current.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())}>Today</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" className="ml-2 gap-1" onClick={() => onNew(new Date(year, month, today.getDate()))}>
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 divide-x divide-y border-b">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                'min-h-[100px] p-1',
                day === null ? 'bg-muted/20' : 'cursor-pointer hover:bg-accent/20',
              )}
              onClick={() => day !== null && onNew(new Date(year, month, day))}
            >
              {day !== null && (
                <>
                  <div className={cn(
                    'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                    isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground',
                  )}>
                    {day}
                  </div>
                  <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                    {(eventsByDay[String(day)] ?? []).slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn(
                          'group flex items-center gap-1 rounded px-1 py-0.5 text-xs text-white',
                          TYPE_COLORS[ev.type],
                          ev.status === 'CANCELLED' && 'opacity-40 line-through',
                          ev.status === 'COMPLETED' && 'opacity-60',
                        )}
                      >
                        <span className="flex-1 truncate">{ev.title}</span>
                        <button onClick={() => onComplete(ev.id)} className="hidden group-hover:block">
                          <CheckCircle2 className="h-3 w-3" />
                        </button>
                        <button onClick={() => onEdit(ev)} className="hidden group-hover:block">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => onDelete(ev.id)} className="hidden group-hover:block">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {(eventsByDay[String(day)]?.length ?? 0) > 3 && (
                      <p className="text-xs text-muted-foreground px-1">
                        +{(eventsByDay[String(day)]?.length ?? 0) - 3} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t px-4 py-2">
        {(Object.entries(TYPE_COLORS) as [EventType, string][]).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', color)} />
            <span className="text-xs text-muted-foreground capitalize">{type.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
