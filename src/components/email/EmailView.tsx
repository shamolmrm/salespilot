'use client';

import { Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EmailMessage } from '@/hooks/useEmail';

interface Props {
  email: EmailMessage;
  onReply: () => void;
}

export function EmailView({ email, onReply }: Props) {
  return (
    <div className="flex h-full flex-col overflow-auto p-6">
      <div className="mb-4 border-b pb-4">
        <h2 className="text-lg font-semibold">{email.subject}</h2>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{email.fromName ?? email.fromEmail}</span>
            {email.fromName && <span> &lt;{email.fromEmail}&gt;</span>}
          </div>
          {email.receivedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(email.receivedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
        {email.bodyType === 'HTML' ? (
          <div dangerouslySetInnerHTML={{ __html: email.body }} />
        ) : (
          email.body
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <Button onClick={onReply} variant="outline" size="sm" className="gap-2">
          <Reply className="h-4 w-4" />
          Reply
        </Button>
      </div>
    </div>
  );
}
