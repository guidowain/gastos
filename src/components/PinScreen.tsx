'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PinScreen.module.css';

export default function PinScreen() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    setTimeout(() => inputRefs[0].current?.focus(), 100);
  }, []);

  async function submit(pin: string) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      router.push('/nuevo-gasto');
    } else {
      setShake(true);
      setError(true);
      setDigits(['', '', '', '']);
      setTimeout(() => {
        setShake(false);
        inputRefs[0].current?.focus();
      }, 500);
    }
  }

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    setError(false);
    if (digit && i < 3) {
      inputRefs[i + 1].current?.focus();
    }
    if (digit && i === 3) {
      submit([...next.slice(0, 3), digit].join(''));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits];
        next[i] = '';
        setDigits(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = '';
        setDigits(next);
        inputRefs[i - 1].current?.focus();
      }
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${shake ? styles.shake : ''}`}>
        <div className={styles.title}>Gastos</div>
        <p className={styles.label}>Ingresá tu PIN</p>
        <div className={styles.inputs}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              className={`${styles.digit} ${error ? styles.digitError : ''} ${d ? styles.digitFilled : ''}`}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoComplete="off"
            />
          ))}
        </div>
        {error && <p className={styles.errorMsg}>PIN incorrecto</p>}
      </div>
    </div>
  );
}
