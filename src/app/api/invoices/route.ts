import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateInvoiceSchema } from '@/lib/validations/invoice';
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

async function nextInvoiceNumber() {
  const last = await db.invoice.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } });
  const n = last ? parseInt(last.number.replace('INV-', '') || '0', 10) : 0;
  return `INV-${String(n + 1).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const rows = await db.invoice.findMany({
      where: { userId, status: (status as never) ?? undefined },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows.map((r) => serializeInvoice(r as never)));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const body = await req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { items, discountType, discount, taxRate, dueDate, ...rest } = parsed.data;
    const { subtotal, discount: disc, taxAmount, total } = computeTotals(
      items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      discountType, discount, taxRate,
    );
    const number = await nextInvoiceNumber();

    const invoice = await db.invoice.create({
      data: {
        ...rest,
        userId,
        number,
        discountType,
        discount: disc,
        taxRate,
        taxAmount,
        subtotal,
        total,
        amountPaid: 0,
        amountDue: total,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map((item, idx) => ({
            productId: item.productId ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: Math.max(0, item.quantity * item.unitPrice - item.discount),
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
