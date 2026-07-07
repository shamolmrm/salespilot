import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateCategorySchema } from '@/lib/validations/product';

async function getUserId(req: NextRequest) {
  const { userId } = await verifyAccessToken(req.headers.get('authorization')!.slice(7));
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    await getUserId(req);
    const categories = await db.productCategory.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await getUserId(req);
    const body = await req.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const category = await db.productCategory.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized or duplicate name' }, { status: 400 });
  }
}
