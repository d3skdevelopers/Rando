'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FriendChatStarterProps {
  isOpen: boolean
  onClose: () => void
  friendId: string
  friendName: string
}

export function FriendChatStarter({
  isOpen,
  onClose,
  friendId,
  friendName
}: FriendChatStarterProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStart = () => {
    setLoading(true)
    router.push(`/chat/new?friend=${friendId}&name=${encodeURIComponent(friendName)}`)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '20px', color: '#f0f0f0', marginBottom: '12px' }}>
          Start Chat with {friendName}?
        </h3>
        <p style={{ color: '#a0a0b0', marginBottom: '24px' }}>
          This will create a new chat session. You'll be connected immediately.
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Starting...' : 'Start Chat'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '8px',
              color: '#a0a0b0',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}