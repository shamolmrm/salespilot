'use client';

import { useState } from 'react';
import { Plus, RefreshCw, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InboxList } from '@/components/email/InboxList';
import { EmailView } from '@/components/email/EmailView';
import { ComposeModal } from '@/components/email/ComposeModal';
import { AccountSetupModal } from '@/components/email/AccountSetupModal';
import {
  useEmailAccounts,
  useInbox,
  useSyncInbox,
  useMarkRead,
  type EmailMessage,
} from '@/hooks/useEmail';
import { useToast } from '@/components/ui/use-toast';

export default function EmailPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyEmail, setReplyEmail] = useState<EmailMessage | undefined>(undefined);
  const [accountSetupOpen, setAccountSetupOpen] = useState(false);
  const { toast } = useToast();

  const { data: accounts = [] } = useEmailAccounts();
  const { data: inbox, isLoading: inboxLoading } = useInbox(selectedAccountId);
  const syncInbox = useSyncInbox();
  const markRead = useMarkRead();

  const handleSelectEmail = async (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      await markRead.mutateAsync(email.id).catch(() => null);
    }
  };

  const handleSync = async () => {
    const accountId = selectedAccountId ?? accounts[0]?.id;
    if (!accountId) {
      toast({ title: 'No account selected', variant: 'destructive' });
      return;
    }
    const creds = window.electronAPI
      ? await window.electronAPI.invoke('get-email-credentials', accountId)
      : null;
    if (!creds) {
      toast({ title: 'No credentials', description: 'Re-add your email account.', variant: 'destructive' });
      return;
    }
    try {
      const res = await syncInbox.mutateAsync({
        accountId,
        smtpPassword: creds.smtpPassword,
        imapPassword: creds.imapPassword,
      });
      toast({ title: `Synced ${res.synced} new email${res.synced !== 1 ? 's' : ''}` });
    } catch (err: unknown) {
      toast({ title: 'Sync failed', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleReply = (email: EmailMessage) => {
    setReplyEmail(email);
    setComposeOpen(true);
  };

  if (accounts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No email accounts set up yet.</p>
        <Button onClick={() => setAccountSetupOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Email Account
        </Button>
        <AccountSetupModal open={accountSetupOpen} onClose={() => setAccountSetupOpen(false)} />
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left panel — inbox list */}
      <div className="flex w-80 shrink-0 flex-col border-r">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {accounts.length > 1 ? (
            <Select
              value={selectedAccountId ?? '__all__'}
              onValueChange={(v) => setSelectedAccountId(v === '__all__' ? undefined : v)}
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="flex-1 truncate text-sm font-medium">{accounts[0]?.name}</span>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSync} disabled={syncInbox.isPending}>
            {syncInbox.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setAccountSetupOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Compose button */}
        <div className="px-3 py-2">
          <Button className="w-full gap-2" size="sm" onClick={() => { setReplyEmail(undefined); setComposeOpen(true); }}>
            <Plus className="h-4 w-4" /> Compose
          </Button>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {inboxLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <InboxList
              emails={inbox?.emails ?? []}
              selectedId={selectedEmail?.id ?? null}
              onSelect={handleSelectEmail}
            />
          )}
        </div>
      </div>

      {/* Right panel — email view */}
      <div className="flex-1 overflow-hidden">
        {selectedEmail ? (
          <EmailView email={selectedEmail} onReply={() => handleReply(selectedEmail)} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select an email to read
          </div>
        )}
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setReplyEmail(undefined); }}
        accounts={accounts}
        replyTo={replyEmail}
      />
      <AccountSetupModal open={accountSetupOpen} onClose={() => setAccountSetupOpen(false)} />
    </div>
  );
}
