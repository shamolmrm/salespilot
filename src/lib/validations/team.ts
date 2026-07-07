import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  managerId: z.string().cuid().optional(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

export const CreateEmployeeSchema = z.object({
  userId: z.string().cuid(),
  departmentId: z.string().cuid().optional(),
  title: z.string().min(1).max(100),
  employeeId: z.string().max(50).optional(),
  startDate: z.string().datetime().optional().or(z.literal('')),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.omit({ userId: true }).partial();
