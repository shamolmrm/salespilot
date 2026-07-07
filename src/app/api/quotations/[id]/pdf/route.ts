import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePDF } from '@/lib/pdf';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await verifyAccessToken(token);
    const { id } = await params;

    const q = await db.quotation.findFirst({
      where: { id, userId },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pdfBuffer = await generatePDF({
      type: 'QUOTATION',
      number: q.number,
      date: q.createdAt,
      validUntil: q.validUntil,
      status: q.status,
      currency: q.currency,
      customerName: q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : undefined,
      customerEmail: q.customer?.email ?? undefined,
      customerPhone: q.customer?.phone ?? undefined,
      items: q.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        total: i.total,
      })),
      subtotal: q.subtotal,
      discount: q.discount,
      discountType: q.discountType,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      total: q.total,
      notes: q.notes,
      terms: q.terms,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation-${q.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
