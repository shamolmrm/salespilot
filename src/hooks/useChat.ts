import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMember { userId: string; user: { id: string; name: string } }
export interface ChatMessage { id: string; chatRoomId: string; userId: string; content: string; contentType: string; createdAt: string; user: { id: string; name: string } }
export interface ChatRoom { id: string; name: string | null; type: string; members: ChatMember[]; messages: ChatMessage[] }

const SOCKET_URL = `http://localhost:${process.env.NEXT_PUBLIC_SOCKET_PORT ?? '3001'}`;

export function useChatSocket(accessToken: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const s = io(SOCKET_URL, { auth: { token: accessToken }, autoConnect: true, reconnectionAttempts: 5 });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    socketRef.current = s;
    return () => { s.disconnect(); socketRef.current = null; };
  }, [accessToken]);

  return { socket: socketRef.current, connected };
}

export function useChatRooms() {
  const { accessToken } = useAuth();
  return useQuery<ChatRoom[]>({ queryKey: ['chat-rooms'], queryFn: () => apiRequest('/api/chat/rooms', accessToken!), enabled: !!accessToken });
}

export function useChatMessages(roomId: string) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const qc = useQueryClient();

  // Initial load
  const { data, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', roomId],
    queryFn: () => apiRequest(`/api/chat/rooms/${roomId}/messages`, accessToken!),
    enabled: !!accessToken && !!roomId,
  });

  useEffect(() => { if (data) setMessages(data); }, [data]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    qc.invalidateQueries({ queryKey: ['chat-rooms'] });
  }, [qc]);

  return { messages, isLoading, addMessage };
}

export function useCreateRoom() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<ChatRoom, Error, unknown>({ mutationFn: (d) => apiRequest('/api/chat/rooms', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-rooms'] }) });
}

export function useSendMessage() {
  const { accessToken } = useAuth();
  return useMutation<ChatMessage, Error, { roomId: string; content: string }>({
    mutationFn: ({ roomId, content }) => apiRequest(`/api/chat/rooms/${roomId}/messages`, accessToken!, { method: 'POST', body: JSON.stringify({ content }) }),
  });
}
