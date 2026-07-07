'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/ai/ConversationList';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { useConversations, useDeleteConversation } from '@/hooks/useAI';
import { useToast } from '@/components/ui/use-toast';

export default function AIPage() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { data: conversations = [], isLoading } = useConversations();
  const deleteConversation = useDeleteConversation();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation.mutateAsync(id);
      if (activeConvId === id) setActiveConvId(null);
      toast({ title: 'Conversation deleted' });
    } catch {
      toast({ title: 'Error', description: 'Could not delete', variant: 'destructive' });
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 shrink-0 border-r bg-muted/20">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={setActiveConvId}
            onNew={() => setActiveConvId(null)}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={activeConvId}
          onConversationCreated={(id) => setActiveConvId(id)}
        />
      </div>
    </div>
  );
}
