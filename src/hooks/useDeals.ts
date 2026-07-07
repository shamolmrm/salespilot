'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/api-client';
import type { Deal, PipelineBoard, DealStage } from '@/types';
import type { CreateDealInput, UpdateDealInput } from '@/lib/validations/deal';

interface DealsResponse {
  deals: Deal[];
  total: number;
  page: number;
  pages: number;
}

export function useDeals(params?: { search?: string; stage?: string; page?: number }) {
  const { accessToken } = useAuth();
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.stage) query.set('stage', params.stage);
  if (params?.page) query.set('page', String(params.page));

  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => apiRequest<DealsResponse>(`/api/deals?${query}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function usePipeline() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ['pipeline'],
    queryFn: () => apiRequest<PipelineBoard>('/api/pipeline', accessToken!),
    enabled: !!accessToken,
  });
}

export function useMoveDeal() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: DealStage }) =>
      apiRequest<Deal>('/api/pipeline', accessToken!, {
        method: 'PATCH',
        body: JSON.stringify({ dealId, stage }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useCreateDeal() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealInput) =>
      apiRequest<Deal>('/api/deals', accessToken!, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useUpdateDeal() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealInput }) =>
      apiRequest<Deal>(`/api/deals/${id}`, accessToken!, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useDeleteDeal() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/deals/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}
