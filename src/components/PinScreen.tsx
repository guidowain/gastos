'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PinScreen.module.css'

const BIOMETRIC_REGISTERED_KEY = 'gastos_bio_registered'
const WEBAUTHN_CRED_KEY = 'gastos_webauthn_id'

export default function PinScreen() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'pin' | 'offer_biometric'>('pin')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const router = useRouter()

  useEffect(() => {
    refs[0].current?.focus()
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
        setBiometricAvailable(available)
        if (available) {
          const registered = !!localStorage.getItem(BIOMETRIC_REGISTERED_KEY)
          setBiometricRegistered(registered)
          if (registered) setTimeout(() => triggerBiometric(), 400)
        }
      })
    }
  }, [])

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...digits]
    next[i] = val.slice(-1)
    setDigits(next)
    setError(false)
    if (val && i < 3) refs[i + 1].current?.focus()
    if (i === 3 && val) submitPin([...next.slice(0, 3), val])
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus()
  }

  const submitPin = async (d: string[]) => {
    const pin = d.join('')
    if (pin.length < 4) return
    setLoading(true)
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.ok) {
      if (biometricAvailable && !biometricRegistered) {
        setStep('offer_biometric')
        setLoading(false)
      } else {
        router.push('/nuevo-gasto')
      }
    } else {
      setError(true)
      setDigits(['', '', '', ''])
      setLoading(false)
      setTimeout(() => refs[0].current?.focus(), 50)
    }
  }

  const registerBiometric = async () => {
    setLoading(true)
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Gastos', id: window.location.hostname },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'guido',
            displayName: 'Guido',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null
      if (credential) {
        localStorage.setItem(BIOMETRIC_REGISTERED_KEY, '1')
        localStorage.setItem(WEBAUTHN_CRED_KEY, credential.id)
      }
    } catch {
      // usuario canceló
    } finally {
      setLoading(false)
      router.push('/nuevo-gasto')
    }
  }

  const triggerBiometric = async () => {
    const credId = localStorage.getItem(WEBAUTHN_CRED_KEY)
    if (!credId) {
      localStorage.removeItem(BIOMETRIC_REGISTERED_KEY)
      setBiometricRegistered(false)
      return
    }
    setLoading(true)
    try {
      const idBytes = Uint8Array.from(
        atob(credId.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      )
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          allowCredentials: [{ type: 'public-key', id: idBytes, transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null
      if (assertion) {
        const res = await fetch('/api/auth/biometric', { method: 'POST' })
        const data = await res.json()
        if (data.ok) {
          router.push('/nuevo-gasto')
          return
        }
      }
    } catch (e: any) {
      if (e.name !== 'NotAllowedError') {
        localStorage.removeItem(BIOMETRIC_REGISTERED_KEY)
        localStorage.removeItem(WEBAUTHN_CRED_KEY)
        setBiometricRegistered(false)
      }
    }
    setLoading(false)
  }

  if (step === 'offer_biometric') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.bioIcon}>
            <FaceIDIcon size={36} />
          </div>
          <h1 className={styles.title}>Activar biometría</h1>
          <p className={styles.subCenter}>
            La próxima vez podés entrar con Face ID o huella, sin tipear el PIN.
          </p>
          <button className={styles.biometricBtn} onClick={registerBiometric} disabled={loading}>
            {loading ? 'Activando...' : 'Activar Face ID / Huella'}
          </button>
          <button className={styles.skipBtn} onClick={() => router.push('/nuevo-gasto')}>
            Ahora no
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Gastos</h1>
        {biometricRegistered && (
          <button className={styles.biometricBtn} onClick={triggerBiometric} disabled={loading}>
            <FaceIDIcon size={18} />
            <span>Face ID / Huella</span>
          </button>
        )}
        <p className={styles.sub}>
          {biometricRegistered ? 'o ingresá tu PIN' : 'Ingresá tu PIN'}
        </p>
        <div className={styles.inputs}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`${styles.digit} ${error ? styles.digitError : ''}`}
              autoComplete="off"
            />
          ))}
        </div>
        {error && <p className={styles.errorMsg}>PIN incorrecto</p>}
      </div>
    </div>
  )
}

function FaceIDIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 9h.01M15 9h.01M8 13s1 2 4 2 4-2 4-2"/>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
    </svg>
  )
}
