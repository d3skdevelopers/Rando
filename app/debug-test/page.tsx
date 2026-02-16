'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useIdentity } from '@/hooks/useIdentity'
import { RealtimeChannel } from '@supabase/supabase-js'

export default function FriendsDebugPage() {
  const { identity } = useIdentity()
  const [logs, setLogs] = useState<string[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [friendId, setFriendId] = useState<string>('')
  const [directCheck, setDirectCheck] = useState<any[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const channelRef = useRef<RealtimeChannel | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const log = `[${timestamp}] ${message}`
    console.log(log)
    setLogs(prev => [log, ...prev].slice(0, 50))
  }

  // Load current user
  useEffect(() => {
    if (identity?.guest_id) {
      setUserId(identity.guest_id)
      addLog(`👤 Current user ID: ${identity.guest_id} (${identity.display_name})`)
    }
  }, [identity])

  // Auto-refresh every 2 seconds
  useEffect(() => {
    if (!autoRefresh || !userId) return
    
    const interval = setInterval(() => {
      addLog(`🔄 Auto-refreshing...`)
      checkDatabase()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, userId])

  // Setup realtime subscription
  useEffect(() => {
    if (!userId) return

    addLog(`🔌 Setting up realtime subscription for user ${userId.slice(0,8)}...`)
    
    const channel = supabase.channel(`friends-debug-${userId}`)
    
    channelRef.current = channel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, (payload) => {
        addLog(`📡 🔴 NEW FRIEND REQUEST RECEIVED!`)
        addLog(`   Request ID: ${payload.new.id.slice(0,8)}`)
        addLog(`   From user: ${payload.new.user_id.slice(0,8)}`)
        setLastUpdate(new Date())
        checkDatabase()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        addLog(`📡 🔵 FRIEND REQUEST SENT confirmation`)
        addLog(`   Request ID: ${payload.new.id.slice(0,8)}`)
        addLog(`   To user: ${payload.new.friend_id.slice(0,8)}`)
        setLastUpdate(new Date())
        checkDatabase()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `friend_id=eq.${userId}`
      }, (payload) => {
        addLog(`📡 🟢 REQUEST UPDATED (as friend): ${payload.new.status}`)
        setLastUpdate(new Date())
        checkDatabase()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        addLog(`📡 🟢 REQUEST UPDATED (as user): ${payload.new.status}`)
        setLastUpdate(new Date())
        checkDatabase()
      })
      .subscribe((status) => {
        addLog(`📡 Channel status: ${status}`)
      })

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [userId])

  // Check database for all friend records
  const checkDatabase = async () => {
    if (!userId) {
      addLog('❌ No user ID set')
      return
    }

    addLog('🔍 Checking database for friend records...')
    setLoading(true)

    // First, get all friend records
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      addLog(`❌ Database error: ${error.message}`)
    } else {
      addLog(`✅ Found ${data?.length || 0} records`)
      
      // Then manually get display names for each record
      const enhancedData = []
      for (const record of data || []) {
        const otherId = record.user_id === userId ? record.friend_id : record.user_id
        
        // Get the other user's display name
        const { data: userData } = await supabase
          .from('guest_sessions')
          .select('display_name')
          .eq('id', otherId)
          .single()
        
        enhancedData.push({
          ...record,
          other_name: userData?.display_name || 'Unknown',
          other_id: otherId
        })
      }
      
      setDirectCheck(enhancedData)
      
      // Separate into categories
      const sent = enhancedData.filter(r => r.user_id === userId && r.status === 'pending')
      const received = enhancedData.filter(r => r.friend_id === userId && r.status === 'pending')
      const accepted = enhancedData.filter(r => r.status === 'accepted')
      
      setSentRequests(sent)
      setPendingRequests(received)
      setFriends(accepted)
      
      if (received.length > 0) {
        addLog(`🔴 ${received.length} PENDING REQUESTS RECEIVED!`)
      }
      
      enhancedData.forEach((record, i) => {
        const emoji = record.user_id === userId 
          ? '📤' 
          : record.friend_id === userId && record.status === 'pending' 
            ? '🔴' 
            : '📥'
        addLog(`  ${emoji} ${i+1}. ${record.user_id === userId ? 'SENT to' : 'RECEIVED from'} ${record.other_name} (${record.status})`)
      })
    }
    setLoading(false)
  }

  // Send test friend request
  const sendTestRequest = async () => {
    if (!userId || !friendId) {
      addLog('❌ Need both User ID and Friend ID')
      return
    }

    if (userId === friendId) {
      addLog('❌ Cannot send friend request to yourself')
      return
    }

    addLog(`📨 Sending friend request from ${userId.slice(0,8)} to ${friendId.slice(0,8)}...`)

    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle()

      if (existing) {
        addLog(`⚠️ Already exists: ${existing.status}`)
        return
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
        addLog(`❌ Failed: ${error.message}`)
      } else {
        addLog(`✅ Success! Request ID: ${data.id.slice(0,8)}`)
        await checkDatabase()
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`)
    }
  }

  // Accept request
  const acceptRequest = async (requestId: string) => {
    addLog(`✅ Accepting request ${requestId.slice(0,8)}...`)
    
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (error) {
      addLog(`❌ Failed: ${error.message}`)
    } else {
      addLog(`✅ Request accepted`)
      await checkDatabase()
    }
  }

  // Reject request
  const rejectRequest = async (requestId: string) => {
    addLog(`❌ Rejecting request ${requestId.slice(0,8)}...`)
    
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId)

    if (error) {
      addLog(`❌ Failed: ${error.message}`)
    } else {
      addLog(`✅ Request rejected`)
      await checkDatabase()
    }
  }

  // Copy ID to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addLog(`📋 Copied to clipboard: ${text.slice(0,8)}...`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#f0f0f0',
      padding: '20px',
      fontFamily: 'monospace',
    }}>
      <h1 style={{ fontSize: '28px', color: '#7c3aed', marginBottom: '20px' }}>
        🐞 FRIENDS DEBUG PAGE - REAL TIME
      </h1>

      {/* Last Update Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed20, #4f46e520)',
        border: '1px solid #7c3aed',
        borderRadius: '8px',
        padding: '8px 16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>🕒 Last Update: {lastUpdate.toLocaleTimeString()}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (2s)
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column - Controls */}
        <div>
          {/* Current User */}
          <div style={{
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #7c3aed',
          }}>
            <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px' }}>
              👤 CURRENT USER
            </h2>
            {identity ? (
              <>
                <p><strong>ID:</strong> {identity.guest_id}</p>
                <p><strong>Name:</strong> {identity.display_name}</p>
                <p><strong>Expires:</strong> {new Date(identity.expires_at).toLocaleString()}</p>
                <button
                  onClick={() => copyToClipboard(identity.guest_id)}
                  style={{...smallButtonStyle, marginTop: '8px'}}
                >
                  📋 Copy ID
                </button>
              </>
            ) : (
              <p>Loading identity...</p>
            )}
          </div>

          {/* Manual Controls */}
          <div style={{
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px' }}>
              🎮 MANUAL CONTROLS
            </h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#a0a0b0' }}>
                Your User ID:
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#0a0a0f',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#f0f0f0',
                    fontSize: '12px',
                  }}
                  placeholder="Paste user ID here"
                />
                <button
                  onClick={() => copyToClipboard(userId)}
                  style={{...smallButtonStyle, background: '#333'}}
                >
                  📋
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#a0a0b0' }}>
                Friend's User ID:
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={friendId}
                  onChange={(e) => setFriendId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#0a0a0f',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#f0f0f0',
                    fontSize: '12px',
                  }}
                  placeholder="Paste friend ID here"
                />
                <button
                  onClick={() => copyToClipboard(friendId)}
                  style={{...smallButtonStyle, background: '#333'}}
                >
                  📋
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={checkDatabase}
                style={buttonStyle}
              >
                🔍 Check Database
              </button>
              <button
                onClick={sendTestRequest}
                style={{...buttonStyle, background: '#7c3aed'}}
                disabled={!userId || !friendId}
              >
                📨 Send Test Request
              </button>
            </div>
          </div>

          {/* Received Requests - Highlighted */}
          {pendingRequests.length > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '2px solid #ef4444',
              animation: 'pulse 2s infinite',
            }}>
              <h2 style={{ fontSize: '16px', color: '#ef4444', marginBottom: '12px' }}>
                🔴 {pendingRequests.length} PENDING REQUEST(S) RECEIVED!
              </h2>
              {pendingRequests.map(req => (
                <div key={req.id} style={{
                  background: '#1a1a2e',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}>
                  <p><strong>From:</strong> {req.other_name}</p>
                  <p><strong>ID:</strong> {req.other_id.slice(0,8)}...</p>
                  <p><strong>Sent:</strong> {new Date(req.created_at).toLocaleString()}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => acceptRequest(req.id)}
                      style={{...smallButtonStyle, background: '#22c55e'}}
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      style={{...smallButtonStyle, background: '#ef4444'}}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Database Results */}
          <div style={{
            background: '#1a1a2e',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px' }}>
              📊 DATABASE RESULTS
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Friends:</strong> {friends.length}</p>
              <p><strong>Received:</strong> <span style={{ color: pendingRequests.length > 0 ? '#ef4444' : 'inherit' }}>{pendingRequests.length}</span></p>
              <p><strong>Sent:</strong> {sentRequests.length}</p>
            </div>

            {directCheck.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', color: '#f0f0f0', marginBottom: '8px' }}>
                  All Records:
                </h3>
                {directCheck.map((record, i) => {
                  const isSent = record.user_id === userId
                  const isReceived = record.friend_id === userId && record.status === 'pending'
                  return (
                    <div key={record.id} style={{
                      background: isReceived ? 'rgba(239,68,68,0.1)' : '#0a0a0f',
                      padding: '10px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      border: isReceived ? '1px solid #ef4444' : '1px solid #333',
                    }}>
                      <p><strong>ID:</strong> {record.id.slice(0,8)}...</p>
                      <p><strong>Type:</strong> 
                        <span style={{ color: isReceived ? '#ef4444' : 'inherit' }}>
                          {' '}{isSent ? 'SENT' : 'RECEIVED'}
                        </span>
                      </p>
                      <p><strong>With:</strong> {record.other_name || 'Unknown'}</p>
                      <p><strong>Status:</strong> 
                        <span style={{
                          color: record.status === 'accepted' ? '#22c55e' : 
                                 record.status === 'pending' ? '#f59e0b' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {' '}{record.status}
                        </span>
                      </p>
                      <p><strong>Created:</strong> {new Date(record.created_at).toLocaleString()}</p>
                      
                      {record.status === 'pending' && record.friend_id === userId && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={() => acceptRequest(record.id)}
                            style={{...smallButtonStyle, background: '#22c55e'}}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectRequest(record.id)}
                            style={{...smallButtonStyle, background: '#ef4444'}}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Logs */}
        <div style={{
          background: '#1a1a2e',
          borderRadius: '8px',
          padding: '16px',
          height: 'fit-content',
          border: '1px solid #7c3aed',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', color: '#7c3aed' }}>📋 EVENT LOG</h2>
            <button
              onClick={() => setLogs([])}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>
          
          <div style={{
            height: '600px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#0f0',
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No logs yet. Run some tests!
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

const buttonStyle = {
  padding: '8px 16px',
  background: '#333',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const smallButtonStyle = {
  padding: '4px 8px',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  fontSize: '11px',
  cursor: 'pointer',
}