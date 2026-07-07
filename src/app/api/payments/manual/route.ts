import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const Schema = z.object({
  invoiceId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  notes: z.string().max(500).optional(),
  payerEmail: z.string().email().optional().or(z.literal('')),
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

    const payment = await db.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          invoiceId: parsed.data.invoiceId,
          amount: parsed.data.amount,
          currency: parsed.data.currency,
          status: 'COMPLETED',
          provider: 'MANUAL',
          payerEmail: parsed.data.payerEmail || null,
          providerData: parsed.data.notes ? { notes: parsed.data.notes } : undefined,
        },
      });

      const newAmountPaid = Number(invoice.amountPaid) + parsed.data.amount;
      const newAmountDue = Math.max(0, Number(invoice.total) - newAmountPaid);
      const newStatus = newAmountDue <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : invoice.status;

      await tx.invoice.update({
        where: { id: parsed.data.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paidAt: newAmountDue <= 0 ? new Date() : undefined,
        },
      });

      return p;
    });

    return NextResponse.json({ ...payment, amount: Number(payment.amount) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
