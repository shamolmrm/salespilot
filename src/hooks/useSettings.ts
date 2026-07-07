import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export interface CompanySettings { id: string; name: string; email: string; phone: string | null; address: string | null; timezone: string; language: string; currency: string }
export interface ApiKeyRecord { id: string; name: string; service: string; maskedKey: string; lastUsedAt: string | null; createdAt: string; createdBy: { id: string; name: string } }

export function useCompanySettings() {
  const { accessToken } = useAuth();
  return useQuery<CompanySettings>({ queryKey: ['company-settings'], queryFn: () => apiRequest('/api/settings/company', accessToken!), enabled: !!accessToken });
}
export function useUpdateCompanySettings() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<CompanySettings, Error, unknown>({ mutationFn: (d) => apiRequest('/api/settings/company', accessToken!, { method: 'PATCH', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['company-settings'] }) });
}
export function useApiKeys() {
  const { accessToken } = useAuth();
  return useQuery<ApiKeyRecord[]>({ queryKey: ['api-keys'], queryFn: () => apiRequest('/api/settings/api-keys', accessToken!), enabled: !!accessToken });
}
export function useCreateApiKey() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<ApiKeyRecord, Error, { name: string; service: string; key: string }>({
    mutationFn: (d) => apiRequest('/api/settings/api-keys', accessToken!, { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}
export function useDeleteApiKey() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/settings/api-keys/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }) });
}
export function useRevealApiKey() {
  const { accessToken } = useAuth();
  return useMutation<{ key: string }, Error, { id: string; password: string }>({
    mutationFn: ({ id, password }) => apiRequest(`/api/settings/api-keys/${id}`, accessToken!, { method: 'POST', body: JSON.stringify({ password }) }),
  });
}
