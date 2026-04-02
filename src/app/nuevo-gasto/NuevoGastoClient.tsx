'use client';
import { useState, useRef, useEffect } from 'react';
import { CATEGORIAS } from '@/lib/categorias';
import styles from './nuevo-gasto.module.css';

type Step = 'categoria' | 'subcategoria' | 'monto';

export default function NuevoGastoClient() {
  const [step, setStep] = useState<Step>('categoria');
  const [categoria, setCategoria] = useState<string>('');
  const [categoriaColor, setCategoriaColor] = useState<string>('');
  const [subcategoria, setSubcategoria] = useState<string>('');
  const [customSub, setCustomSub] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [monto, setMonto] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const montoRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const catData = CATEGORIAS.find(c => c.nombre === categoria);
  const subs = catData?.subcategorias || [];

  useEffect(() => {
    if (step === 'monto') setTimeout(() => montoRef.current?.focus(), 100);
  }, [step]);

  useEffect(() => {
    if (showCustom) setTimeout(() => customRef.current?.focus(), 100);
  }, [showCustom]);

  function selectCategoria(nombre: string, color: string) {
    setCategoria(nombre);
    setCategoriaColor(color);
    setSubcategoria('');
    setCustomSub('');
    setShowCustom(false);
    const cat = CATEGORIAS.find(c => c.nombre === nombre);
    if (!cat || cat.subcategorias.length === 0) {
      setStep('monto');
    } else {
      setStep('subcategoria');
    }
  }

  function selectSub(s: string) {
    setSubcategoria(s);
    setShowCustom(false);
    setStep('monto');
  }

  function handleCustomSub() {
    if (customSub.trim()) {
      setSubcategoria(customSub.trim());
      setStep('monto');
    }
  }

  function back() {
    if (step === 'subcategoria') { setStep('categoria'); setCategoria(''); }
    if (step === 'monto') {
      if (subs.length === 0) setStep('categoria');
      else { setStep('subcategoria'); setSubcategoria(''); setShowCustom(false); }
    }
    setError('');
  }

  async function guardar() {
    const n = parseFloat(monto.replace(',', '.'));
    if (!n || n <= 0) { setError('Ingresá un monto válido'); return; }
    setSaving(true);
    setError('');
    const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, categoria, subcategoria: subcategoria || '', monto: n }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setStep('categoria');
        setCategoria('');
        setCategoriaColor('');
        setSubcategoria('');
        setCustomSub('');
        setMonto('');
        setSaving(false);
      }, 1200);
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className={styles.savedWrap}>
        <div className={styles.savedIcon}>✓</div>
        <div className={styles.savedText}>Guardado</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        {step !== 'categoria' && (
          <button className={styles.backBtn} onClick={back}>←</button>
        )}
        <div className={styles.breadcrumb}>
          {categoria && (
            <span className={styles.crumbItem} style={{ color: categoriaColor }}>
              {catData?.emoji} {categoria}
            </span>
          )}
          {subcategoria && (
            <>
              <span className={styles.crumbSep}>·</span>
              <span className={styles.crumbItem}>{subcategoria}</span>
            </>
          )}
        </div>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${step === 'categoria' || step === 'subcategoria' || step === 'monto' ? styles.stepDone : ''}`} />
          <div className={`${styles.stepDot} ${step === 'subcategoria' || step === 'monto' ? styles.stepDone : ''}`} style={{ opacity: subs.length > 0 ? 1 : 0.2 }} />
          <div className={`${styles.stepDot} ${step === 'monto' ? styles.stepDone : ''}`} />
        </div>
      </div>

      {/* Step: Categoría */}
      {step === 'categoria' && (
        <div className={styles.stepWrap}>
          <h2 className={styles.stepTitle}>¿Qué gastaste?</h2>
          <div className={styles.catGrid}>
            {CATEGORIAS.map(c => (
              <button
                key={c.nombre}
                className={styles.catBtn}
                style={{ '--cat-color': c.color } as React.CSSProperties}
                onClick={() => selectCategoria(c.nombre, c.color)}
              >
                <span className={styles.catEmoji}>{c.emoji}</span>
                <span className={styles.catName}>{c.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Subcategoría */}
      {step === 'subcategoria' && (
        <div className={styles.stepWrap}>
          <h2 className={styles.stepTitle}>¿En qué?</h2>
          <div className={styles.subList}>
            {subs.map(s => (
              <button
                key={s}
                className={styles.subBtn}
                style={{ '--cat-color': categoriaColor } as React.CSSProperties}
                onClick={() => selectSub(s)}
              >
                {s}
              </button>
            ))}
            {!showCustom ? (
              <button className={`${styles.subBtn} ${styles.subBtnOther}`} onClick={() => setShowCustom(true)}>
                ✏️ Otra
              </button>
            ) : (
              <div className={styles.customWrap}>
                <input
                  ref={customRef}
                  className={styles.customInput}
                  placeholder="Escribí la subcategoría..."
                  value={customSub}
                  onChange={e => setCustomSub(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomSub()}
                />
                <button
                  className={styles.customConfirm}
                  style={{ background: categoriaColor }}
                  onClick={handleCustomSub}
                  disabled={!customSub.trim()}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Monto */}
      {step === 'monto' && (
        <div className={styles.stepWrap}>
          <h2 className={styles.stepTitle}>¿Cuánto?</h2>
          <div className={styles.montoWrap}>
            <span className={styles.montoPrefix}>$</span>
            <input
              ref={montoRef}
              className={styles.montoInput}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={monto}
              onChange={e => { setMonto(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && guardar()}
            />
          </div>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <div className={styles.quickAmounts}>
            {[500, 1000, 2000, 5000, 10000].map(a => (
              <button
                key={a}
                className={styles.quickBtn}
                onClick={() => setMonto(String(a))}
              >
                ${a.toLocaleString('es-AR')}
              </button>
            ))}
          </div>
          <button
            className={styles.guardarBtn}
            style={{ background: categoriaColor || 'var(--accent)' }}
            onClick={guardar}
            disabled={saving || !monto}
          >
            {saving ? 'Guardando...' : 'Guardar gasto'}
          </button>
        </div>
      )}
    </div>
  );
}
