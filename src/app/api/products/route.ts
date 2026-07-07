import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateProductSchema } from '@/lib/validations/product';

async function getUserId(req: NextRequest) {
  const { userId } = await verifyAccessToken(req.headers.get('authorization')!.slice(7));
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    await getUserId(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const categoryId = searchParams.get('categoryId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const products = await db.product.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
        categoryId: categoryId ?? undefined,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(products.map(p => ({ ...p, price: Number(p.price) })));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await getUserId(req);
    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { imageUrl, ...data } = parsed.data;
    const product = await db.product.create({
      data: { ...data, imageUrl: imageUrl || null },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ ...product, price: Number(product.price) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
