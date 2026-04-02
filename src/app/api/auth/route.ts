import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (pin !== process.env.PIN) {
    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', pin, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('auth');
  return res;
}
