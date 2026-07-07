'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAdminUsers, useSystemStats, useChangeRole, useDeleteUser, useDownloadBackup, type AdminUser } from '@/hooks/useAdmin';
import { ShieldCheck, Users, Download, Trash2, Search } from 'lucide-react';

const ROLES = ['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'];
const ROLE_COLOR: Record<string, string> = { ADMIN: 'bg-red-100 text-red-700', MANAGER: 'bg-orange-100 text-orange-700', SALES_REP: 'bg-blue-100 text-blue-700', VIEWER: 'bg-gray-100 text-gray-600' };

export default function AdminPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useAdminUsers(search || undefined);
  const { data: stats } = useSystemStats();
  const changeRole = useChangeRole();
  const deleteUser = useDeleteUser();
  const downloadBackup = useDownloadBackup();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><ShieldCheck size={22} /><h1 className="text-xl font-semibold">Admin Panel</h1></div>
        <Button variant="outline" size="sm" onClick={downloadBackup}><Download size={14} className="mr-1" />Backup (JSON)</Button>
      </div>

      {/* System stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground capitalize">{key}</p>
              <p className="text-2xl font-bold">{val as number}</p>
            </div>
          ))}
        </div>
      )}

      {/* User management */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><Users size={18} /><h2 className="font-medium">Users</h2></div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2 pr-4 font-medium">Name</th><th className="pb-2 pr-4 font-medium">Email</th><th className="pb-2 pr-4 font-medium">Role</th><th className="pb-2 pr-4 font-medium">Logs</th><th className="pb-2 pr-4 font-medium">Joined</th><th className="pb-2" /></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-medium">{u.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-2 pr-4">
                      <Select value={u.role} onValueChange={async (role) => {
                        try { await changeRole.mutateAsync({ id: u.id, role }); toast({ title: 'Role updated' }); }
                        catch { toast({ title: 'Error', variant: 'destructive' }); }
                      }}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{u._count.activityLogs}</td>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                        if (!confirm(`Delete user ${u.name}?`)) return;
                        try { await deleteUser.mutateAsync(u.id); toast({ title: 'User deleted' }); }
                        catch (e) { toast({ title: e instanceof Error ? e.message : 'Error', variant: 'destructive' }); }
                      }}><Trash2 size={13} /></Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <strong>Database Management:</strong> Raw SQL queries are not exposed in this admin panel. Use the JSON backup/restore for data exports. For schema migrations, use <code className="font-mono text-xs bg-amber-100 px-1 rounded">npx prisma migrate</code> on the server.
      </div>
    </div>
  );
}
