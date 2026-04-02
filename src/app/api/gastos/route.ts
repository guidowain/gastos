import { NextRequest, NextResponse } from 'next/server';
import { readSheet, appendRow, parseNum } from '@/lib/sheets';

export async function GET() {
  try {
    const [raw, categorias, mensuales] = await Promise.all([
      readSheet('Gastos RAW!A:D'),
      readSheet('Gastos CATEGORÍAS!A:C'),
      readSheet('Gastos MENSUALES!A:B'),
    ]);

    // raw: skip header row
    const gastos = raw.slice(1).map((row, i) => ({
      rowIndex: i + 2,
      fecha: row[0] || '',
      categoria: row[1] || '',
      subcategoria: row[2] || '',
      monto: parseNum(row[3]),
    })).filter(g => g.fecha);

    // categorias: skip header
    const porCategoria = categorias.slice(1).map(row => ({
      mes: row[0] || '',
      categoria: row[1] || '',
      total: parseNum(row[2]),
    }));

    // mensuales: skip header
    const porMes = mensuales.slice(1).map(row => ({
      mes: row[0] || '',
      total: parseNum(row[1]),
    }));

    return NextResponse.json({ gastos, porCategoria, porMes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al leer sheet' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fecha, categoria, subcategoria, monto } = await req.json();
    if (!fecha || !categoria || !monto) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }
    await appendRow('Gastos RAW', [fecha, categoria, subcategoria || '', parseFloat(monto)]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al escribir' }, { status: 500 });
  }
}
