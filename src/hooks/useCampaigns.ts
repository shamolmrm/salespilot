import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface Campaign {
  id: string; name: string; type: string; status: string; subject: string | null; body: string | null;
  targetCount: number; sentCount: number; openCount: number; clickCount: number;
  scheduledAt: string | null; sentAt: string | null; createdAt: string;
  createdBy: { id: string; name: string };
  _count: { recipients: number };
}
export interface CampaignRecipient { id: string; email: string; name: string | null; status: string; openedAt: string | null; clickedAt: string | null }

export function useCampaigns() {
  const { accessToken } = useAuth();
  return useQuery<Campaign[]>({ queryKey: ['campaigns'], queryFn: () => apiRequest('/api/campaigns', accessToken!), enabled: !!accessToken });
}
export function useCampaign(id: string) {
  const { accessToken } = useAuth();
  return useQuery<Campaign & { recipients: CampaignRecipient[] }>({ queryKey: ['campaigns', id], queryFn: () => apiRequest(`/api/campaigns/${id}`, accessToken!), enabled: !!accessToken && !!id });
}
export function useCreateCampaign() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Campaign, Error, unknown>({ mutationFn: (d) => apiRequest('/api/campaigns', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }) });
}
export function useDeleteCampaign() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/campaigns/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }) });
}
export function useSendCampaign() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Campaign, Error, string>({ mutationFn: (id) => apiRequest(`/api/campaigns/${id}/send`, accessToken!, { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }) });
}
