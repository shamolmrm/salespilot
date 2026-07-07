import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';

// Must use raw body for signature verification — disable body parsing
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret || webhookSecret.includes('placeholder')) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Signature verification failed';
    console.error('Stripe webhook signature failed:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as unknown as {
        id: string;
        payment_status: string;
        metadata: { invoiceId?: string };
        amount_total: number | null;
        currency: string;
        customer_email: string | null;
        payment_intent: string | null;
      };

      if (session.payment_status !== 'paid') return NextResponse.json({ received: true });

      const invoiceId = session.metadata?.invoiceId ?? null;
      if (!invoiceId) return NextResponse.json({ received: true });

      await db.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findFirst({ where: { providerTxId: session.id } });
        const paidAmount = (session.amount_total ?? 0) / 100;
        const currency = session.currency.toUpperCase();

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'COMPLETED',
              payerEmail: session.customer_email,
              providerData: { paymentIntent: session.payment_intent },
            },
          });
        } else {
          await tx.payment.create({
            data: {
              invoiceId,
              amount: paidAmount,
              currency,
              status: 'COMPLETED',
              provider: 'STRIPE',
              providerTxId: session.id,
              payerEmail: session.customer_email,
              providerData: { paymentIntent: session.payment_intent },
            },
          });
        }

        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          const newAmountPaid = Number(invoice.amountPaid) + paidAmount;
          const newAmountDue = Math.max(0, Number(invoice.total) - newAmountPaid);
          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              amountPaid: newAmountPaid,
              amountDue: newAmountDue,
              status: newAmountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
              paidAt: newAmountDue <= 0 ? new Date() : undefined,
            },
          });
        }
      });
    }
  } catch (e) {
    console.error('Stripe webhook handler error:', e);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
