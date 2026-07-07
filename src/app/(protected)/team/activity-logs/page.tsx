'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivityLogs } from '@/hooks/useTeam';
import { ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LOG_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'EXPORT', 'BACKUP', 'RESTORE', 'VIEW_SENSITIVE'];
const ACTION_COLOR: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default', UPDATE: 'secondary', DELETE: 'destructive', ROLE_CHANGE: 'destructive',
  LOGIN: 'outline', LOGOUT: 'outline', EXPORT: 'secondary', BACKUP: 'outline', RESTORE: 'outline', VIEW_SENSITIVE: 'destructive',
};

export default function ActivityLogsPage() {
  const router = useRouter();
  const [action, setAction] = useState('');
  const { data: logs = [], isLoading } = useActivityLogs({ action: action || undefined });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={18} /></Button>
        <div className="flex items-center gap-2"><Shield size={22} /><h1 className="text-xl font-semibold">Activity Logs</h1></div>
        <Badge variant="secondary" className="ml-2">Read-only audit trail</Badge>
      </div>

      <div className="flex items-center gap-3">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by action…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            {LOG_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{logs.length} entries</span>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2 pr-4 font-medium">Time</th><th className="pb-2 pr-4 font-medium">User</th><th className="pb-2 pr-4 font-medium">Action</th><th className="pb-2 pr-4 font-medium">Entity</th><th className="pb-2 font-medium">Details</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{log.user.name}</td>
                  <td className="py-2 pr-4"><Badge variant={ACTION_COLOR[log.action] ?? 'outline'}>{log.action}</Badge></td>
                  <td className="py-2 pr-4 text-muted-foreground">{log.entityType ?? '—'}{log.entityId ? ` #${log.entityId.slice(-6)}` : ''}</td>
                  <td className="py-2 text-xs text-muted-foreground max-w-xs truncate">{log.metadata ? JSON.stringify(log.metadata) : '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No logs yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
