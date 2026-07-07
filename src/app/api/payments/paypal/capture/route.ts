import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';
import { z } from 'zod';

const Schema = z.object({ orderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyAccessToken(token);

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const captured = await capturePayPalOrder(parsed.data.orderId) as {
      purchase_units?: { payments?: { captures?: { id: string; amount: { value: string; currency_code: string }; payer?: { email_address?: string } }[] } }[];
      payer?: { email_address?: string };
    };

    const capture = captured.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture) return NextResponse.json({ error: 'Capture data missing' }, { status: 400 });

    const payerEmail = captured.payer?.email_address ?? null;

    const payment = await db.payment.findFirst({ where: { providerTxId: parsed.data.orderId } });
    if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });

    const capturedAmount = parseFloat(capture.amount.value);

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          payerEmail,
          providerData: { captureId: capture.id },
        },
      });

      const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (invoice) {
        const newAmountPaid = Number(invoice.amountPaid) + capturedAmount;
        const newAmountDue = Math.max(0, Number(invoice.total) - newAmountPaid);
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newAmountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
            paidAt: newAmountDue <= 0 ? new Date() : undefined,
          },
        });
      }
    });

    return NextResponse.json({ ok: true, captureId: capture.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
