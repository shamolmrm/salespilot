import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { UpdateProductSchema } from '@/lib/validations/product';

async function getUserId(req: NextRequest) {
  const { userId } = await verifyAccessToken(req.headers.get('authorization')!.slice(7));
  return userId;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getUserId(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { imageUrl, ...data } = parsed.data;
    const product = await db.product.update({
      where: { id },
      data: { ...data, ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}) },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ ...product, price: Number(product.price) });
  } catch {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getUserId(req);
    const { id } = await params;
    await db.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }
}
