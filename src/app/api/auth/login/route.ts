import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';
import { verifyPassword, signAccessToken, generateRefreshToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { allowed, retryAfterMs } = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in a few minutes.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });

    // Constant-time: always run verifyPassword even on unknown user to avoid timing attacks
    const dummyHash = '$2b$12$invalidhashpaddingtomatch.lengthxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const valid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, dummyHash).then(() => false);

    if (!user || !user.isActive || !valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const accessToken = await signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    const response = NextResponse.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set('sp_at', accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 900,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[login] error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    // Hide passwords from connection strings before showing to UI
    const safeMsg = msg.replace(/password=[^@\s]*/gi, 'password=***').slice(0, 300);

    if (msg.includes('ECONNREFUSED') || msg.includes('P1001') || msg.includes('P1017') || msg.includes('ENOTFOUND')) {
      return NextResponse.json({ error: `PostgreSQL সংযোগ ব্যর্থ।\nMake sure PostgreSQL is running on localhost:5432.\n\nError: ${safeMsg}` }, { status: 503 });
    }
    if (!process.env.DATABASE_URL || msg.includes('DATABASE_URL') || msg.includes('must start with the protocol')) {
      return NextResponse.json({ error: `DATABASE_URL সেট নেই বা ভুল আছে।\n.env ফাইল চেক করুন।\n\nError: ${safeMsg}` }, { status: 503 });
    }
    if (msg.includes('P2021') || msg.includes('does not exist') || msg.includes('relation') || msg.includes('P2010')) {
      return NextResponse.json({ error: `Database tables নেই।\nRun: npx prisma migrate deploy\nতারপর: npm run prisma:seed\n\nError: ${safeMsg}` }, { status: 503 });
    }
    // Return actual error so user/developer can see what's wrong
    return NextResponse.json({ error: `Server error: ${safeMsg}` }, { status: 500 });
  }
}
