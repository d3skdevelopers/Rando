'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useIdentity } from '@/hooks/useIdentity'
import { useChatWithFriend } from '@/hooks/useChatWithFriend'

export default function NewChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const friendId = searchParams.get('friend')
  const friendName = searchParams.get('name')
  
  const { identity } = useIdentity()
  const { startChatWithFriend, loading, error } = useChatWithFriend()

  useEffect(() => {
    if (!identity?.guest_id) {
      router.push('/matchmaking')
      return
    }

    if (!friendId || !friendName) {
      router.push('/friends')
      return
    }

    startChatWithFriend(identity.guest_id, friendId, friendName)
  }, [identity, friendId, friendName])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f0f0f0',
    }}>
      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Starting chat with {friendName ? decodeURIComponent(friendName) : 'friend'}...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ef4444', marginBottom: '16px' }}>Error: {error}</div>
          <button
            onClick={() => router.push('/friends')}
            style={{
              padding: '10px 20px',
              background: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Back to Friends
          </button>
        </div>
      ) : null}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}