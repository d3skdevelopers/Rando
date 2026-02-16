'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useIdentity } from '@/hooks/useIdentity'

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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const log = `[${timestamp}] ${message}`
    console.log(log)
    setLogs(prev => [log, ...prev].slice(0, 30))
  }

  // Load current user
  useEffect(() => {
    if (identity?.guest_id) {
      setUserId(identity.guest_id)
      addLog(`👤 Current user ID: ${identity.guest_id} (${identity.display_name})`)
    }
  }, [identity])

  // Check database for all friend records
  const checkDatabase = async () => {
    if (!userId) {
      addLog('❌ No user ID set')
      return
    }

    addLog('🔍 Checking database for friend records...')
    setLoading(true)

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        requester:guest_sessions!user_id(display_name),
        friend:guest_sessions!friend_id(display_name)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      addLog(`❌ Database error: ${error.message}`)
    } else {
      addLog(`✅ Found ${data?.length || 0} records`)
      setDirectCheck(data || [])
      
      // Separate into categories
      const sent = data?.filter(r => r.user_id === userId && r.status === 'pending') || []
      const received = data?.filter(r => r.friend_id === userId && r.status === 'pending') || []
      const accepted = data?.filter(r => r.status === 'accepted') || []
      
      setSentRequests(sent)
      setPendingRequests(received)
      setFriends(accepted)
      
      data?.forEach((record, i) => {
        const isSent = record.user_id === userId
        const otherName = isSent 
          ? record.friend?.[0]?.display_name 
          : record.requester?.[0]?.display_name
        addLog(`  ${i+1}. ${isSent ? 'SENT to' : 'RECEIVED from'} ${otherName || 'Unknown'} (${record.status})`)
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

  // Test realtime subscription
  const testRealtime = () => {
    addLog('🔌 Setting up realtime test subscription...')
    
    const channel = supabase.channel('friends-debug')
    
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends'
      }, (payload) => {
        addLog(`📡 REALTIME EVENT: ${payload.eventType}`)
        addLog(`   New: ${JSON.stringify(payload.new)}`)
        if (payload.old) addLog(`   Old: ${JSON.stringify(payload.old)}`)
      })
      .subscribe((status) => {
        addLog(`📡 Channel status: ${status}`)
      })

    return () => {
      channel.unsubscribe()
    }
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
        🐞 FRIENDS DEBUG PAGE
      </h1>

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
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0a0a0f',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#f0f0f0',
                  fontSize: '12px',
                }}
                placeholder="Paste user ID here"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#a0a0b0' }}>
                Friend's User ID:
              </label>
              <input
                type="text"
                value={friendId}
                onChange={(e) => setFriendId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0a0a0f',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#f0f0f0',
                  fontSize: '12px',
                }}
                placeholder="Paste friend ID here"
              />
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
              <button
                onClick={testRealtime}
                style={{...buttonStyle, background: '#f59e0b'}}
              >
                📡 Test Realtime
              </button>
            </div>
          </div>

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
              <p><strong>Received:</strong> {pendingRequests.length}</p>
              <p><strong>Sent:</strong> {sentRequests.length}</p>
            </div>

            {directCheck.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', color: '#f0f0f0', marginBottom: '8px' }}>
                  All Records:
                </h3>
                {directCheck.map((record, i) => {
                  const isSent = record.user_id === userId
                  const otherName = isSent 
                    ? record.friend?.[0]?.display_name 
                    : record.requester?.[0]?.display_name
                  return (
                    <div key={record.id} style={{
                      background: '#0a0a0f',
                      padding: '10px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      border: '1px solid #333',
                    }}>
                      <p><strong>ID:</strong> {record.id.slice(0,8)}...</p>
                      <p><strong>Type:</strong> {isSent ? 'SENT' : 'RECEIVED'}</p>
                      <p><strong>With:</strong> {otherName || 'Unknown'}</p>
                      <p><strong>Status:</strong> 
                        <span style={{
                          color: record.status === 'accepted' ? '#22c55e' : 
                                 record.status === 'pending' ? '#f59e0b' : '#ef4444'
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

      {/* Quick IDs Section */}
      <div style={{
        marginTop: '20px',
        background: '#1a1a2e',
        borderRadius: '8px',
        padding: '16px',
      }}>
        <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px' }}>
          🔑 QUICK IDS FROM LOGS
        </h2>
        <p style={{ fontSize: '12px', color: '#a0a0b0' }}>
          From your logs: 
          Phone 1: 98909424... 
          Phone 2: 3747cec5...
        </p>
        <p style={{ fontSize: '12px', color: '#a0a0b0', marginTop: '8px' }}>
          Try sending a request from Phone 1 (98909424) to Phone 2 (3747cec5) using the manual controls above.
        </p>
      </div>
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