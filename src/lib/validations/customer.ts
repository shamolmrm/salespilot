import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().max(30).or(z.literal('')).optional(),
  notes: z.string().max(2000).or(z.literal('')).optional(),
  companyId: z.string().or(z.literal('')).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
