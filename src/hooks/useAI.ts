import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface AiMessageItem {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: AiMessageItem[];
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  usage?: { promptTokens?: number; completionTokens?: number };
}

export function useConversations() {
  const { accessToken } = useAuth();
  return useQuery<ConversationSummary[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => apiRequest('/api/ai/conversations', accessToken!),
    enabled: !!accessToken,
  });
}

export function useConversation(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery<ConversationDetail>({
    queryKey: ['ai-conversation', id],
    queryFn: () => apiRequest(`/api/ai/conversations/${id}`, accessToken!),
    enabled: !!accessToken && !!id,
  });
}

export function useDeleteConversation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/ai/conversations/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
  });
}

export function useSendMessage() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<
    ChatResponse,
    Error,
    { conversationId?: string; message: string; templateId?: string; newTitle?: string }
  >({
    mutationFn: (data) =>
      apiRequest('/api/ai/chat', accessToken!, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
      qc.invalidateQueries({ queryKey: ['ai-conversation', data.conversationId] });
    },
  });
}

export interface TemplateItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export function useAITemplates() {
  const { accessToken } = useAuth();
  return useQuery<TemplateItem[]>({
    queryKey: ['ai-templates'],
    queryFn: () => apiRequest('/api/ai/templates', accessToken!),
    enabled: !!accessToken,
    staleTime: Infinity,
  });
}
