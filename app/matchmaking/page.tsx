'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { MatchFound } from '@/components/matchmaking/MatchFound'

const MOODS = [
  { id: 'hype',  emoji: '🔥', label: 'Hyped',          sub: 'just won / on a streak' },
  { id: 'vent',  emoji: '💢', label: 'Tilted',          sub: 'need to vent it out' },
  { id: 'chill', emoji: '🎮', label: 'Chilling',        sub: 'casual, no pressure' },
  { id: 'squad', emoji: '🎯', label: 'Need a squad',    sub: 'looking for teammates' },
]

type Stage = 'mood' | 'queue'

export default function MatchmakingPage() {
  const router = useRouter()
  const [stage, setStage]   = useState<Stage>('mood')
  const [mood, setMood]     = useState<string | null>(null)

  const {
    session, isInQueue, matchFound,
    joinQueue, leaveQueue, isLoading,
    queuePosition, usersInQueue,
  } = useMatchmaking()

  // Navigate when match found
  if (matchFound) {
    router.push(`/chat/${matchFound.id}`)
    return null
  }

  const handleFindLobby = async () => {
    setStage('queue')
    await joinQueue()
  }

  const orbs = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 'min(600px,80vw)', height: 'min(600px,80vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 'min(500px,70vw)', height: 'min(500px,70vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  )

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'Georgia', serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,24px)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbitGlow { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.2)} 50%{box-shadow:0 0 0 24px rgba(124,58,237,0)} }
        @keyframes sweepBar  { 0%{margin-left:0;width:20%} 60%{margin-left:40%;width:60%} 100%{margin-left:85%;width:15%} }
      `}</style>
      {orbs}
      <div style={{ maxWidth: 500, width: '100%', position: 'relative', zIndex: 10, animation: 'fadeIn 0.4s ease' }}>
        {children}
      </div>
    </div>
  )

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
      {children}
    </div>
  )

  // ── MOOD STAGE ────────────────────────────────────────────────
  if (stage === 'mood') return wrap(card(
    <>
      <div style={{ padding: 'clamp(16px,4vw,20px) clamp(18px,5vw,24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 34, height: 34, color: '#a0a0b0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>What's your vibe right now?</div>
          <div style={{ fontSize: 12, color: '#60607a', fontStyle: 'italic', marginTop: 2 }}>Sets the tone — skip for pure random</div>
        </div>
      </div>

      <div style={{ padding: 'clamp(16px,4vw,20px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {MOODS.map(m => (
            <div key={m.id} onClick={() => setMood(mood === m.id ? null : m.id)}
              style={{ padding: 'clamp(14px,3vw,18px)', borderRadius: 12, border: `1px solid ${mood === m.id ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.07)'}`, background: mood === m.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{m.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: mood === m.id ? '#c4b5fd' : '#e0e0f0', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#60607a', fontStyle: 'italic' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleFindLobby} disabled={isLoading}
            style={{ flex: 1, padding: '13px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#a0a0b0', fontFamily: "'Georgia', serif", fontSize: 14, cursor: 'pointer' }}>
            Skip
          </button>
          <button onClick={handleFindLobby} disabled={isLoading}
            style={{ flex: 2, padding: '13px 20px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, color: 'white', fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Find Lobby →
          </button>
        </div>
      </div>
    </>
  ))

  // ── QUEUE STAGE ───────────────────────────────────────────────
  const selectedMood = MOODS.find(m => m.id === mood)

  return wrap(
    <>
      {card(
        <>
          <div style={{ padding: 'clamp(16px,4vw,20px) clamp(18px,5vw,24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Finding your lobby</div>
            {selectedMood && (
              <div style={{ fontSize: 12, color: '#60607a', fontStyle: 'italic', marginTop: 2 }}>
                vibe: {selectedMood.emoji} {selectedMood.label}
              </div>
            )}
          </div>

          <div style={{ padding: 'clamp(28px,6vw,40px) clamp(18px,5vw,28px)', textAlign: 'center' }}>
            {/* Ping orb */}
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', border: '2px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 34, animation: 'orbitGlow 2.5s ease-in-out infinite' }}>
              🎮
            </div>

            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Loading...</div>
            <div style={{ fontSize: 13, color: '#60607a', fontStyle: 'italic', marginBottom: 28 }}>
              pinging servers · finding a match
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
              {[
                { num: usersInQueue > 0 ? usersInQueue.toLocaleString() : '—', label: 'in queue' },
                { num: `#${queuePosition || 1}`, label: 'your position' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 'clamp(10px,2.5vw,14px)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.num}</div>
                  <div style={{ fontSize: 10, color: '#60607a', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#7c3aed,#4f46e5)', borderRadius: 2, animation: 'sweepBar 1.8s ease-in-out infinite', width: '40%' }} />
            </div>

            <button onClick={async () => { await leaveQueue(); setStage('mood') }}
              style={{ width: '100%', padding: '13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#a0a0b0', fontFamily: "'Georgia', serif", fontSize: 14, cursor: 'pointer' }}>
              Leave Lobby
            </button>
          </div>
        </>
      )}

      {/* Match found overlay */}
      {matchFound && (
        <MatchFound match={{
          id: matchFound.id,
          partnerName: matchFound.user1_id === session?.guest_id ? matchFound.user2_display_name : matchFound.user1_display_name,
          sharedInterests: matchFound.shared_interests,
        }} />
      )}
    </>
  )
}
