import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPayPalOrder } from '@/lib/paypal';
import { z } from 'zod';

const Schema = z.object({ invoiceId: z.string().cuid() });

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await verifyAccessToken(token);

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const invoice = await db.invoice.findFirst({ where: { id: parsed.data.invoiceId, userId } });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (Number(invoice.amountDue) <= 0) return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });

    const order = await createPayPalOrder(invoice.id, Number(invoice.amountDue), invoice.currency);

    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: Number(invoice.amountDue),
        currency: invoice.currency,
        status: 'PENDING',
        provider: 'PAYPAL',
        providerTxId: order.id,
      },
    });

    const approvalUrl = order.links.find((l) => l.rel === 'approve')?.href;
    return NextResponse.json({ orderId: order.id, approvalUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
