'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useDocumentFolders, useDocuments, useCreateFolder, useUploadDocument, useDeleteDocument, type Document } from '@/hooks/useDocuments';
import { FolderOpen, FileText, Plus, Upload, Trash2, Search, Folder } from 'lucide-react';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [folderDialog, setFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState('');

  const { data: folders = [] } = useDocumentFolders();
  const { data: docs = [], isLoading } = useDocuments(selectedFolder, search);
  const createFolder = useCreateFolder();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    if (selectedFolder) fd.append('folderId', selectedFolder);
    try { await uploadDoc.mutateAsync(fd); toast({ title: 'File uploaded' }); }
    catch { toast({ title: 'Upload failed', variant: 'destructive' }); }
    e.target.value = '';
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try { await createFolder.mutateAsync({ name: folderName.trim() }); toast({ title: 'Folder created' }); setFolderDialog(false); setFolderName(''); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><FileText size={22} /><h1 className="text-xl font-semibold">Documents</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFolderDialog(true)}><Folder size={14} className="mr-1" />New Folder</Button>
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploadDoc.isPending}><Upload size={14} className="mr-1" />{uploadDoc.isPending ? 'Uploading…' : 'Upload'}</Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Folder sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          <button className={`w-full text-left text-sm px-3 py-2 rounded-lg ${!selectedFolder ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`} onClick={() => setSelectedFolder(undefined)}>All Files</button>
          {folders.map((f) => (
            <button key={f.id} className={`w-full text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${selectedFolder === f.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`} onClick={() => setSelectedFolder(f.id)}>
              <FolderOpen size={14} /><span className="truncate">{f.name}</span><Badge variant="secondary" className="ml-auto text-xs">{f._count.documents}</Badge>
            </button>
          ))}
        </div>

        {/* File list */}
        <div className="flex-1 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
            <div className="space-y-2">
              {docs.map((doc) => <DocRow key={doc.id} doc={doc} onDelete={async () => { try { await deleteDoc.mutateAsync(doc.id); } catch { toast({ title: 'Error', variant: 'destructive' }); } }} />)}
              {docs.length === 0 && <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">No documents. Upload one to get started.</div>}
            </div>
          )}
        </div>
      </div>

      <Dialog open={folderDialog} onOpenChange={(o) => { if (!o) setFolderDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <div className="space-y-1"><Label>Name *</Label><Input value={folderName} onChange={(e) => setFolderName(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setFolderDialog(false)}>Cancel</Button><Button onClick={handleCreateFolder} disabled={createFolder.isPending}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocRow({ doc, onDelete }: { doc: Document; onDelete: () => void }) {
  const ext = doc.name.split('.').pop()?.toUpperCase() ?? 'FILE';
  return (
    <div className="flex items-center gap-3 rounded-lg border px-4 py-3 group hover:bg-muted/50">
      <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{ext}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()} · {doc.createdBy.name}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <a href={`/api/documents/file/${encodeURIComponent(doc.storagePath)}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><FileText size={14} /></Button></a>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 size={14} /></Button>
      </div>
    </div>
  );
}
