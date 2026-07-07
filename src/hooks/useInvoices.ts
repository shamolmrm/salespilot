import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface InvoiceItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  sortOrder: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerTxId: string | null;
  last4: string | null;
  payerEmail: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  customerId: string | null;
  quotationId: string | null;
  userId: string;
  currency: string;
  exchangeRate: number;
  subtotal: number;
  discount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  dueDate: string | null;
  paidAt: string | null;
  customer: { id: string; firstName: string; lastName: string; email: string | null } | null;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  createdAt: string;
  updatedAt: string;
}

export function useInvoices(status?: string) {
  const { accessToken } = useAuth();
  const params = status ? `?status=${status}` : '';
  return useQuery<Invoice[]>({
    queryKey: ['invoices', status],
    queryFn: () => apiRequest(`/api/invoices${params}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useInvoice(id: string) {
  const { accessToken } = useAuth();
  return useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: () => apiRequest(`/api/invoices/${id}`, accessToken!),
    enabled: !!accessToken && !!id,
  });
}

export function useCreateInvoice() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Invoice, Error, unknown>({
    mutationFn: (data) => apiRequest('/api/invoices', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useCreateInvoiceFromQuotation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Invoice, Error, { quotationId: string }>({
    mutationFn: (data) => apiRequest('/api/invoices/from-quotation', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['quotations'] }); },
  });
}

export function useUpdateInvoice() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Invoice, Error, { id: string; data: unknown }>({
    mutationFn: ({ id, data }) => apiRequest(`/api/invoices/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });
}

export function useDeleteInvoice() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiRequest(`/api/invoices/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
