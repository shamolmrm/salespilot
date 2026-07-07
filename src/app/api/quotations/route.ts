import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateQuotationSchema } from '@/lib/validations/quotation';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('No token');
  return verifyAccessToken(token);
}

function computeTotals(items: { quantity: number; unitPrice: number; discount: number }[], discountType: string, headerDiscount: number, taxRate: number) {
  const itemsTotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice - item.discount;
    return sum + Math.max(0, lineTotal);
  }, 0);

  const disc = discountType === 'PERCENTAGE'
    ? itemsTotal * (headerDiscount / 100)
    : headerDiscount;
  const afterDiscount = Math.max(0, itemsTotal - disc);
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  return { subtotal: itemsTotal, discount: disc, taxAmount, total };
}

async function nextNumber(prefix: string, field: 'number') {
  const last = await db.quotation.findFirst({ orderBy: { createdAt: 'desc' }, select: { number: true } });
  const lastNum = last ? parseInt(last.number.replace(`${prefix}-`, '') || '0', 10) : 0;
  return `${prefix}-${String(lastNum + 1).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const rows = await db.quotation.findMany({
      where: { userId, status: (status as never) ?? undefined, customerId: customerId ?? undefined },
      include: { customer: { select: { id: true, firstName: true, lastName: true, email: true } }, items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows.map(r => ({ ...r, subtotal: Number(r.subtotal), discount: Number(r.discount), taxRate: Number(r.taxRate), taxAmount: Number(r.taxAmount), total: Number(r.total), exchangeRate: Number(r.exchangeRate), items: r.items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), discount: Number(i.discount), total: Number(i.total) })) })));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const body = await req.json();
    const parsed = CreateQuotationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { items, discountType, discount, taxRate, validUntil, ...rest } = parsed.data;
    const { subtotal, discount: computedDiscount, taxAmount, total } = computeTotals(
      items.map(i => ({ quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      discountType, discount, taxRate
    );
    const number = await nextNumber('QUO', 'number');

    const quotation = await db.quotation.create({
      data: {
        ...rest,
        userId,
        number,
        discountType,
        discount: computedDiscount,
        taxRate,
        taxAmount,
        subtotal,
        total,
        validUntil: validUntil ? new Date(validUntil) : null,
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
      include: { customer: { select: { id: true, firstName: true, lastName: true, email: true } }, items: { orderBy: { sortOrder: 'asc' } } },
    });
    return NextResponse.json(quotation, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
