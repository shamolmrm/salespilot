import { z } from 'zod';

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().max(30).or(z.literal('')).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']).default('NEW'),
  source: z
    .enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EMAIL', 'SOCIAL_MEDIA', 'EVENT', 'OTHER'])
    .default('OTHER'),
  notes: z.string().max(2000).or(z.literal('')).optional(),
  companyId: z.string().or(z.literal('')).optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
