'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PinScreen.module.css';

async function loginWithPin(pin: string): Promise<boolean> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return res.ok;
}

// WebAuthn helpers
async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function base64url(buffer: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64url(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer as ArrayBuffer;
}

async function registerBiometric(): Promise<boolean> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Gastos', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode('guido'),
          name: 'guido',
          displayName: 'Guido',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;
    if (!credential) return false;
    // Store credential id for later use
    localStorage.setItem('bio_cred_id', base64url((credential as PublicKeyCredential).rawId));
    localStorage.setItem('bio_registered', '1');
    return true;
  } catch {
    return false;
  }
}

async function authenticateBiometric(): Promise<boolean> {
  try {
    const credId = localStorage.getItem('bio_cred_id');
    if (!credId) return false;
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        allowCredentials: [{ id: fromBase64url(credId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioRegistered, setBioRegistered] = useState(false);
  const [showRegisterBio, setShowRegisterBio] = useState(false);
  const router = useRouter();

  useEffect(() => {
    isBiometricAvailable().then(ok => {
      setBioAvailable(ok);
      if (ok) {
        const registered = !!localStorage.getItem('bio_registered');
        setBioRegistered(registered);
        // Auto-trigger biometric if already registered
        if (registered) triggerBiometric();
      }
    });
  }, []);

  async function triggerBiometric() {
    setLoading(true);
    const ok = await authenticateBiometric();
    if (ok) {
      // Biometric OK — login with PIN silently
      const pinStored = localStorage.getItem('bio_pin') || '';
      const loginOk = await loginWithPin(pinStored);
      if (loginOk) { router.push('/nuevo-gasto'); return; }
    }
    setLoading(false);
  }

  async function handleDigit(d: string) {
    if (pin.length >= 4 || loading) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setLoading(true);
      const ok = await loginWithPin(next);
      if (ok) {
        // After PIN success, offer to register biometric if available and not yet registered
        if (bioAvailable && !bioRegistered) {
          localStorage.setItem('bio_pin', next);
          setShowRegisterBio(true);
          setLoading(false);
        } else {
          router.push('/nuevo-gasto');
        }
      } else {
        setError(true);
        setPin('');
        setLoading(false);
      }
    }
  }

  async function handleRegisterBio() {
    const ok = await registerBiometric();
    if (ok) setBioRegistered(true);
    router.push('/nuevo-gasto');
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1));
    setError(false);
  }

  // Offer biometric registration after first PIN success
  if (showRegisterBio) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.title}>Gastos</div>
          <div className={styles.bioPrompt}>
            <div className={styles.bioIcon}>
              {/iPhone|iPad|iPod/.test(navigator.userAgent) ? '👤' : '☝️'}
            </div>
            <p className={styles.bioText}>
              ¿Activar Face ID / Touch ID para la próxima vez?
            </p>
          </div>
          <div className={styles.bioActions}>
            <button className={styles.bioYes} onClick={handleRegisterBio}>Activar</button>
            <button className={styles.bioNo} onClick={() => router.push('/nuevo-gasto')}>Ahora no</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>Gastos</div>

        <div className={`${styles.dots} ${error ? styles.shake : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`${styles.dot} ${pin.length > i ? styles.filled : ''} ${error ? styles.errorDot : ''}`} />
          ))}
        </div>

        {error && <div className={styles.errorMsg}>PIN incorrecto</div>}

        <div className={styles.pad}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              className={`${styles.key} ${d === '' ? styles.empty : ''}`}
              onClick={() => d === '⌫' ? handleDelete() : d !== '' ? handleDigit(d) : null}
              disabled={loading}
            >
              {d}
            </button>
          ))}
        </div>

        {bioAvailable && bioRegistered && (
          <button className={styles.bioBtn} onClick={triggerBiometric} disabled={loading}>
            {/iPhone|iPad|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? '👤 Face ID' : '☝️ Touch ID'}
          </button>
        )}
      </div>
    </div>
  );
}
