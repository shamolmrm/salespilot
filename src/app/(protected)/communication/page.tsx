'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useChatRooms, useChatMessages, useChatSocket, useSendMessage, useCreateRoom, type ChatRoom } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Plus, Send, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CommunicationPage() {
  const { toast } = useToast();
  const { user, accessToken } = useAuth();
  const { data: rooms = [] } = useChatRooms();
  const { socket, connected } = useChatSocket(accessToken);
  const createRoom = useCreateRoom();

  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newRoomDialog, setNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMemberIds, setNewRoomMemberIds] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage } = useChatMessages(activeRoom?.id ?? '');
  const sendMessage = useSendMessage();

  // Join room on socket when activeRoom changes
  useEffect(() => {
    if (!socket || !activeRoom) return;
    socket.emit('join-room', activeRoom.id);
    return () => { socket.emit('leave-room', activeRoom.id); };
  }, [socket, activeRoom?.id]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: unknown) => addMessage(msg as ReturnType<typeof useChatMessages>['messages'][0]);
    socket.on('new-message', handler);
    return () => { socket.off('new-message', handler); };
  }, [socket, addMessage]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeRoom) return;
    const content = messageInput.trim();
    setMessageInput('');
    try {
      const msg = await sendMessage.mutateAsync({ roomId: activeRoom.id, content });
      // Broadcast via socket so other clients see it instantly
      socket?.emit('send-message', { roomId: activeRoom.id, message: msg });
      addMessage(msg);
    } catch { toast({ title: 'Send failed', variant: 'destructive' }); setMessageInput(content); }
  };

  const handleCreateRoom = async () => {
    const memberIds = newRoomMemberIds.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const room = await createRoom.mutateAsync({ name: newRoomName.trim() || undefined, type: 'GROUP', memberIds });
      setNewRoomDialog(false); setNewRoomName(''); setNewRoomMemberIds('');
      setActiveRoom(room as ChatRoom);
      toast({ title: 'Room created' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2"><MessageSquare size={18} /><span className="font-medium text-sm">Chat</span></div>
          <div className="flex items-center gap-2">
            <Circle size={8} fill={connected ? '#22c55e' : '#94a3b8'} className={connected ? 'text-green-500' : 'text-muted-foreground'} />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNewRoomDialog(true)}><Plus size={14} /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rooms.map((room) => (
            <button key={room.id} onClick={() => setActiveRoom(room)} className={`w-full text-left rounded-lg px-3 py-2.5 ${activeRoom?.id === room.id ? 'bg-primary/10' : 'hover:bg-muted'}`}>
              <div className="text-sm font-medium truncate">{(room.name ?? room.members.filter((m) => m.userId !== user?.id).map((m) => m.user.name).join(', ')) || 'Room'}</div>
              {room.messages[0] && <div className="text-xs text-muted-foreground truncate">{room.messages[0].content}</div>}
            </button>
          ))}
          {rooms.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No rooms yet. Create one!</p>}
        </div>
      </div>

      {/* Chat area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-medium">{activeRoom.name ?? 'Room'}</h2>
            <p className="text-xs text-muted-foreground">{activeRoom.members.length} members</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.userId === user?.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{msg.user.name[0]?.toUpperCase()}</div>
                  <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-xl px-3 py-2 text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{msg.content}</div>
                    <span className="text-xs text-muted-foreground mt-0.5">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input placeholder="Type a message…" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
            <Button size="icon" onClick={handleSend} disabled={!messageInput.trim() || sendMessage.isPending}><Send size={16} /></Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2"><MessageSquare size={40} className="mx-auto opacity-30" /><p className="text-sm">Select a room to start chatting</p></div>
        </div>
      )}

      {/* Create room dialog */}
      <Dialog open={newRoomDialog} onOpenChange={(o) => { if (!o) setNewRoomDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Chat Room</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Room Name (optional)</Label><Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Team Alpha, Project X…" /></div>
            <div className="space-y-1"><Label>Member User IDs (comma-separated) *</Label><Input value={newRoomMemberIds} onChange={(e) => setNewRoomMemberIds(e.target.value)} placeholder="cuid1, cuid2…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewRoomDialog(false)}>Cancel</Button><Button onClick={handleCreateRoom} disabled={createRoom.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
