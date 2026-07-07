import { z } from 'zod';

export const CreateDealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  value: z.coerce.number().min(0, 'Value must be 0 or greater'),
  stage: z
    .enum([
      'PROSPECTING',
      'QUALIFICATION',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
    ])
    .default('PROSPECTING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  expectedCloseDate: z.string().datetime().or(z.literal('')).optional(),
  notes: z.string().max(2000).or(z.literal('')).optional(),
  customerId: z.string().or(z.literal('')).optional(),
});

export const UpdateDealSchema = CreateDealSchema.partial();

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
