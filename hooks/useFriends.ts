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
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId) {
      console.log('⏳ useFriends: No userId yet')
      return
    }
    console.log('📊 useFriends initialized with userId:', userId)
    loadFriends()
    loadRequests()
    setupRealtime()
    
    // Poll every 5 seconds as backup
    pollingRef.current = setInterval(() => {
      console.log('🔄 Polling fallback: checking for updates')
      loadRequests()
      loadFriends()
    }, 5000)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [userId])

  const loadFriends = async () => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'accepted')

    if (error) {
      console.error('❌ Error loading friends:', error)
    } else {
      // Get display names for each friend
      const enhancedFriends = []
      for (const friend of data || []) {
        const { data: userData } = await supabase
          .from('guest_sessions')
          .select('display_name')
          .eq('id', friend.friend_id)
          .single()
        
        enhancedFriends.push({
          id: friend.id,
          friend_id: friend.friend_id,
          display_name: userData?.display_name || 'Unknown',
          created_at: friend.created_at
        })
      }
      setFriends(enhancedFriends)
    }
  }

  const loadRequests = async () => {
    if (!userId) return
    
    // Requests SENT by me
    const { data: sent, error: sentError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (sentError) {
      console.error('❌ Error loading sent requests:', sentError)
    } else {
      const enhancedSent = []
      for (const req of sent || []) {
        const { data: userData } = await supabase
          .from('guest_sessions')
          .select('display_name')
          .eq('id', req.friend_id)
          .single()
        
        enhancedSent.push({
          id: req.id,
          friend_id: req.friend_id,
          display_name: userData?.display_name || 'Unknown',
          created_at: req.created_at
        })
      }
      setSentRequests(enhancedSent)
    }

    // Requests RECEIVED by me
    const { data: received, error: receivedError } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (receivedError) {
      console.error('❌ Error loading received requests:', receivedError)
    } else {
      const enhancedReceived = []
      for (const req of received || []) {
        const { data: userData } = await supabase
          .from('guest_sessions')
          .select('display_name')
          .eq('id', req.user_id)
          .single()
        
        enhancedReceived.push({
          id: req.id,
          requester_id: req.user_id,
          display_name: userData?.display_name || 'Unknown',
          created_at: req.created_at
        })
      }
      setPendingRequests(enhancedReceived)
    }
  }

  const setupRealtime = () => {
    if (channelRef.current || !userId) return

    const channel = supabase.channel(`friends-${userId}-${Date.now()}`)
    channelRef.current = channel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, () => {
        loadRequests()
        loadFriends()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadRequests()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, () => {
        loadRequests()
        loadFriends()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadRequests()
        loadFriends()
      })
      .subscribe()
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!userId) return false

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle()

      if (existing) {
        alert(`Already ${existing.status === 'accepted' ? 'friends' : 'have a pending request'} with this user`)
        return false
      }

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
      console.error('❌ Error sending friend request:', err)
      return false
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (error) throw error

      await loadFriends()
      await loadRequests()
      return true
    } catch (err: any) {
      console.error('❌ Error accepting request:', err)
      return false
    }
  }

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      await loadRequests()
      return true
    } catch (err: any) {
      console.error('❌ Error rejecting request:', err)
      return false
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId)

      if (error) throw error

      await loadFriends()
      return true
    } catch (err: any) {
      console.error('❌ Error removing friend:', err)
      return false
    }
  }

  const refresh = () => {
    loadFriends()
    loadRequests()
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
    removeFriend,
    refresh
  }
}