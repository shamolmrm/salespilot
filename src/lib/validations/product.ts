import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Required').max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  price: z.number().min(0, 'Price must be >= 0'),
  currency: z.string().length(3).default('USD'),
  stockCount: z.number().int().min(0).default(0),
  unit: z.string().max(50).default('item'),
  imageUrl: z.string().url().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  categoryId: z.string().cuid().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  description: z.string().max(500).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
