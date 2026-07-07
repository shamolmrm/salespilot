'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Package } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';

interface Props {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({ products, onEdit, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package size={40} className="mb-3 opacity-30" />
        <p>No products yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">SKU</th>
            <th className="pb-2 pr-4 font-medium">Category</th>
            <th className="pb-2 pr-4 font-medium text-right">Price</th>
            <th className="pb-2 pr-4 font-medium text-right">Stock</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 pr-4 font-medium">{p.name}</td>
              <td className="py-2 pr-4 text-muted-foreground">{p.sku || '—'}</td>
              <td className="py-2 pr-4 text-muted-foreground">{p.category?.name || '—'}</td>
              <td className="py-2 pr-4 text-right">
                {p.price.toLocaleString('en-US', { style: 'currency', currency: p.currency })}
              </td>
              <td className="py-2 pr-4 text-right">{p.stockCount}</td>
              <td className="py-2 pr-4">
                <Badge variant={p.isActive ? 'default' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="py-2">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${confirmId === p.id ? 'text-destructive' : ''}`}
                    onClick={() => handleDelete(p.id)}
                    title={confirmId === p.id ? 'Click again to confirm' : 'Delete'}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
