import { z } from 'zod';

export const ChatMessageSchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z.string().min(1, 'Message is required').max(4000),
  templateId: z.string().optional(),
  newTitle: z.string().max(120).optional(),
});

export const CreateConversationSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  templateId: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
