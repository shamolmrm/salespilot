import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { serializeInvoice } from '@/lib/invoice-utils';

async function nextInvoiceNumber() {
  const last = await db.invoice.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } });
  const n = last ? parseInt(last.number.replace('INV-', '') || '0', 10) : 0;
  return `INV-${String(n + 1).padStart(4, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await verifyAccessToken(token);

    const { quotationId } = await req.json() as { quotationId: string };
    if (!quotationId) return NextResponse.json({ error: 'quotationId required' }, { status: 400 });

    const q = await db.quotation.findFirst({
      where: { id: quotationId, userId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

    const number = await nextInvoiceNumber();
    const invoice = await db.invoice.create({
      data: {
        userId,
        number,
        quotationId: q.id,
        customerId: q.customerId,
        currency: q.currency,
        exchangeRate: q.exchangeRate,
        discountType: q.discountType,
        discount: q.discount,
        taxRate: q.taxRate,
        taxAmount: q.taxAmount,
        subtotal: q.subtotal,
        total: q.total,
        amountPaid: 0,
        amountDue: q.total,
        notes: q.notes,
        terms: q.terms,
        items: {
          create: q.items.map((item, idx) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            sortOrder: idx,
          })),
        },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: true,
      },
    });

    return NextResponse.json(serializeInvoice(invoice as never), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
