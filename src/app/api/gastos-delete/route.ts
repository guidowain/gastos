import { NextRequest, NextResponse } from 'next/server';
import { deleteRow } from '@/lib/sheets';

// Sheet ID for "Gastos RAW" — needs to be the numeric gid from the sheet URL
// Default 0 if it's the first sheet; update if needed
const GASTOS_RAW_SHEET_ID = 0;

export async function POST(req: NextRequest) {
  try {
    const { row } = await req.json();
    if (!row) return NextResponse.json({ error: 'Falta row' }, { status: 400 });
    await deleteRow(GASTOS_RAW_SHEET_ID, row);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al borrar' }, { status: 500 });
  }
}
