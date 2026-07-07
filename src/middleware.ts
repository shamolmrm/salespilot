import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    const auth = request.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await jwtVerify(auth.slice(7), secret);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 });
    }
  }

  const token = request.cookies.get('sp_at')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('sp_at');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
