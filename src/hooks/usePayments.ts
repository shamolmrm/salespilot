import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export function useManualPayment() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<unknown, Error, { invoiceId: string; amount: number; currency: string; payerEmail?: string; notes?: string }>({
    mutationFn: (data) => apiRequest('/api/payments/manual', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['invoice'] }); },
  });
}

export function useStripeCheckout() {
  const { accessToken } = useAuth();
  return useMutation<{ checkoutUrl: string; sessionId: string }, Error, { invoiceId: string }>({
    mutationFn: (data) => apiRequest('/api/payments/stripe/create-intent', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
  });
}

export function usePayPalOrder() {
  const { accessToken } = useAuth();
  return useMutation<{ orderId: string; approvalUrl: string }, Error, { invoiceId: string }>({
    mutationFn: (data) => apiRequest('/api/payments/paypal/create-order', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
  });
}

export function usePayPalCapture() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<unknown, Error, { orderId: string }>({
    mutationFn: (data) => apiRequest('/api/payments/paypal/capture', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['invoice'] }); },
  });
}

export function useRefundPayment() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<unknown, Error, { paymentId: string; amount?: number }>({
    mutationFn: ({ paymentId, amount }) => apiRequest(`/api/payments/${paymentId}/refund`, accessToken!, { method: 'POST', body: JSON.stringify({ amount }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['invoice'] }); },
  });
}
