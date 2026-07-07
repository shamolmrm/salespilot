import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface TaskLabel { id: string; name: string; color: string }
export interface TaskList { id: string; name: string; color: string; _count: { tasks: number } }
export interface Task {
  id: string; title: string; description: string | null; status: string; priority: string;
  dueDate: string | null; taskListId: string | null; assignedToId: string | null;
  createdByUserId: string;
  assignedTo: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string };
  taskList: { id: string; name: string } | null;
  labels: { label: TaskLabel }[];
  _count: { comments: number };
}
export interface TaskComment { id: string; content: string; createdAt: string; user: { id: string; name: string } }

export function useTaskLists() {
  const { accessToken } = useAuth();
  return useQuery<TaskList[]>({ queryKey: ['task-lists'], queryFn: () => apiRequest('/api/task-lists', accessToken!), enabled: !!accessToken });
}
export function useTaskLabels() {
  const { accessToken } = useAuth();
  return useQuery<TaskLabel[]>({ queryKey: ['task-labels'], queryFn: () => apiRequest('/api/task-labels', accessToken!), enabled: !!accessToken });
}
export function useTasks(filters?: { status?: string; assignedToId?: string; taskListId?: string }) {
  const { accessToken } = useAuth();
  const qs = new URLSearchParams();
  if (filters?.status) qs.set('status', filters.status);
  if (filters?.assignedToId) qs.set('assignedToId', filters.assignedToId);
  if (filters?.taskListId) qs.set('taskListId', filters.taskListId);
  const queryString = qs.toString();
  return useQuery<Task[]>({ queryKey: ['tasks', filters], queryFn: () => apiRequest(`/api/tasks${queryString ? `?${queryString}` : ''}`, accessToken!), enabled: !!accessToken });
}
export function useTask(id: string) {
  const { accessToken } = useAuth();
  return useQuery<Task & { comments: TaskComment[] }>({ queryKey: ['tasks', id], queryFn: () => apiRequest(`/api/tasks/${id}`, accessToken!), enabled: !!accessToken && !!id });
}
export function useCreateTask() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Task, Error, unknown>({ mutationFn: (d) => apiRequest('/api/tasks', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}
export function useUpdateTask() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Task, Error, { id: string; data: unknown }>({ mutationFn: ({ id, data }) => apiRequest(`/api/tasks/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}
export function useDeleteTask() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/tasks/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) });
}
export function useAddComment() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<TaskComment, Error, { taskId: string; content: string }>({
    mutationFn: ({ taskId, content }) => apiRequest(`/api/tasks/${taskId}/comments`, accessToken!, { method: 'POST', body: JSON.stringify({ content }) }),
    onSuccess: (_, { taskId }) => qc.invalidateQueries({ queryKey: ['tasks', taskId] }),
  });
}
export function useCreateTaskList() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<TaskList, Error, unknown>({ mutationFn: (d) => apiRequest('/api/task-lists', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['task-lists'] }) });
}
