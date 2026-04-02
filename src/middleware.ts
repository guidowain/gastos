import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/api/auth'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/api/')) {
    const cookie = req.cookies.get('auth');
    if (cookie?.value !== process.env.PIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*'] };
