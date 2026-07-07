'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useTasks, useTaskLists, useCreateTask, useUpdateTask, useDeleteTask, type Task } from '@/hooks/useTasks';
import { CheckSquare, Plus, Trash2, Calendar, Circle, CircleDot, CircleCheck } from 'lucide-react';

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_COLOR: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700', DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-50 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700',
};

export default function TasksPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [listId, setListId] = useState('');

  const { data: tasks = [], isLoading } = useTasks({ status: statusFilter || undefined });
  const { data: lists = [] } = useTaskLists();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const reset = () => { setTitle(''); setDesc(''); setPriority('MEDIUM'); setStatus('TODO'); setDueDate(''); setListId(''); setFormOpen(false); };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createTask.mutateAsync({ title: title.trim(), description: desc || undefined, priority, status, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, taskListId: listId || undefined });
      toast({ title: 'Task created' }); reset();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  // Kanban columns
  const columns = STATUSES.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s) }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><CheckSquare size={22} /><h1 className="text-xl font-semibold">Tasks</h1></div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setFormOpen(true)}><Plus size={14} className="mr-1" />New Task</Button>
        </div>
      </div>

      {/* Kanban Board (filtered view shows list, else Kanban) */}
      {statusFilter ? (
        <div className="space-y-2">
          {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : tasks.map((task) => <TaskCard key={task.id} task={task} onDelete={async () => { try { await deleteTask.mutateAsync(task.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }} onStatusChange={async (s) => { try { await updateTask.mutateAsync({ id: task.id, data: { status: s } }); } catch { /* silent */ } }} />)}
          {tasks.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No tasks with this status</p>}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.status} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[col.status]}`}>{col.status.replace('_', ' ')}</span>
                <span className="text-xs text-muted-foreground">{col.tasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {col.tasks.map((task) => <TaskCard key={task.id} task={task} compact onDelete={async () => { try { await deleteTask.mutateAsync(task.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }} onStatusChange={async (s) => { try { await updateTask.mutateAsync({ id: task.id, data: { status: s } }); } catch { /* silent */ } }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><Label>Status</Label>
                <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              <div className="space-y-1"><Label>List</Label>
                <Select value={listId} onValueChange={setListId}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{lists.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={reset}>Cancel</Button><Button onClick={handleCreate} disabled={createTask.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({ task, compact = false, onDelete, onStatusChange }: { task: Task; compact?: boolean; onDelete: () => void; onStatusChange: (s: string) => void }) {
  const priorityStyles: Record<string, string> = { LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-50 text-blue-600', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700' };
  return (
    <div className="rounded-lg border bg-card p-3 space-y-1.5 group">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-sm font-medium ${compact ? 'line-clamp-2' : ''}`}>{task.title}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={onDelete}><Trash2 size={12} /></Button>
      </div>
      {!compact && task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityStyles[task.priority] ?? ''}`}>{task.priority}</span>
        {task.dueDate && <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Calendar size={10} />{new Date(task.dueDate).toLocaleDateString()}</span>}
        {task.assignedTo && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{task.assignedTo.name}</span>}
      </div>
      {!compact && (
        <Select value={task.status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'].map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
