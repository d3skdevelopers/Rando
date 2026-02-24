'use client'

import { useState } from 'react'
import { GraduationCap, Loader2, CheckCircle } from 'lucide-react'
import { studentEmailSchema } from '@/lib/validators'

type Stage = 'email' | 'code' | 'done'

export function StudentVerification() {
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    const validation = studentEmailSchema.safeParse(email)
    if (!validation.success) { setError(validation.error.errors[0].message); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/verify/student', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send code'); return }
      setStage('code')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const handleVerifyCode = async () => {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/verify/student', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Invalid code'); return }
      setStage('done')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ padding: '10px', background: 'rgba(124,58,237,0.15)', borderRadius: '8px', flexShrink: 0 }}>
          {stage === 'done'
            ? <CheckCircle size={20} color="#22c55e" />
            : <GraduationCap size={20} color="#a78bfa" />}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#f0f0f0', fontFamily: "'Georgia', serif" }}>Student Verification</h3>
          <p style={{ fontSize: '13px', color: '#8080a0', marginBottom: '16px' }}>
            Verify your student email to unlock Premium free.
          </p>

          {stage === 'done' ? (
            <p style={{ fontSize: '14px', color: '#22c55e' }}>✓ Verified! Your account has been upgraded to Student Premium.</p>
          ) : stage === 'email' ? (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your.name@university.edu"
                  style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#f0f0f0', fontSize: '14px', outline: 'none' }}
                />
                <button onClick={handleSendCode} disabled={loading || !email}
                  style={{ padding: '10px 18px', background: loading || !email ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading || !email ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Send Code
                </button>
              </div>
              {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
            </>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: '#8080a0', marginBottom: '10px' }}>
                Code sent to {email}.{' '}
                <button onClick={() => setStage('email')} style={{ background: 'none', border: 'none', color: '#a78bfa', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Change</button>
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#f0f0f0', fontSize: '18px', letterSpacing: '6px', textAlign: 'center', outline: 'none' }}
                />
                <button onClick={handleVerifyCode} disabled={loading || code.length !== 6}
                  style={{ padding: '10px 18px', background: loading || code.length !== 6 ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Verify
                </button>
              </div>
              {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
