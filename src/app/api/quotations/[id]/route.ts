import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { UpdateQuotationSchema } from '@/lib/validations/quotation';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('No token');
  return verifyAccessToken(token);
}

function computeTotals(
  items: { quantity: number; unitPrice: number; discount: number }[],
  discountType: string,
  headerDiscount: number,
  taxRate: number,
) {
  const subtotal = items.reduce((sum, i) => sum + Math.max(0, i.quantity * i.unitPrice - i.discount), 0);
  const disc = discountType === 'PERCENTAGE' ? subtotal * (headerDiscount / 100) : headerDiscount;
  const afterDiscount = Math.max(0, subtotal - disc);
  const taxAmount = afterDiscount * (taxRate / 100);
  return { subtotal, discount: disc, taxAmount, total: afterDiscount + taxAmount };
}

function serializeQuotation(r: Record<string, unknown> & { subtotal: unknown; discount: unknown; taxRate: unknown; taxAmount: unknown; total: unknown; exchangeRate: unknown; items?: unknown[] }) {
  return {
    ...r,
    subtotal: Number(r.subtotal),
    discount: Number(r.discount),
    taxRate: Number(r.taxRate),
    taxAmount: Number(r.taxAmount),
    total: Number(r.total),
    exchangeRate: Number(r.exchangeRate),
    items: (r.items as Record<string, unknown>[] | undefined)?.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      total: Number(i.total),
    })),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const q = await db.quotation.findFirst({
      where: { id, userId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serializeQuotation(q as never));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const existing = await db.quotation.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = UpdateQuotationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { items, discountType, discount, taxRate, validUntil, status, ...rest } = parsed.data;

    let totals = {};
    if (items) {
      const dt = discountType ?? String(existing.discountType);
      const disc = discount ?? Number(existing.discount);
      const tr = taxRate ?? Number(existing.taxRate);
      const computed = computeTotals(
        items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
        dt, disc, tr,
      );
      totals = { ...computed, discountType: dt, taxRate: tr };
    } else if (discount !== undefined || taxRate !== undefined || discountType !== undefined) {
      const allItems = await db.quotationItem.findMany({ where: { quotationId: id } });
      const dt = discountType ?? String(existing.discountType);
      const disc = discount ?? Number(existing.discount);
      const tr = taxRate ?? Number(existing.taxRate);
      const computed = computeTotals(
        allItems.map((i) => ({ quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), discount: Number(i.discount) })),
        dt, disc, tr,
      );
      totals = { ...computed, discountType: dt, taxRate: tr };
    }

    const q = await db.$transaction(async (tx) => {
      if (items) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        await tx.quotationItem.createMany({
          data: items.map((item, idx) => ({
            quotationId: id,
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
      return tx.quotation.update({
        where: { id },
        data: {
          ...rest,
          ...totals,
          status: (status as never) ?? undefined,
          validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return NextResponse.json(serializeQuotation(q as never));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const existing = await db.quotation.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.quotation.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
