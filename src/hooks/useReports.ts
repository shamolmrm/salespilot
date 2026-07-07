import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export function useReportsOverview() {
  const { accessToken } = useAuth();
  return useQuery<{
    totalRevenue: number;
    totalInvoiced: number;
    paidInvoices: number;
    overdueInvoices: number;
    totalLeads: number;
    convertedLeads: number;
    acceptedQuotations: number;
    totalQuotations: number;
    invoicesByStatus: { status: string; count: number; total: number }[];
    leadsByStatus: { status: string; count: number }[];
  }>({
    queryKey: ['reports-overview'],
    queryFn: () => apiRequest('/api/reports/overview', accessToken!),
    enabled: !!accessToken,
  });
}

export function useRevenueReport(year: number) {
  const { accessToken } = useAuth();
  return useQuery<{
    year: number;
    totalRevenue: number;
    monthly: { month: string; revenue: number }[];
    invoiceMonthly: { month: string; invoiced: number; collected: number }[];
  }>({
    queryKey: ['reports-revenue', year],
    queryFn: () => apiRequest(`/api/reports/revenue?year=${year}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useProductsReport() {
  const { accessToken } = useAuth();
  return useQuery<{
    topProducts: { name: string; revenue: number; quantity: number; count: number }[];
  }>({
    queryKey: ['reports-products'],
    queryFn: () => apiRequest('/api/reports/products', accessToken!),
    enabled: !!accessToken,
  });
}
