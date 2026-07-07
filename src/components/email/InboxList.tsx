'use client';

import { cn } from '@/lib/utils';
import type { EmailMessage } from '@/hooks/useEmail';

interface Props {
  emails: EmailMessage[];
  selectedId: string | null;
  onSelect: (email: EmailMessage) => void;
}

export function InboxList({ emails, selectedId, onSelect }: Props) {
  if (emails.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No emails
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {emails.map((email) => (
        <li
          key={email.id}
          onClick={() => onSelect(email)}
          className={cn(
            'cursor-pointer px-4 py-3 hover:bg-accent/50 transition-colors',
            selectedId === email.id && 'bg-accent',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {!email.isRead && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
                <p className={cn('truncate text-sm', !email.isRead ? 'font-semibold' : 'font-normal')}>
                  {email.fromName ?? email.fromEmail}
                </p>
              </div>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{email.subject}</p>
              <p className="truncate text-xs text-muted-foreground/70 mt-0.5 leading-snug">
                {email.body.slice(0, 80)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {email.receivedAt
                ? new Date(email.receivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : ''}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
