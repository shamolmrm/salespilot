import { z } from 'zod';

const LineItemSchema = z.object({
  productId: z.string().cuid().optional(),
  description: z.string().min(1, 'Required').max(500),
  quantity: z.coerce.number().min(0.001),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

export const CreateInvoiceSchema = z.object({
  customerId: z.string().cuid().optional(),
  quotationId: z.string().cuid().optional(),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.coerce.number().positive().default(1),
  discountType: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional().or(z.literal('')),
  items: z.array(LineItemSchema).min(1, 'At least one item required'),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
});
