import { NextRequest, NextResponse } from 'next/server';
import { RefreshSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';
import { signAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RefreshSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { refreshToken } = parsed.data;

  const stored = await db.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
    return NextResponse.json({ error: 'Refresh token invalid or expired' }, { status: 401 });
  }

  const accessToken = await signAccessToken({
    userId: stored.user.id,
    role: stored.user.role,
  });

  const response = NextResponse.json({
    accessToken,
    user: {
      id: stored.user.id,
      name: stored.user.name,
      email: stored.user.email,
      role: stored.user.role,
    },
  });

  response.cookies.set('sp_at', accessToken, {
    httpOnly: false,
    secure: false,
    sameSite: 'strict',
    maxAge: 900,
    path: '/',
  });

  return response;
}
