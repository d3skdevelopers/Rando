'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

declare global {
  interface Window {
    hcaptcha: {
      render: (el: HTMLElement, params: object) => string
      execute: (id: string) => void
      reset: (id: string) => void
    }
  }
}

const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ?? ''

const TAGLINES = [
  'Between matches.',
  'Post-clutch.',
  'Mid-tilt.',
  'After the GG.',
]

export default function HomePage() {
  const router = useRouter()
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [stats, setStats] = useState({ online: 0, inQueue: 0, activeChats: 0 })
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scriptReady, setScriptReady] = useState(false)
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setTaglineIndex(i => (i + 1) % TAGLINES.length); setVisible(true) }, 400)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const [{ count: q }, { count: c }] = await Promise.all([
          sb.from('matchmaking_queue').select('id', { count: 'exact', head: true }),
          sb.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ])
        setStats({ online: (q || 0) + (c || 0) * 2, inQueue: q || 0, activeChats: c || 0 })
      } catch { /* silently fail */ }
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!scriptReady || !containerRef.current || widgetRef.current) return
    widgetRef.current = window.hcaptcha.render(containerRef.current, {
      sitekey: SITEKEY || 'placeholder',
      size: 'invisible',
      callback: onCaptchaPass,
      'error-callback': onCaptchaError,
    })
  }, [scriptReady])

  const onCaptchaPass = async (token: string) => {
    try {
      const res = await fetch('/api/hcaptcha/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!data.success) { setError('Verification failed. Try again.'); setLoading(false); if (widgetRef.current) window.hcaptcha.reset(widgetRef.current); return }
      setVerified(true)
      setTimeout(() => router.push('/matchmaking'), 350)
    } catch { setError('Something went wrong.'); setLoading(false) }
  }

  const onCaptchaError = () => { setError('Captcha error. Please try again.'); setLoading(false) }

  const handleStart = () => {
    if (verified) return
    setLoading(true); setError('')
    if (widgetRef.current !== null) { window.hcaptcha.execute(widgetRef.current) }
    else { setVerified(true); setTimeout(() => router.push('/matchmaking'), 350) }
  }

  return (
    <>
      {SITEKEY && <Script src={`https://js.hcaptcha.com/1/api.js?render=explicit`} strategy="lazyOnload" onLoad={() => setScriptReady(true)} />}

      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'Georgia', serif", overflow: 'hidden', position: 'relative' }}>
        {/* Orbs */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,60,180,0.15) 0%, transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,160,140,0.12) 0%, transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div ref={containerRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />

        <style>{`
          @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
          @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
          @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes spin { to{transform:rotate(360deg)} }
          .tagline-text { transition: opacity 0.4s ease, transform 0.4s ease; }
          .tagline-visible { opacity: 1; transform: translateY(0); }
          .tagline-hidden { opacity: 0; transform: translateY(-8px); }
          .btn-start { background: linear-gradient(135deg,#7c3aed,#4f46e5); color: white; border: none; padding: 18px 52px; font-size: 18px; font-family: 'Georgia',serif; cursor: pointer; letter-spacing: 0.5px; transition: all 0.3s ease; border-radius: 4px; }
          .btn-start:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.4); }
          .btn-start:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
          .btn-secondary { background: transparent; color: #a0a0b0; border: 1px solid rgba(255,255,255,0.12); padding: 17px 40px; font-size: 16px; font-family: 'Georgia',serif; cursor: pointer; letter-spacing: 0.5px; transition: all 0.3s ease; border-radius: 4px; text-decoration: none; display: inline-block; }
          .btn-secondary:hover { border-color: rgba(255,255,255,0.3); color: #f0f0f0; transform: translateY(-2px); }
          .feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); padding: 32px; transition: all 0.3s ease; }
          .feature-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(124,58,237,0.3); transform: translateY(-4px); }
          .stat-num { background: linear-gradient(135deg,#a78bfa,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        `}</style>

        {/* Nav */}
        <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎮</div>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>RANDO</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {stats.online > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, fontSize: 13, color: '#86efac' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                {stats.online.toLocaleString()} gamers online
              </div>
            )}
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: 14 }}>Sign in</button>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main style={{ position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', padding: '100px 48px 80px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 13, color: '#c4b5fd', marginBottom: 32, letterSpacing: '1px', textTransform: 'uppercase' }}>
            For Gamers
          </div>

          <h1 style={{ fontSize: 'clamp(52px,8vw,88px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-3px', marginBottom: 16, background: 'linear-gradient(135deg,#ffffff 0%,#a0a0c0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Someone to<br />talk to.
          </h1>

          <div style={{ height: 48, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className={`tagline-text ${visible ? 'tagline-visible' : 'tagline-hidden'}`} style={{ fontSize: 'clamp(18px,3vw,26px)', color: '#8080a0', fontStyle: 'italic' }}>
              {TAGLINES[taglineIndex]}
            </p>
          </div>

          <p style={{ fontSize: 16, color: '#60607a', marginBottom: 48, fontStyle: 'italic' }}>
            Anonymous. Instant. Always another gamer on the other end.
          </p>

          {/* hCaptcha chip */}
          <div style={{ maxWidth: 400, margin: '0 auto 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 16px', textAlign: 'left' }}>
            <div style={{ width: 22, height: 22, border: `2px solid ${verified ? '#22c55e' : 'rgba(124,58,237,0.5)'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: verified ? '#22c55e' : '#a78bfa', flexShrink: 0, transition: 'border-color 0.2s' }}>{verified ? '✓' : ''}</div>
            <span style={{ fontSize: 13, color: '#8080a0', flex: 1 }}>{verified ? "Verified — you're in" : "I'm not a robot"}</span>
            <div style={{ fontSize: 9, color: '#40404a', textAlign: 'right' }}>hCaptcha<br />Privacy · Terms</div>
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 80 }}>
            <button className="btn-start" onClick={handleStart} disabled={loading || verified}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  Verifying...
                </span>
              ) : verified ? 'Entering lobby...' : 'Find Someone to Talk To →'}
            </button>
            <Link href="/register" className="btn-secondary">Create Account</Link>
          </div>

          {/* Live stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 100 }}>
            {[
              { num: stats.online > 0 ? stats.online.toLocaleString() : '—', label: 'Gamers online now' },
              { num: stats.activeChats > 0 ? stats.activeChats.toLocaleString() : '—', label: 'Active conversations' },
              { num: stats.inQueue > 0 ? stats.inQueue.toLocaleString() : '—', label: 'Looking to talk' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '32px 24px', background: '#0a0a0f', textAlign: 'center' }}>
                <div className="stat-num" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#4a4a6a', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  LIVE
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, textAlign: 'left' }}>
            {[
              { icon: '🎮', title: 'Mid-game companion', desc: "Solo queue doesn't have to be silent. Talk to someone who gets it — right now." },
              { icon: '💢', title: 'Vent your tilt', desc: "Lost 5 in a row? There's someone on the other end who's been there. No judgment." },
              { icon: '🔥', title: 'Share the hype', desc: "Hit a 1v5 clutch and no one was there to see it? Tell someone who cares." },
              { icon: '🤝', title: 'Find your squad', desc: "Register to save great chats, send friend requests, and build your circle." },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#e0e0f0' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#60607a', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#40404a', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
            {[['Safety', '/safety'], ['Sign In', '/login'], ['Register', '/register'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: '#60607a', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          © 2026 RANDO CHAT · All rights reserved
        </footer>
      </div>
    </>
  )
}
