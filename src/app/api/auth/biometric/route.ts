import { NextRequest, NextResponse } from 'next/server';

// Called after successful biometric verification on the client
// Sets the same session cookie as PIN login
export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('auth');
  if (cookie?.value === process.env.PIN) {
    // Already authenticated — just return ok (cookie already set)
    return NextResponse.json({ ok: true });
  }
  // Set the cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', process.env.PIN!, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
