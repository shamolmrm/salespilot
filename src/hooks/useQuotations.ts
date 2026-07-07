import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface QuotationItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  sortOrder: number;
}

export interface Quotation {
  id: string;
  number: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  customerId: string | null;
  dealId: string | null;
  userId: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  discount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  validUntil: string | null;
  customer: { id: string; firstName: string; lastName: string; email: string | null } | null;
  items: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export function useQuotations(status?: string) {
  const { accessToken } = useAuth();
  const params = status ? `?status=${status}` : '';
  return useQuery<Quotation[]>({
    queryKey: ['quotations', status],
    queryFn: () => apiRequest(`/api/quotations${params}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useQuotation(id: string) {
  const { accessToken } = useAuth();
  return useQuery<Quotation>({
    queryKey: ['quotation', id],
    queryFn: () => apiRequest(`/api/quotations/${id}`, accessToken!),
    enabled: !!accessToken && !!id,
  });
}

export function useCreateQuotation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Quotation, Error, unknown>({
    mutationFn: (data) => apiRequest('/api/quotations', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}

export function useUpdateQuotation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Quotation, Error, { id: string; data: unknown }>({
    mutationFn: ({ id, data }) => apiRequest(`/api/quotations/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['quotation', id] });
    },
  });
}

export function useDeleteQuotation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiRequest(`/api/quotations/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}

export function useDownloadPDF(type: 'quotations' | 'invoices') {
  const { accessToken } = useAuth();
  return async (id: string, number: string) => {
    const res = await fetch(`/api/${type}/${id}/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('PDF generation failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'quotations' ? 'Quotation' : 'Invoice'}-${number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
}
