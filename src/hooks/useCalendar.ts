import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export type EventType = 'MEETING' | 'TASK' | 'REMINDER' | 'CALL' | 'DEMO';
export type EventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: EventType;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  attendees: string | null;
  reminderAt: string | null;
  status: EventStatus;
  relatedId: string | null;
  relatedType: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCalendarEvents(from?: string, to?: string) {
  const { accessToken } = useAuth();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', from, to],
    queryFn: () => apiRequest(`/api/calendar/events${qs ? `?${qs}` : ''}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useCreateEvent() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<CalendarEvent, Error, unknown>({
    mutationFn: (data) =>
      apiRequest('/api/calendar/events', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

export function useUpdateEvent() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<CalendarEvent, Error, { id: string; data: unknown }>({
    mutationFn: ({ id, data }) =>
      apiRequest(`/api/calendar/events/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

export function useDeleteEvent() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiRequest(`/api/calendar/events/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}
