'use client';

import { useFieldArray, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface LineItemRow {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  currency?: string;
  fieldName?: string;
}

export function LineItemEditor({ control, watch, setValue, currency = 'USD', fieldName = 'items' }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: fieldName });
  const { data: products = [] } = useProducts();

  const items: LineItemRow[] = watch(fieldName) ?? [];

  const subtotal = items.reduce((sum, item) => {
    const t = Math.max(0, (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0));
    return sum + t;
  }, 0);

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency });

  const handleProductSelect = (idx: number, productId: string) => {
    if (!productId) return;
    const p = products.find((p) => p.id === productId);
    if (!p) return;
    setValue(`${fieldName}.${idx}.productId`, productId);
    setValue(`${fieldName}.${idx}.description`, p.name);
    setValue(`${fieldName}.${idx}.unitPrice`, p.price);
  };

  return (
    <div className="space-y-2">
      <div className="grid text-xs text-muted-foreground font-medium pb-1 border-b" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit Price</span>
        <span className="text-right">Discount</span>
        <span />
      </div>

      {fields.map((field, idx) => (
        <div key={field.id} className="grid gap-1 items-start" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
          <div className="space-y-1">
            {products.length > 0 && (
              <Select value={items[idx]?.productId ?? ''} onValueChange={(v) => handleProductSelect(idx, v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Pick product…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Custom</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              {...(control.register as (name: string) => object)(`${fieldName}.${idx}.description`)}
              placeholder="Description"
              className="h-7 text-xs"
            />
          </div>
          <Input
            {...(control.register as (name: string, opts: object) => object)(`${fieldName}.${idx}.quantity`, { valueAsNumber: true })}
            type="number"
            min="0.001"
            step="0.001"
            className="h-7 text-xs text-right"
          />
          <Input
            {...(control.register as (name: string, opts: object) => object)(`${fieldName}.${idx}.unitPrice`, { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            className="h-7 text-xs text-right"
          />
          <Input
            {...(control.register as (name: string, opts: object) => object)(`${fieldName}.${idx}.discount`, { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            className="h-7 text-xs text-right"
          />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(idx)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => append({ productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0 })}
        >
          <Plus size={13} className="mr-1" />
          Add Line
        </Button>
        <span className="text-sm font-medium">Subtotal: {fmt(subtotal)}</span>
      </div>
    </div>
  );
}
