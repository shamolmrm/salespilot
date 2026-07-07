import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminUser { id: string; name: string; email: string; role: string; createdAt: string; _count: { activityLogs: number } }
export interface SystemStats { users: number; customers: number; contacts: number; invoices: number; payments: number; campaigns: number; documents: number; tasks: number }

export function useAdminUsers(search?: string) {
  const { accessToken } = useAuth();
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return useQuery<AdminUser[]>({ queryKey: ['admin-users', search], queryFn: () => apiRequest(`/api/admin/users${qs}`, accessToken!), enabled: !!accessToken });
}
export function useSystemStats() {
  const { accessToken } = useAuth();
  return useQuery<SystemStats>({ queryKey: ['system-stats'], queryFn: () => apiRequest('/api/admin/stats', accessToken!), enabled: !!accessToken });
}
export function useChangeRole() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id: string; role: string }>({
    mutationFn: ({ id, role }) => apiRequest(`/api/admin/users/${id}/role`, accessToken!, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['activity-logs'] }); },
  });
}
export function useDeleteUser() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/admin/users/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) });
}
export function useDownloadBackup() {
  const { accessToken } = useAuth();
  return () => {
    const a = document.createElement('a');
    a.href = '/api/admin/backup';
    // Add token as param workaround for download links (GET request)
    fetch('/api/admin/backup', { headers: { authorization: `Bearer ${accessToken}` } })
      .then((r) => r.blob())
      .then((blob) => { a.href = URL.createObjectURL(blob); a.download = `salespilot-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); });
  };
}
