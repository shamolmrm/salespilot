import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { UpdateInvoiceSchema } from '@/lib/validations/invoice';
import { serializeInvoice } from '@/lib/invoice-utils';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('No token');
  return verifyAccessToken(token);
}

function computeTotals(items: { quantity: number; unitPrice: number; discount: number }[], discountType: string, headerDiscount: number, taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + Math.max(0, i.quantity * i.unitPrice - i.discount), 0);
  const disc = discountType === 'PERCENTAGE' ? subtotal * (headerDiscount / 100) : headerDiscount;
  const afterDiscount = Math.max(0, subtotal - disc);
  const taxAmount = afterDiscount * (taxRate / 100);
  return { subtotal, discount: disc, taxAmount, total: afterDiscount + taxAmount };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const inv = await db.invoice.findFirst({
      where: { id, userId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serializeInvoice(inv as never));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const existing = await db.invoice.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = UpdateInvoiceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { items, discountType, discount, taxRate, dueDate, status, ...rest } = parsed.data;
    let totals = {};

    if (items) {
      const dt = discountType ?? String(existing.discountType);
      const disc = discount ?? Number(existing.discount);
      const tr = taxRate ?? Number(existing.taxRate);
      const comp = computeTotals(items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })), dt, disc, tr);
      totals = { ...comp, discountType: dt, taxRate: tr };
    }

    const inv = await db.$transaction(async (tx) => {
      if (items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceItem.createMany({
          data: items.map((item, idx) => ({
            invoiceId: id,
            productId: item.productId ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: Math.max(0, item.quantity * item.unitPrice - item.discount),
            sortOrder: idx,
          })),
        });
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: {
          ...rest,
          ...totals,
          status: (status as never) ?? undefined,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items: { orderBy: { sortOrder: 'asc' } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
      });

      // Recalculate amountDue after updating totals
      const paidAmt = Number(updated.amountPaid);
      const newTotal = Number(updated.total);
      return tx.invoice.update({
        where: { id },
        data: { amountDue: Math.max(0, newTotal - paidAmt) },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items: { orderBy: { sortOrder: 'asc' } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    return NextResponse.json(serializeInvoice(inv as never));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const existing = await db.invoice.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.invoice.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
