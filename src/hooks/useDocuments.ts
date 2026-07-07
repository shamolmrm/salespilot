import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface DocumentFolder { id: string; name: string; parentFolderId: string | null; _count: { documents: number; children: number } }
export interface Document {
  id: string; name: string; folderId: string | null; fileSize: number; mimeType: string;
  storagePath: string; ocrText: string | null; aiSummary: string | null; createdAt: string;
  folder: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  _count: { versions: number };
}
export interface DocumentVersion { id: string; versionNumber: number; fileSize: number; changeNote: string | null; createdAt: string; createdBy: { id: string; name: string } }

export function useDocumentFolders() {
  const { accessToken } = useAuth();
  return useQuery<DocumentFolder[]>({ queryKey: ['doc-folders'], queryFn: () => apiRequest('/api/document-folders', accessToken!), enabled: !!accessToken });
}
export function useDocuments(folderId?: string, search?: string) {
  const { accessToken } = useAuth();
  const qs = new URLSearchParams();
  if (folderId) qs.set('folderId', folderId);
  if (search) qs.set('search', search);
  return useQuery<Document[]>({ queryKey: ['documents', folderId, search], queryFn: () => apiRequest(`/api/documents?${qs}`, accessToken!), enabled: !!accessToken });
}
export function useDocument(id: string) {
  const { accessToken } = useAuth();
  return useQuery<Document & { versions: DocumentVersion[] }>({ queryKey: ['documents', id], queryFn: () => apiRequest(`/api/documents/${id}`, accessToken!), enabled: !!accessToken && !!id });
}

export function useCreateFolder() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<DocumentFolder, Error, unknown>({ mutationFn: (d) => apiRequest('/api/document-folders', accessToken!, { method: 'POST', body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-folders'] }) });
}
export function useUploadDocument() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<Document, Error, FormData>({
    mutationFn: (fd) => fetch('/api/documents', { method: 'POST', headers: { authorization: `Bearer ${accessToken}` }, body: fd }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error ?? 'Upload failed'); return d; }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}
export function useDeleteDocument() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => apiRequest(`/api/documents/${id}`, accessToken!, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });
}
export function useUploadVersion() {
  const { accessToken } = useAuth(); const qc = useQueryClient();
  return useMutation<DocumentVersion, Error, { docId: string; fd: FormData }>({
    mutationFn: ({ docId, fd }) => fetch(`/api/documents/${docId}/versions`, { method: 'POST', headers: { authorization: `Bearer ${accessToken}` }, body: fd }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error ?? 'Upload failed'); return d; }),
    onSuccess: (_, { docId }) => qc.invalidateQueries({ queryKey: ['documents', docId] }),
  });
}
