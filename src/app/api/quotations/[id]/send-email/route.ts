import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePDF } from '@/lib/pdf';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const Schema = z.object({
  accountId: z.string().cuid(),
  smtpPassword: z.string().min(1),
  toEmail: z.string().email(),
  subject: z.string().min(1).max(254).regex(/^[^\r\n]+$/, 'No line breaks'),
  body: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await verifyAccessToken(token);
    const { id } = await params;

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const q = await db.quotation.findFirst({
      where: { id, userId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const account = await db.emailAccount.findFirst({ where: { id: parsed.data.accountId, userId } });
    if (!account) return NextResponse.json({ error: 'Email account not found' }, { status: 404 });

    const pdfBuffer = await generatePDF({
      type: 'QUOTATION',
      number: q.number,
      date: q.createdAt,
      validUntil: q.validUntil,
      status: q.status,
      currency: q.currency,
      items: q.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, total: i.total })),
      subtotal: q.subtotal,
      discount: q.discount,
      discountType: q.discountType,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      total: q.total,
      notes: q.notes,
      terms: q.terms,
    });

    await sendEmail(
      account,
      { smtpPassword: parsed.data.smtpPassword },
      parsed.data.toEmail,
      parsed.data.subject,
      parsed.data.body,
      'TEXT',
      [{ filename: `Quotation-${q.number}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    );

    await db.quotation.update({ where: { id }, data: { status: 'SENT' } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
