import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface Department {
  id: string; name: string; description: string | null; managerId: string | null;
  manager: { id: string; name: string; email: string } | null;
  _count: { employees: number };
}
export interface Employee {
  id: string; userId: string; departmentId: string | null; title: string;
  employeeId: string | null; startDate: string | null;
  user: { id: string; name: string; email: string; role: string };
  department: { id: string; name: string } | null;
}
export interface ActivityLog {
  id: string; userId: string; action: string; entityType: string | null;
  entityId: string | null; metadata: unknown; createdAt: string;
  user: { id: string; name: string; email: string };
}

export function useDepartments() {
  const { accessToken } = useAuth();
  return useQuery<Department[]>({ queryKey: ['departments'], queryFn: () => apiRequest('/api/departments', accessToken!), enabled: !!accessToken });
}
export function useEmployees(departmentId?: string) {
  const { accessToken } = useAuth();
  const qs = departmentId ? `?departmentId=${departmentId}` : '';
  return useQuery<Employee[]>({ queryKey: ['employees', departmentId], queryFn: () => apiRequest(`/api/employees${qs}`, accessToken!), enabled: !!accessToken });
}
export function useActivityLogs(filters?: { userId?: string; action?: string; entityType?: string }) {
  const { accessToken } = useAuth();
  const qs = new URLSearchParams();
  if (filters?.userId) qs.set('userId', filters.userId);
  if (filters?.action) qs.set('action', filters.action);
  if (filters?.entityType) qs.set('entityType', filters.entityType);
  return useQuery<ActivityLog[]>({ queryKey: ['activity-logs', filters], queryFn: () => apiRequest(`/api/activity-logs?${qs}`, accessToken!), enabled: !!accessToken });
}
export function useCreateDepartment() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Department, Error, unknown>({ mutationFn: (d) => apiRequest('/api/departments', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }) });
}
export function useUpdateDepartment() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Department, Error, { id: string; data: unknown }>({ mutationFn: ({ id, data }) => apiRequest(`/api/departments/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }) });
}
export function useDeleteDepartment() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/departments/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }) });
}
export function useCreateEmployee() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Employee, Error, unknown>({ mutationFn: (d) => apiRequest('/api/employees', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }) });
}
export function useUpdateEmployee() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Employee, Error, { id: string; data: unknown }>({ mutationFn: ({ id, data }) => apiRequest(`/api/employees/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }) });
}
export function useDeleteEmployee() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/employees/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }) });
}
