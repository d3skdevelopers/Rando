'use client'

import { useState } from 'react'
import Link from 'next/link'

interface RegisterNudgeProps { chatId: string }

export function RegisterNudge({ chatId }: RegisterNudgeProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div style={{ margin: '0 16px 8px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, animation: 'nudgeIn 0.3s ease-out', backdropFilter: 'blur(4px)' }}>
      <p style={{ fontSize: 13, color: '#a0a0b0', margin: 0, fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
        ✦ Register free to save this chat
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <Link href={`/register?returnTo=/chat/${chatId}`}>
          <button style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Georgia', serif" }}>
            GG — join free →
          </button>
        </Link>
        <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: '#60607a', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }} aria-label="Dismiss">×</button>
      </div>
      <style>{`@keyframes nudgeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}
