'use client';

import { useState, useMemo } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { EventForm } from '@/components/calendar/EventForm';
import {
  useCalendarEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  type CalendarEvent,
} from '@/hooks/useCalendar';
import { useToast } from '@/components/ui/use-toast';

export default function CalendarPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date>(new Date());

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

  const { data: events = [] } = useCalendarEvents(from, to);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const handleNew = (date: Date) => {
    setEditing(null);
    setDefaultStart(date);
    setFormOpen(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditing(event);
    setFormOpen(true);
  };

  const handleSubmit = async (data: unknown) => {
    try {
      if (editing) {
        await updateEvent.mutateAsync({ id: editing.id, data });
        toast({ title: 'Event updated' });
      } else {
        await createEvent.mutateAsync(data);
        toast({ title: 'Event created' });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast({ title: 'Event deleted' });
    } catch {
      toast({ title: 'Error', description: 'Could not delete', variant: 'destructive' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateEvent.mutateAsync({ id, data: { status: 'COMPLETED' } });
      toast({ title: 'Marked complete' });
    } catch {
      toast({ title: 'Error', description: 'Could not update', variant: 'destructive' });
    }
  };

  const defaultStartIso = useMemo(() => {
    const d = new Date(defaultStart);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }, [defaultStart]);

  return (
    <div className="-m-6 h-[calc(100vh-4rem)] overflow-hidden">
      <CalendarView
        events={events}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />
      <EventForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing ?? undefined}
        key={editing?.id ?? 'new'}
      />
    </div>
  );
}
