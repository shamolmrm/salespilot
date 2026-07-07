import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { refundPayPalCapture } from '@/lib/paypal';
import { z } from 'zod';

const Schema = z.object({
  amount: z.coerce.number().positive().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, role } = await verifyAccessToken(token) as { userId: string; role: string };

    // RBAC — only ADMIN and MANAGER can issue refunds
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden: only ADMIN and MANAGER can issue refunds' }, { status: 403 });
    }

    const { id } = await params;
    const payment = await db.payment.findFirst({
      where: { id },
      include: { invoice: true },
    });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // Verify invoice belongs to requesting user
    if (payment.invoice.userId !== userId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Only COMPLETED payments can be refunded' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const refundAmount = parsed.data.amount ?? Number(payment.amount);

    if (payment.provider === 'STRIPE') {
      const stripe = getStripe();
      const providerData = payment.providerData as { paymentIntent?: string } | null;
      const piId = providerData?.paymentIntent;
      if (!piId) return NextResponse.json({ error: 'No Stripe payment intent on record' }, { status: 400 });

      await stripe.refunds.create({
        payment_intent: piId,
        amount: Math.round(refundAmount * 100),
      });
    } else if (payment.provider === 'PAYPAL') {
      const providerData = payment.providerData as { captureId?: string } | null;
      const captureId = providerData?.captureId;
      if (!captureId) return NextResponse.json({ error: 'No PayPal capture ID on record' }, { status: 400 });
      await refundPayPalCapture(captureId, refundAmount, payment.currency);
    } else {
      // Manual payment — just record refund without external call
    }

    const newRefunded = (Number(payment.refundedAmount) ?? 0) + refundAmount;
    const isFullRefund = newRefunded >= Number(payment.amount);

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAmount: newRefunded,
          refundedAt: isFullRefund ? new Date() : undefined,
        },
      });

      if (isFullRefund) {
        const invoice = payment.invoice;
        const newAmountPaid = Math.max(0, Number(invoice.amountPaid) - refundAmount);
        const newAmountDue = Math.max(0, Number(invoice.total) - newAmountPaid);
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { amountPaid: newAmountPaid, amountDue: newAmountDue, status: newAmountDue >= Number(invoice.total) ? 'SENT' : 'PARTIALLY_PAID', paidAt: null },
        });
      }
    });

    return NextResponse.json({ ok: true, refundedAmount: newRefunded });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
