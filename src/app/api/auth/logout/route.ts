import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') ?? '';
    if (auth.startsWith('Bearer ')) {
      const payload = await verifyAccessToken(auth.slice(7));
      // Revoke all refresh tokens for this user
      await db.refreshToken.deleteMany({ where: { userId: payload.userId } });
    }
  } catch {
    // Ignore expired/invalid token — logout should always succeed
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('sp_at');
  return response;
}
