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

    const inv = await db.invoice.findFirst({
      where: { id, userId },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pdfBuffer = await generatePDF({
      type: 'INVOICE',
      number: inv.number,
      date: inv.createdAt,
      dueDate: inv.dueDate,
      status: inv.status,
      currency: inv.currency,
      customerName: inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : undefined,
      customerEmail: inv.customer?.email ?? undefined,
      customerPhone: inv.customer?.phone ?? undefined,
      items: inv.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        total: i.total,
      })),
      subtotal: inv.subtotal,
      discount: inv.discount,
      discountType: inv.discountType,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      total: inv.total,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      notes: inv.notes,
      terms: inv.terms,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${inv.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
