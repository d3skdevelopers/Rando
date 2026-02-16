'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) return
    loadFriends()
    loadRequests()
    setupRealtime()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  const loadFriends = async () => {
    setLoading(true)
    
    const { data } = await supabase
      .from('friends')
      .select(`
        id,
        friend_id,
        status,
        created_at,
        friend:guest_sessions!friend_id(
          display_name
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (data) {
      setFriends(data.map(f => ({
        id: f.id,
        friend_id: f.friend_id,
        display_name: f.friend?.[0]?.display_name || 'Unknown',
        created_at: f.created_at
      })))
    }
    setLoading(false)
  }

  const loadRequests = async () => {
    // Requests SENT by me
    const { data: sent } = await supabase
      .from('friends')
      .select(`
        id,
        friend_id,
        created_at,
        friend:guest_sessions!friend_id(display_name)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (sent) {
      setSentRequests(sent.map(r => ({
        id: r.id,
        friend_id: r.friend_id,
        display_name: r.friend?.[0]?.display_name || 'Unknown',
        created_at: r.created_at
      })))
    }

    // Requests RECEIVED by me
    const { data: received } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        created_at,
        requester:guest_sessions!user_id(display_name)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (received) {
      setPendingRequests(received.map(r => ({
        id: r.id,
        requester_id: r.user_id,
        display_name: r.requester?.[0]?.display_name || 'Unknown',
        created_at: r.created_at
      })))
    }
  }

  const setupRealtime = () => {
    if (channelRef.current || !userId) return

    const channel = supabase.channel(`friends-${userId}`)
    channelRef.current = channel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, () => {
        loadRequests()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.new.status === 'accepted') {
          loadFriends()
          loadRequests()
        }
      })
      .subscribe()
  }

  // Send friend request
  const sendFriendRequest = async (friendId: string) => {
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (error) throw error
      await loadRequests()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      await loadFriends()
      await loadRequests()
      return true
    } catch (err: any) {
      return false
    }
  }

  const rejectRequest = async (requestId: string) => {
    try {
      await supabase
        .from('friends')
        .delete()
        .eq('id', requestId)

      await loadRequests()
      return true
    } catch (err: any) {
      return false
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!userId) return false

    try {
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId)

      await loadFriends()
      return true
    } catch (err: any) {
      return false
    }
  }

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend
  }
}