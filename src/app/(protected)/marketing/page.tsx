'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useSendCampaign, type Campaign } from '@/hooks/useCampaigns';
import { Megaphone, Plus, Trash2, Send, Mail, MessageCircle } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', SCHEDULED: 'bg-blue-100 text-blue-700', SENT: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };

export default function MarketingPage() {
  const { toast } = useToast();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('EMAIL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsRaw, setRecipientsRaw] = useState('');

  const reset = () => { setName(''); setType('EMAIL'); setSubject(''); setBody(''); setRecipientsRaw(''); setFormOpen(false); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const recipients = recipientsRaw.split('\n').map((line) => line.trim()).filter(Boolean).map((email) => ({ email }));
    try {
      await createCampaign.mutateAsync({ name: name.trim(), type, subject: subject.trim() || undefined, body: body.trim() || undefined, recipients });
      toast({ title: 'Campaign created' }); reset();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleSend = async (id: string) => {
    try { await sendCampaign.mutateAsync(id); toast({ title: 'Campaign sent' }); }
    catch (e) { toast({ title: e instanceof Error ? e.message : 'Send failed', variant: 'destructive' }); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Megaphone size={22} /><h1 className="text-xl font-semibold">Marketing</h1></div>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus size={14} className="mr-1" />New Campaign</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(['DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED'] as const).map((s) => {
          const count = campaigns.filter((c) => c.status === s).length;
          return <div key={s} className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{s}</p><p className="text-2xl font-bold">{count}</p></div>;
        })}
      </div>

      {/* Campaign list */}
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="space-y-3">
          {campaigns.map((c) => <CampaignRow key={c.id} campaign={c} onSend={() => handleSend(c.id)} onDelete={async () => { try { await deleteCampaign.mutateAsync(c.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }} sendPending={sendCampaign.isPending} />)}
          {campaigns.length === 0 && <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">No campaigns yet. Create one to get started.</div>}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1"><Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="WHATSAPP" disabled>WhatsApp (coming soon)</SelectItem><SelectItem value="SMS" disabled>SMS (coming soon)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="space-y-1"><Label>Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} /></div>
            <div className="space-y-1"><Label>Recipients (one email per line)</Label><Textarea value={recipientsRaw} onChange={(e) => setRecipientsRaw(e.target.value)} rows={4} placeholder="alice@example.com&#10;bob@example.com" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={reset}>Cancel</Button><Button onClick={handleCreate} disabled={createCampaign.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignRow({ campaign, onSend, onDelete, sendPending }: { campaign: Campaign; onSend: () => void; onDelete: () => void; sendPending: boolean }) {
  const TypeIcon = campaign.type === 'EMAIL' ? Mail : MessageCircle;
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TypeIcon size={16} className="text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium">{campaign.name}</p>
            {campaign.subject && <p className="text-xs text-muted-foreground">{campaign.subject}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[campaign.status]}`}>{campaign.status}</span>
          {campaign.status === 'DRAFT' && <Button size="sm" variant="outline" onClick={onSend} disabled={sendPending}><Send size={12} className="mr-1" />Send</Button>}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 size={13} /></Button>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Recipients: {campaign._count.recipients}</span>
        <span>Sent: {campaign.sentCount}</span>
        {campaign.sentAt && <span>Sent {new Date(campaign.sentAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
