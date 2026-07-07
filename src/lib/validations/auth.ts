import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
