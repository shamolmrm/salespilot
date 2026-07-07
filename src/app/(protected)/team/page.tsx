'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useDepartments, useEmployees, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useCreateEmployee, useDeleteEmployee, type Department, type Employee } from '@/hooks/useTeam';
import { Users, Building2, Plus, Trash2, Pencil, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function TeamPage() {
  const { toast } = useToast();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();
  const createEmp = useCreateEmployee();
  const deleteEmp = useDeleteEmployee();

  const [deptForm, setDeptForm] = useState(false);
  const [empForm, setEmpForm] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [empUserId, setEmpUserId] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empDept, setEmpDept] = useState('');

  const handleCreateDept = async () => {
    if (!deptName.trim()) return;
    try { await createDept.mutateAsync({ name: deptName.trim() }); toast({ title: 'Department created' }); setDeptForm(false); setDeptName(''); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleCreateEmp = async () => {
    if (!empUserId || !empTitle) return;
    try {
      await createEmp.mutateAsync({ userId: empUserId, title: empTitle, departmentId: empDept || undefined });
      toast({ title: 'Employee added' }); setEmpForm(false); setEmpUserId(''); setEmpTitle(''); setEmpDept('');
    } catch { toast({ title: 'Error — user may already be an employee', variant: 'destructive' }); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Users size={22} /><h1 className="text-xl font-semibold">Team</h1></div>
        <div className="flex gap-2">
          <Link href="/team/activity-logs"><Button variant="outline" size="sm">Activity Logs</Button></Link>
          <Button size="sm" onClick={() => setEmpForm(true)}><Plus size={14} className="mr-1" />Add Employee</Button>
          <Button size="sm" variant="outline" onClick={() => setDeptForm(true)}><Building2 size={14} className="mr-1" />New Department</Button>
        </div>
      </div>

      {/* Departments */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Departments ({departments.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {departments.map((d) => (
            <div key={d.id} className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{d.name}</span>
                <div className="flex gap-1">
                  <Badge variant="secondary">{d._count.employees} members</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={async () => { try { await deleteDept.mutateAsync(d.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }}><Trash2 size={12} /></Button>
                </div>
              </div>
              {d.manager && <p className="text-xs text-muted-foreground">Manager: {d.manager.name}</p>}
            </div>
          ))}
          {departments.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-4">No departments yet</p>}
        </div>
      </div>

      {/* Employees */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Employees ({employees.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2 pr-4 font-medium">Name</th><th className="pb-2 pr-4 font-medium">Title</th><th className="pb-2 pr-4 font-medium">Department</th><th className="pb-2 pr-4 font-medium">Role</th><th className="pb-2" /></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 pr-4 font-medium">{e.user.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{e.title}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{e.department?.name ?? '—'}</td>
                  <td className="py-2 pr-4"><Badge variant="outline">{e.user.role}</Badge></td>
                  <td className="py-2"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { try { await deleteEmp.mutateAsync(e.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }}><Trash2 size={13} /></Button></td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No employees yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department dialog */}
      <Dialog open={deptForm} onOpenChange={(o) => { if (!o) setDeptForm(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={deptName} onChange={(e) => setDeptName(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDeptForm(false)}>Cancel</Button><Button onClick={handleCreateDept} disabled={createDept.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee dialog */}
      <Dialog open={empForm} onOpenChange={(o) => { if (!o) setEmpForm(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>User ID *</Label><Input value={empUserId} onChange={(e) => setEmpUserId(e.target.value)} placeholder="User cuid…" /></div>
            <div className="space-y-1"><Label>Title *</Label><Input value={empTitle} onChange={(e) => setEmpTitle(e.target.value)} placeholder="Software Engineer" /></div>
            <div className="space-y-1"><Label>Department</Label>
              <Select value={empDept} onValueChange={setEmpDept}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent><SelectItem value="">None</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEmpForm(false)}>Cancel</Button><Button onClick={handleCreateEmp} disabled={createEmp.isPending}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
