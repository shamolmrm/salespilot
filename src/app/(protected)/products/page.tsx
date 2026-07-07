'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductForm } from '@/components/products/ProductForm';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from '@/hooks/useProducts';
import { Plus, Search, Package } from 'lucide-react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useProducts(search, undefined, activeOnly);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const openCreate = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); };

  const handleSubmit = async (data: unknown) => {
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, data });
        toast({ title: 'Product updated' });
      } else {
        await createProduct.mutateAsync(data);
        toast({ title: 'Product created' });
      }
      setFormOpen(false);
    } catch {
      toast({ title: 'Error saving product', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: 'Product deleted' });
    } catch {
      toast({ title: 'Error deleting product', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={22} />
          <h1 className="text-xl font-semibold">Products</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" />
          New Product
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded"
          />
          Active only
        </label>
        <span className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : (
        <ProductTable products={products} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
