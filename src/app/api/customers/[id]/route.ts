import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UpdateCustomerSchema } from '@/lib/validations/customer';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, ...rest } = parsed.data;

  const customer = await db.customer.update({
    where: { id },
    data: {
      ...rest,
      email: rest.email ?? undefined,
      phone: rest.phone ?? undefined,
      notes: rest.notes ?? undefined,
      companyId: companyId !== undefined ? companyId || null : undefined,
    },
    include: {
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.customer.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
