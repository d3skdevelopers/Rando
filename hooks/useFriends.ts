'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
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
    
    // Get all accepted friendships where user is either user_id or friend_id
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) {
      console.error('❌ Error loading friends:', error)
    } else {
      // Get display names for each friend
      const enhancedFriends = []
      for (const record of data || []) {
        const friendId = record.user_id === userId ? record.friend_id : record.user_id
        
        const { data: userData } = await supabase
          .from('guest_sessions')
          .select('display_name')
          .eq('id', friendId)
          .single()
        
        enhancedFriends.push({
          id: record.id,
          friend_id: friendId,
          display_name: userData?.display_name || 'Unknown',
          created_at: record.created_at
        })
      }
      setFriends(enhancedFriends)
    }
  }

  const loadRequests = async () => {
    if (!userId) return
    
    // Only load requests RECEIVED by me (where I am the friend_id)
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
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, () => {
        loadFriends()
        loadRequests()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadFriends()
        loadRequests()
      })
      .subscribe()
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!userId) return false

    try {
      // Check if already exists in either direction
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

      return true
    } catch (err: any) {
      console.error('❌ Error sending friend request:', err)
      return false
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      // First get the request details
      const { data: request, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError || !request) throw new Error('Request not found')

      // Update the original request status
      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create the reverse friendship for bidirectional relationship
      const { error: reverseError } = await supabase
        .from('friends')
        .insert({
          user_id: request.friend_id,
          friend_id: request.user_id,
          status: 'accepted',
          created_at: new Date().toISOString()
        })

      if (reverseError && !reverseError.message.includes('duplicate')) {
        console.error('Error creating reverse friendship:', reverseError)
      }

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
      // Delete both directions of friendship
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)

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
    loading,
    error,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refresh
  }
}