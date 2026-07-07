import { z } from 'zod';

// Prevent email header injection in SMTP fields
function safeEmailField(label: string) {
  return z
    .string()
    .max(254)
    .regex(/^[^\r\n]+$/, `${label} must not contain line breaks`);
}

function safeSubject() {
  return z
    .string()
    .min(1, 'Subject is required')
    .max(998)
    .regex(/^[^\r\n]+$/, 'Subject must not contain line breaks');
}

export const CreateEmailAccountSchema = z.object({
  name: z.string().min(1).max(60),
  fromEmail: safeEmailField('From email').email('Invalid email'),
  smtpHost: z.string().min(1).max(253),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().min(1).max(254),
  smtpPassword: z.string().min(1),
  imapHost: z.string().max(253).optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().default(false),
  imapUser: z.string().max(254).optional(),
  imapPassword: z.string().optional(),
});

export const SendEmailSchema = z.object({
  accountId: z.string().cuid(),
  to: safeEmailField('To').email('Invalid recipient email'),
  subject: safeSubject(),
  body: z.string().min(1).max(100_000),
  bodyType: z.enum(['TEXT', 'HTML']).default('TEXT'),
});

export const AiReplySchema = z.object({
  emailId: z.string().cuid(),
  instruction: z.string().max(500).optional(),
});

export type CreateEmailAccountInput = z.infer<typeof CreateEmailAccountSchema>;
export type SendEmailInput = z.infer<typeof SendEmailSchema>;
