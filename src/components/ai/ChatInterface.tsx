'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { TemplateSelector } from './TemplateSelector';
import { useConversation, useSendMessage, useAITemplates, type AiMessageItem } from '@/hooks/useAI';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
}

export function ChatInterface({ conversationId, onConversationCreated }: Props) {
  const [input, setInput] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  // Optimistic messages shown while the mutation is in flight
  const [optimisticMsgs, setOptimisticMsgs] = useState<AiMessageItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const { data: conversation, isLoading } = useConversation(conversationId);
  const { data: templates = [] } = useAITemplates();
  const sendMessage = useSendMessage();

  const messages = [
    ...(conversation?.messages ?? []),
    ...optimisticMsgs,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Clear optimistic messages once real data arrives
  useEffect(() => {
    if (conversation) setOptimisticMsgs([]);
  }, [conversation?.messages?.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sendMessage.isPending) return;

    setInput('');

    // Optimistically show the user's message immediately
    const tempId = `temp-${Date.now()}`;
    const userMsg: AiMessageItem = { id: tempId, role: 'USER', content: text, createdAt: new Date().toISOString() };
    const thinkingMsg: AiMessageItem = { id: `${tempId}-ai`, role: 'ASSISTANT', content: '…', createdAt: new Date().toISOString() };
    setOptimisticMsgs([userMsg, thinkingMsg]);

    try {
      const res = await sendMessage.mutateAsync({
        conversationId: conversationId ?? undefined,
        message: text,
        templateId: templateId ?? undefined,
        newTitle: !conversationId ? text.slice(0, 80) : undefined,
      });
      if (!conversationId) {
        onConversationCreated(res.conversationId);
      }
      setOptimisticMsgs([]);
    } catch (err: unknown) {
      setOptimisticMsgs([]);
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setInput(text); // Restore input on failure
    }
  }, [input, conversationId, templateId, sendMessage, onConversationCreated, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId && messages.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {/* Welcome + template selector */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">SalesPilot AI Assistant</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a template or ask anything about sales, leads, or email writing.
            </p>
          </div>
          {templates.length > 0 && (
            <TemplateSelector templates={templates} selected={templateId} onSelect={setTemplateId} />
          )}
        </div>
        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={templateId
                ? `Using template: ${templates.find(t => t.id === templateId)?.label}…`
                : 'Ask SalesPilot AI anything…'}
              className="min-h-[52px] resize-none"
              rows={2}
            />
            <Button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending} size="icon" className="h-[52px] w-[52px] shrink-0">
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Template bar */}
      {templates.length > 0 && (
        <div className="border-b px-4 py-2">
          <TemplateSelector templates={templates} selected={templateId} onSelect={setTemplateId} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            className="min-h-[52px] resize-none"
            rows={2}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending} size="icon" className="h-[52px] w-[52px] shrink-0">
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
