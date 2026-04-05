'use client';
import { useState, useEffect, useMemo } from 'react';
import { CATEGORIAS } from '@/lib/categorias';
import styles from './dashboard.module.css';

type Gasto = {
  rowIndex: number;
  fecha: string;
  categoria: string;
  subcategoria: string;
  monto: number;
};

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const MONTH_PARSER: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

function getMesActual() {
  const d = new Date(); const m = d.toLocaleDateString("es-AR", { month: "long" }); return m.charAt(0).toUpperCase() + m.slice(1) + " " + d.getFullYear();
}

function labelFromFecha(fecha: string): string | null {
  const parts = fecha.split('/');
  if (parts.length !== 3) return null;
  const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const m2 = d.toLocaleDateString("es-AR", { month: "long" }); return m2.charAt(0).toUpperCase() + m2.slice(1) + " " + d.getFullYear();
}

function sortMeses(meses: string[]): string[] {
  return [...meses].sort((a, b) => {
    const parse = (s: string) => {
      const [m, , y] = s.toLowerCase().split(' ');
      return new Date(+y, MONTH_PARSER[m] ?? 0).getTime();
    };
    return parse(b) - parse(a);
  });
}

function getCatColor(nombre: string) {
  return CATEGORIAS.find(c => c.nombre === nombre)?.color || '#888';
}

function getCatEmoji(nombre: string) {
  return CATEGORIAS.find(c => c.nombre === nombre)?.emoji || 'MONEY_WITH_WINGS';
}

export default function DashboardClient() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(getMesActual());
  const [deletingRow, setDeletingRow] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/gastos')
      .then(r => r.json())
      .then(d => {
        setGastos(d.gastos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    set.add(getMesActual());
    gastos.forEach(g => {
      if (g.fecha) {
        const label = labelFromFecha(g.fecha);
        if (label) set.add(label);
      }
    });
    return sortMeses(Array.from(set));
  }, [gastos]);

  const gastosMes = useMemo(() => {
    return gastos.filter(g => {
      if (!g.fecha) return false;
      return labelFromFecha(g.fecha) === selectedMes;
    });
  }, [gastos, selectedMes]);

  const totalMes = useMemo(() => gastosMes.reduce((acc, g) => acc + g.monto, 0), [gastosMes]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    gastosMes.forEach(g => {
      map.set(g.categoria, (map.get(g.categoria) || 0) + g.monto);
    });
    return Array.from(map.entries())
      .map(([cat, total]) => ({ cat, total }))
      .sort((a, b) => b.total - a.total);
  }, [gastosMes]);

  const isCurrentMonth = selectedMes === getMesActual();

  // Promedio diario sin Casa — solo mes actual
  const promedioDiario = useMemo(() => {
    if (!isCurrentMonth) return null;
    const hoy = new Date();
    const diasTranscurridos = hoy.getDate(); // día del mes actual (1-31)
    const totalSinCasa = gastosMes
      .filter(g => g.categoria !== 'Casa')
      .reduce((acc, g) => acc + g.monto, 0);
    return totalSinCasa / diasTranscurridos;
  }, [gastosMes, isCurrentMonth]);

  async function borrarGasto(rowIndex: number) {
    setDeletingRow(rowIndex);
    try {
      await fetch('/api/gastos-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: rowIndex }),
      });
      setGastos(prev => prev.filter(g => g.rowIndex !== rowIndex));
    } catch {
      // silent fail
    }
    setDeletingRow(null);
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.monthBar}>
        <select
          className={styles.monthSelect}
          value={selectedMes}
          onChange={e => setSelectedMes(e.target.value)}
        >
          {mesesDisponibles.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className={styles.totalCard}>
        <div className={styles.totalLabel}>Total del mes</div>
        <div className={styles.totalAmount}>{formatARS(totalMes)}</div>

        {promedioDiario !== null && (
          <div className={styles.promedio}>
            Promedio de gasto por día: <strong>{formatARS(Math.round(promedioDiario))}</strong>
          </div>
        )}
      </div>

      {porCategoria.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Por categoría</h3>
          </div>
          <div className={styles.catList}>
            {porCategoria.map(({ cat, total }) => {
              const pct = totalMes > 0 ? (total / totalMes) * 100 : 0;
              return (
                <div key={cat} className={styles.catRow}>
                  <div className={styles.catRowLeft}>
                    <span className={styles.catRowEmoji}>{getCatEmoji(cat)}</span>
                    <span className={styles.catRowName}>{cat}</span>
                  </div>
                  <div className={styles.catRowRight}>
                    <div className={styles.catBar}>
                      <div
                        className={styles.catBarFill}
                        style={{ width: `${pct}%`, background: getCatColor(cat) }}
                      />
                    </div>
                    <span className={styles.catRowAmount}>{formatARS(total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gastosMes.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Todos los gastos</h3>
          </div>
          <div className={styles.gastosList}>
            {[...gastosMes].reverse().map(g => (
              <GastoRow
                key={g.rowIndex}
                gasto={g}
                onDelete={() => borrarGasto(g.rowIndex)}
                deleting={deletingRow === g.rowIndex}
              />
            ))}
          </div>
        </div>
      )}

      {gastosMes.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💸</div>
          <div className={styles.emptyText}>Sin gastos en {selectedMes}</div>
        </div>
      )}
    </div>
  );
}

function GastoRow({
  gasto,
  onDelete,
  deleting,
}: {
  gasto: Gasto;
  onDelete: () => void;
  deleting: boolean;
}) {
  const color = getCatColor(gasto.categoria);
  const emoji = getCatEmoji(gasto.categoria);

  return (
    <div className={`${styles.gastoRow} ${deleting ? styles.deleting : ''}`}>
      <div className={styles.gastoIcon} style={{ background: color + '22', color }}>
        {emoji}
      </div>
      <div className={styles.gastoInfo}>
        <div className={styles.gastoCat}>
          {gasto.categoria}
          {gasto.subcategoria && <span className={styles.gastoSub}> · {gasto.subcategoria}</span>}
        </div>
        <div className={styles.gastoDate}>{gasto.fecha}</div>
      </div>
      <div className={styles.gastoRight}>
        <div className={styles.gastoMonto}>{formatARS(gasto.monto)}</div>
        <button
          className={styles.deleteBtn}
          onClick={onDelete}
          disabled={deleting}
          title="Borrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
