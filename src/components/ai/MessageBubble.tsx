'use client';

import { cn } from '@/lib/utils';
import type { AiMessageItem } from '@/hooks/useAI';

interface Props {
  message: AiMessageItem;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'USER';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? 'You' : 'AI'}
      </div>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-muted text-foreground',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
