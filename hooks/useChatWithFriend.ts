'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useChatWithFriend() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startChatWithFriend = async (userId: string, friendId: string, friendName: string) => {
    if (!userId || !friendId) {
      setError('Missing user or friend ID')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check if there's already an active chat
      const { data: existingChat } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
        .eq('status', 'active')
        .maybeSingle()

      if (existingChat) {
        // Reuse existing active chat
        router.push(`/chat/${existingChat.id}`)
        return existingChat.id
      }

      // Get current user's display name
      const { data: userData } = await supabase
        .from('guest_sessions')
        .select('display_name')
        .eq('id', userId)
        .single()

      // Create new chat session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user1_id: userId,
          user2_id: friendId,
          user1_display_name: userData?.display_name || 'User',
          user2_display_name: friendName,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      router.push(`/chat/${newSession.id}`)
      return newSession.id

    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    startChatWithFriend,
    loading,
    error
  }
}