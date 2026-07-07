'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCompanySettings, useUpdateCompanySettings, useApiKeys, useCreateApiKey, useDeleteApiKey, useRevealApiKey } from '@/hooks/useSettings';
import { Settings, Key, Building2, Plus, Trash2, Eye, EyeOff, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: apiKeys = [] } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const revealKey = useRevealApiKey();

  // Company settings form
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.name); setCompanyEmail(settings.email);
      setCompanyPhone(settings.phone ?? ''); setCompanyAddress(settings.address ?? '');
      setCurrency(settings.currency);
    }
  }, [settings]);

  // API key form
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyService, setKeyService] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Reveal dialog
  const [revealDialog, setRevealDialog] = useState<{ id: string; name: string } | null>(null);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState('');
  const [showRevealed, setShowRevealed] = useState(false);

  const handleSaveCompany = async () => {
    try {
      await updateSettings.mutateAsync({ name: companyName, email: companyEmail, phone: companyPhone, address: companyAddress, currency });
      toast({ title: 'Settings saved' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleCreateKey = async () => {
    if (!keyName || !keyService || !keyValue) return;
    try {
      await createKey.mutateAsync({ name: keyName, service: keyService, key: keyValue });
      toast({ title: 'API key saved (encrypted)' }); setKeyDialog(false); setKeyName(''); setKeyService(''); setKeyValue('');
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleReveal = async () => {
    if (!revealDialog || !revealPassword) return;
    try {
      const res = await revealKey.mutateAsync({ id: revealDialog.id, password: revealPassword });
      setRevealedKey(res.key); setRevealPassword(''); setShowRevealed(false);
    } catch (e) { toast({ title: e instanceof Error ? e.message : 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-2"><Settings size={22} /><h1 className="text-xl font-semibold">Settings</h1></div>

      {/* Company settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2"><Building2 size={18} /><h2 className="font-medium">Company</h2></div>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div className="space-y-1"><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} type="email" /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></div>
          <div className="space-y-1"><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" /></div>
          <div className="space-y-1 col-span-2"><Label>Address</Label><Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></div>
        </div>
        <Button onClick={handleSaveCompany} disabled={updateSettings.isPending}>Save Company Settings</Button>
      </section>

      {/* API keys */}
      <section className="space-y-4">
        <div className="flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2"><Key size={18} /><h2 className="font-medium">API Keys</h2><Badge variant="secondary" className="ml-1">Encrypted at rest</Badge></div>
          <Button size="sm" onClick={() => setKeyDialog(true)}><Plus size={14} className="mr-1" />Add Key</Button>
        </div>
        <div className="max-w-2xl space-y-2">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <Lock size={16} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{k.name}</p>
                <p className="text-xs text-muted-foreground">{k.service} · <code className="font-mono">{k.maskedKey}</code></p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => { setRevealDialog({ id: k.id, name: k.name }); setRevealedKey(''); }}><Eye size={13} className="mr-1" />Reveal</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { try { await deleteKey.mutateAsync(k.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && <p className="text-sm text-muted-foreground">No API keys stored yet.</p>}
        </div>
      </section>

      {/* Add key dialog */}
      <Dialog open={keyDialog} onOpenChange={(o) => { if (!o) setKeyDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add API Key</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="OpenAI production" /></div>
            <div className="space-y-1"><Label>Service *</Label><Input value={keyService} onChange={(e) => setKeyService(e.target.value)} placeholder="openai, stripe, paypal…" /></div>
            <div className="space-y-1"><Label>API Key *</Label>
              <div className="relative">
                <Input type={showKey ? 'text' : 'password'} value={keyValue} onChange={(e) => setKeyValue(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowKey((v) => !v)}>{showKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Key will be encrypted with AES-256-GCM before storage. Only the last 4 characters will be visible afterwards.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setKeyDialog(false)}>Cancel</Button><Button onClick={handleCreateKey} disabled={createKey.isPending}>Save Encrypted</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal key dialog */}
      <Dialog open={!!revealDialog} onOpenChange={(o) => { if (!o) { setRevealDialog(null); setRevealedKey(''); setRevealPassword(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reveal API Key — {revealDialog?.name}</DialogTitle></DialogHeader>
          {!revealedKey ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter your account password to decrypt and reveal this key.</p>
              <div className="space-y-1"><Label>Password *</Label><Input type="password" value={revealPassword} onChange={(e) => setRevealPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleReveal(); }} /></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Key revealed. Copy it now — it will not be shown again in this session.</p>
              <div className="relative">
                <Input type={showRevealed ? 'text' : 'password'} value={revealedKey} readOnly className="font-mono pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowRevealed((v) => !v)}>{showRevealed ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
          )}
          <DialogFooter>
            {!revealedKey && <><Button variant="outline" onClick={() => setRevealDialog(null)}>Cancel</Button><Button onClick={handleReveal} disabled={revealKey.isPending || !revealPassword}><Lock size={13} className="mr-1" />Confirm</Button></>}
            {revealedKey && <Button onClick={() => { setRevealDialog(null); setRevealedKey(''); }}>Done</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
