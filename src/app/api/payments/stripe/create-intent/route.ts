import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { z } from 'zod';

const Schema = z.object({
  invoiceId: z.string().cuid(),
});

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

    const stripe = getStripe();

    // Create Stripe Checkout Session (hosted payment page, most secure for desktop)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: Math.round(Number(invoice.amountDue) * 100),
          product_data: { name: `Invoice ${invoice.number}` },
        },
        quantity: 1,
      }],
      metadata: { invoiceId: invoice.id, userId },
      success_url: `${process.env.APP_BASE_URL}/payments?stripe_success=1&invoice=${invoice.id}`,
      cancel_url: `${process.env.APP_BASE_URL}/invoices/${invoice.id}`,
    });

    // Store pending payment record — will be updated via webhook
    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: Number(invoice.amountDue),
        currency: invoice.currency,
        status: 'PENDING',
        provider: 'STRIPE',
        providerTxId: session.id,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
