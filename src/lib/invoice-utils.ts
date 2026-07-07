export function serializeInvoice(r: Record<string, unknown>) {
  const toNum = (v: unknown) => Number(v);
  return {
    ...r,
    subtotal: toNum(r.subtotal),
    discount: toNum(r.discount),
    taxRate: toNum(r.taxRate),
    taxAmount: toNum(r.taxAmount),
    total: toNum(r.total),
    exchangeRate: toNum(r.exchangeRate),
    amountPaid: toNum(r.amountPaid),
    amountDue: toNum(r.amountDue),
    items: (r.items as Record<string, unknown>[] | undefined)?.map((i) => ({
      ...i,
      quantity: toNum(i.quantity),
      unitPrice: toNum(i.unitPrice),
      discount: toNum(i.discount),
      total: toNum(i.total),
    })),
    payments: (r.payments as Record<string, unknown>[] | undefined)?.map((p) => ({
      ...p,
      amount: toNum(p.amount),
      refundedAmount: toNum(p.refundedAmount),
    })),
  };
}
