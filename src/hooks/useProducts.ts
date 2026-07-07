import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  currency: string;
  stockCount: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export function useProducts(search = '', categoryId?: string, activeOnly = true) {
  const { accessToken } = useAuth();
  const params = new URLSearchParams({ search, activeOnly: String(activeOnly) });
  if (categoryId) params.set('categoryId', categoryId);
  return useQuery<Product[]>({
    queryKey: ['products', search, categoryId, activeOnly],
    queryFn: () => apiRequest(`/api/products?${params}`, accessToken!),
    enabled: !!accessToken,
  });
}

export function useProductCategories() {
  const { accessToken } = useAuth();
  return useQuery<ProductCategory[]>({
    queryKey: ['product-categories'],
    queryFn: () => apiRequest('/api/products/categories', accessToken!),
    enabled: !!accessToken,
  });
}

export function useCreateProduct() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Product, Error, unknown>({
    mutationFn: (data) => apiRequest('/api/products', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<Product, Error, { id: string; data: unknown }>({
    mutationFn: ({ id, data }) => apiRequest(`/api/products/${id}`, accessToken!, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiRequest(`/api/products/${id}`, accessToken!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useCreateCategory() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation<ProductCategory, Error, { name: string; description?: string }>({
    mutationFn: (data) => apiRequest('/api/products/categories', accessToken!, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });
}
