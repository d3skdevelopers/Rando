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
    if (!userId) {
      console.log('⏳ useFriends: No userId yet')
      return
    }
    console.log('📊 useFriends initialized with userId:', userId)
    loadFriends()
    loadRequests()
    setupRealtime()

    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up friends channel')
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  const loadFriends = async () => {
    setLoading(true)
    console.log('🔍 Loading friends for user:', userId)
    
    const { data, error } = await supabase
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

    if (error) {
      console.error('❌ Error loading friends:', error)
    } else {
      console.log('✅ Friends loaded:', data?.length || 0)
      setFriends(data?.map(f => ({
        id: f.id,
        friend_id: f.friend_id,
        display_name: f.friend?.[0]?.display_name || 'Unknown',
        created_at: f.created_at
      })) || [])
    }
    setLoading(false)
  }

  const loadRequests = async () => {
    console.log('🔍 Loading requests for user:', userId)
    
    // Requests SENT by me
    const { data: sent, error: sentError } = await supabase
      .from('friends')
      .select(`
        id,
        friend_id,
        created_at,
        friend:guest_sessions!friend_id(display_name)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (sentError) {
      console.error('❌ Error loading sent requests:', sentError)
    } else {
      console.log('✅ Sent requests loaded:', sent?.length || 0)
      setSentRequests(sent?.map(r => ({
        id: r.id,
        friend_id: r.friend_id,
        display_name: r.friend?.[0]?.display_name || 'Unknown',
        created_at: r.created_at
      })) || [])
    }

    // Requests RECEIVED by me
    const { data: received, error: receivedError } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        created_at,
        requester:guest_sessions!user_id(display_name)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (receivedError) {
      console.error('❌ Error loading received requests:', receivedError)
    } else {
      console.log('✅ Received requests loaded:', received?.length || 0)
      setPendingRequests(received?.map(r => ({
        id: r.id,
        requester_id: r.user_id,
        display_name: r.requester?.[0]?.display_name || 'Unknown',
        created_at: r.created_at
      })) || [])
    }
  }

  const setupRealtime = () => {
    if (channelRef.current || !userId) return

    console.log('🔌 Setting up realtime for friends with userId:', userId)
    
    // Create a unique channel name
    const channelName = `friends-${userId}-${Date.now()}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    })
    
    channelRef.current = channel

    // Listen for ALL friend-related changes
    channel
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, (payload) => {
        console.log('📨 Friend request event (as friend):', payload)
        // Reload both sent and received to be safe
        loadRequests()
        loadFriends()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('📨 Friend request event (as user):', payload)
        loadRequests()
        loadFriends()
      })
      .subscribe((status) => {
        console.log('📡 Friends channel status:', status)
        
        // If subscription fails, retry after 2 seconds
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('❌ Channel error, retrying in 2s...')
          setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current)
              channelRef.current = null
              setupRealtime()
            }
          }, 2000)
        }
      })
  }

  // Send friend request
  const sendFriendRequest = async (friendId: string) => {
    if (!userId) {
      console.error('❌ Cannot send request: No userId')
      return false
    }

    console.log('📨 Sending friend request:', { from: userId, to: friendId })

    try {
      // Check if they're already friends or request exists
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle()

      if (existing) {
        console.log('⚠️ Friend relationship already exists:', existing)
        alert(`Already ${existing.status === 'accepted' ? 'friends' : 'have a pending request'} with this user`)
        return false
      }

      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error sending friend request:', error)
        alert(`Failed: ${error.message}`)
        return false
      }

      console.log('✅ Friend request sent successfully:', data)
      
      // Immediately reload sent requests
      await loadRequests()
      
      return true
    } catch (err: any) {
      console.error('❌ Unexpected error:', err)
      return false
    }
  }

  const acceptRequest = async (requestId: string) => {
    console.log('✅ Accepting request:', requestId)
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (error) {
        console.error('❌ Error accepting request:', error)
        return false
      }

      await loadFriends()
      await loadRequests()
      return true
    } catch (err: any) {
      console.error('❌ Unexpected error:', err)
      return false
    }
  }

  const rejectRequest = async (requestId: string) => {
    console.log('❌ Rejecting request:', requestId)
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId)

      if (error) {
        console.error('❌ Error rejecting request:', error)
        return false
      }

      await loadRequests()
      return true
    } catch (err: any) {
      console.error('❌ Unexpected error:', err)
      return false
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!userId) return false

    console.log('🗑️ Removing friend:', friendId)
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId)

      if (error) {
        console.error('❌ Error removing friend:', error)
        return false
      }

      await loadFriends()
      return true
    } catch (err: any) {
      console.error('❌ Unexpected error:', err)
      return false
    }
  }

  // Manual refresh function (can be called from components)
  const refresh = () => {
    console.log('🔄 Manually refreshing friends data')
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
    refresh // Expose refresh function
  }
}