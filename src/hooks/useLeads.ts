'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/api-client';
import type { Lead } from '@/types';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validations/lead';

interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pages: number;
}

export function useLeads(params?: { search?: string; status?: string; page?: number }) {
  const { accessToken } = useAuth();
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));

  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => apiRequest<LeadsResponse>(`/api/leads?${query}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useCreateLead() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadInput) =>
      apiRequest<Lead>('/api/leads', accessToken!, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      apiRequest<Lead>(`/api/leads/${id}`, accessToken!, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/leads/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
