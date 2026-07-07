import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface EmailAccount {
  id: string;
  name: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  imapHost: string | null;
  imapPort: number | null;
  imapSecure: boolean;
  imapUser: string | null;
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  body: string;
  bodyType: 'TEXT' | 'HTML';
  isRead: boolean;
  receivedAt: string | null;
}

export interface InboxResponse {
  emails: EmailMessage[];
  total: number;
  page: number;
  pages: number;
}

export function useEmailAccounts() {
  const { accessToken } = useAuth();
  return useQuery<EmailAccount[]>({
    queryKey: ['email-accounts'],
    queryFn: () => apiRequest('/api/email/accounts', accessToken!),
    enabled: !!accessToken,
  });
}

export function useInbox(accountId?: string, page = 1) {
  const { accessToken } = useAuth();
  const params = new URLSearchParams({ page: String(page) });
  if (accountId) params.set('accountId', accountId);
  return useQuery<InboxResponse>({
    queryKey: ['email-inbox', accountId, page],
    queryFn: () => apiRequest(`/api/email/inbox?${params}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useAddEmailAccount() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<EmailAccount & { smtpPassword: string; imapPassword?: string }, Error, unknown>({
    mutationFn: (data) =>
      apiRequest('/api/email/accounts', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-accounts'] }),
  });
}

export function useDeleteEmailAccount() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (id) =>
      apiRequest(`/api/email/accounts/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-accounts'] }),
  });
}

export function useSendEmail() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<unknown, Error, unknown>({
    mutationFn: (data) =>
      apiRequest('/api/email/send', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox'] }),
  });
}

export function useSyncInbox() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<{ synced: number; total: number }, Error, unknown>({
    mutationFn: (data) =>
      apiRequest('/api/email/sync', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox'] }),
  });
}

export function useMarkRead() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => apiRequest(`/api/email/${id}/read`, accessToken!, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox'] }),
  });
}

export function useAiEmailReply() {
  const { accessToken } = useAuth();
  return useMutation<{ reply: string; subject: string; to: string }, Error, { emailId: string; instruction?: string }>({
    mutationFn: (data) =>
      apiRequest('/api/email/ai-reply', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
  });
}
