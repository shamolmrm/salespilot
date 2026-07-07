import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || webhookId.includes('placeholder')) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  ['paypal-transmission-id', 'paypal-transmission-time', 'paypal-cert-url', 'paypal-auth-algo', 'paypal-transmission-sig'].forEach((h) => {
    const val = req.headers.get(h);
    if (val) headers[h] = val;
  });

  const isValid = await verifyPayPalWebhook(webhookId, headers, rawBody);
  if (!isValid) {
    console.error('PayPal webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as { event_type: string; resource: Record<string, unknown> };

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource as { id: string; amount: { value: string; currency_code: string }; supplementary_data?: { related_ids?: { order_id?: string } } };
      const orderId = resource.supplementary_data?.related_ids?.order_id;

      if (orderId) {
        const payment = await db.payment.findFirst({ where: { providerTxId: orderId } });
        if (payment && payment.status !== 'COMPLETED') {
          const capturedAmount = parseFloat(resource.amount.value);
          await db.$transaction(async (tx) => {
            await tx.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED', providerData: { captureId: resource.id } } });
            const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
            if (invoice) {
              const newAmountPaid = Number(invoice.amountPaid) + capturedAmount;
              const newAmountDue = Math.max(0, Number(invoice.total) - newAmountPaid);
              await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: newAmountPaid, amountDue: newAmountDue, status: newAmountDue <= 0 ? 'PAID' : 'PARTIALLY_PAID', paidAt: newAmountDue <= 0 ? new Date() : undefined } });
            }
          });
        }
      }
    }
  } catch (e) {
    console.error('PayPal webhook handler error:', e);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
