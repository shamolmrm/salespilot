import { z } from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['MEETING', 'TASK', 'REMINDER', 'CALL', 'DEMO']).default('MEETING'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  allDay: z.boolean().default(false),
  location: z.string().max(300).optional(),
  attendees: z.string().optional(),
  reminderAt: z.string().datetime().optional(),
  relatedId: z.string().optional(),
  relatedType: z.enum(['Lead', 'Customer', 'Deal']).optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
