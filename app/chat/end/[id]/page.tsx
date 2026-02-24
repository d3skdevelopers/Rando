'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function GGPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params?.id as string
  const [rating, setRating] = useState(0)
  const [hover, setHover]   = useState(0)
  const [rated, setRated]   = useState(false)

  const handleRate = async (stars: number) => {
    setRating(stars); setRated(true)
    try {
      await fetch(`/api/chats/${chatId}/rate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars }),
      })
    } catch { /* non-blocking */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'Georgia', serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 'min(600px,80vw)', height: 'min(600px,80vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 'min(500px,70vw)', height: 'min(500px,70vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .btn-primary { background:linear-gradient(135deg,#7c3aed,#4f46e5); color:white; border:none; padding:14px 28px; font-size:16px; font-family:'Georgia',serif; cursor:pointer; border-radius:8px; font-weight:600; transition:all 0.3s ease; width:100%; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,0.4); }
        .btn-ghost  { background:transparent; color:#a0a0b0; border:1px solid rgba(255,255,255,0.12); padding:14px 28px; font-size:15px; font-family:'Georgia',serif; cursor:pointer; border-radius:8px; transition:all 0.3s ease; width:100%; }
        .btn-ghost:hover  { border-color:rgba(255,255,255,0.3); color:#f0f0f0; }
        .star { background:none; border:none; font-size:28px; cursor:pointer; transition:transform 0.1s; padding:4px; }
      `}</style>

      <div style={{ maxWidth: 420, width: '100%', position: 'relative', zIndex: 10, animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* GG card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎮</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>GG</h1>
          <p style={{ fontSize: 14, color: '#8080a0', fontStyle: 'italic', marginBottom: 28 }}>That was a good lobby.</p>

          {/* Star rating */}
          <p style={{ fontSize: 11, color: '#40404a', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Rate the game</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} className="star"
                onClick={() => !rated && handleRate(s)}
                onMouseEnter={() => !rated && setHover(s)}
                onMouseLeave={() => !rated && setHover(0)}
                style={{ filter: (hover >= s || rating >= s) ? 'none' : 'grayscale(1) opacity(0.3)', transform: (hover >= s || rating >= s) ? 'scale(1.15)' : 'scale(1)', cursor: rated ? 'default' : 'pointer' }}>
                ⭐
              </button>
            ))}
          </div>
          {rated && <p style={{ fontSize: 12, color: '#22c55e' }}>Thanks! ✓</p>}
        </div>

        {/* Register gate — gaming FOMO */}
        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, padding: '24px 24px 20px' }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 11, color: '#c4b5fd', marginBottom: 14, letterSpacing: '0.5px' }}>
            ✦ Create a free account to:
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '🔁  Rematch — send a friend request',
              '📊  See your lobby history & stats',
              '🔔  Know when your matches are online',
              '👥  Build your squad over time',
            ].map(p => (
              <li key={p} style={{ fontSize: 14, color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 8 }}>{p}</li>
            ))}
          </ul>
          <Link href="/register" style={{ display: 'block', textDecoration: 'none' }}>
            <button className="btn-primary">Register Free →</button>
          </Link>
        </div>

        <button className="btn-ghost" onClick={() => router.push('/matchmaking')}>
          New Lobby
        </button>
      </div>
    </div>
  )
}
