'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/api-client';
import type { Customer } from '@/types';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/lib/validations/customer';

interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  pages: number;
}

export function useCustomers(params?: { search?: string; page?: number }) {
  const { accessToken } = useAuth();
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));

  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => apiRequest<CustomersResponse>(`/api/customers?${query}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useCreateCustomer() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) =>
      apiRequest<Customer>('/api/customers', accessToken!, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      apiRequest<Customer>(`/api/customers/${id}`, accessToken!, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useDeleteCustomer() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/customers/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
