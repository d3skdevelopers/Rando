'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useFriends } from '@/hooks/useFriends'
import { useIdentity } from '@/hooks/useIdentity'

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  partnerName: string
  partnerId?: string
  chatDuration: string
  messageCount: number
  onReport: () => void
  onBlock: () => void
  onAddFriend: () => void
  guestId?: string
}

export function ChatSidebar({
  isOpen,
  onClose,
  partnerName,
  partnerId,
  chatDuration,
  messageCount,
  onReport,
  onBlock,
  onAddFriend: onAddFriendProp,
  guestId
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'info'>('info')
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const { identity } = useIdentity()
  
  const currentUserId = guestId || identity?.guest_id
  
  const { 
    friends, 
    pendingRequests, 
    sentRequests, 
    sendFriendRequest,
    acceptRequest, 
    rejectRequest, 
    removeFriend,
    refresh
  } = useFriends(currentUserId)

  // Log all important state changes
  useEffect(() => {
    if (isOpen) {
      addDebugLog(`📱 SIDEBAR OPENED - User: ${currentUserId?.slice(0, 8)}..., Partner: ${partnerName} (${partnerId?.slice(0, 8)}...)`)
    }
  }, [isOpen])

  useEffect(() => {
    if (activeTab) {
      addDebugLog(`📌 Tab changed to: ${activeTab}`)
    }
  }, [activeTab])

  useEffect(() => {
    addDebugLog(`👥 Friends loaded: ${friends.length}`)
  }, [friends])

  useEffect(() => {
    addDebugLog(`📨 Pending requests: ${pendingRequests.length}, Sent: ${sentRequests.length}`)
  }, [pendingRequests, sentRequests])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const log = `[${timestamp}] ${message}`
    console.log(log)
    setDebugLogs(prev => [log, ...prev].slice(0, 20)) // Keep last 20 logs
  }

  const handleAddFriend = async () => {
    addDebugLog(`➕ ADD FRIEND button clicked - Partner: ${partnerName} (${partnerId?.slice(0, 8)}...)`)
    
    if (!partnerId) {
      addDebugLog('❌ Add friend failed - no partnerId')
      alert('Cannot add friend: Partner ID not found. Please wait a moment and try again.')
      return
    }
    
    addDebugLog(`📨 Sending friend request from ${currentUserId?.slice(0, 8)} to ${partnerId?.slice(0, 8)}`)
    const success = await sendFriendRequest(partnerId)
    if (success) {
      addDebugLog(`✅ Friend request sent successfully to ${partnerName}`)
      alert(`✅ Friend request sent to ${partnerName}!`)
      setActiveTab('requests')
    } else {
      addDebugLog('❌ Failed to send friend request')
      alert('❌ Failed to send friend request')
    }
  }

  const handleTabChange = (tab: typeof activeTab) => {
    addDebugLog(`📌 Switching to ${tab} tab`)
    setActiveTab(tab)
  }

  const handleReport = () => {
    addDebugLog(`⚠️ Report button clicked for ${partnerName}`)
    onReport()
  }

  const handleBlock = () => {
    addDebugLog(`🚫 Block button clicked for ${partnerName}`)
    onBlock()
  }

  const handleClose = () => {
    addDebugLog(`🚪 Sidebar closed`)
    onClose()
  }

  const handleRefresh = () => {
    addDebugLog(`🔄 Manual refresh triggered`)
    refresh()
  }

  // Debug function to check database directly
  const debugCheckDatabase = async () => {
    addDebugLog(`🔍 DEBUG CHECK STARTED`)
    addDebugLog(`👤 Current userId: ${currentUserId?.slice(0, 8)}...`)
    addDebugLog(`👥 Partner: ${partnerName} (${partnerId?.slice(0, 8)}...)`)
    addDebugLog(`📊 State - Friends: ${friends.length}, Pending: ${pendingRequests.length}, Sent: ${sentRequests.length}`)
    
    // Direct database check
    const { data: directCheck } = await supabase
      .from('friends')
      .select(`
        *,
        requester:guest_sessions!user_id(display_name),
        friend:guest_sessions!friend_id(display_name)
      `)
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
    
    addDebugLog(`📊 DATABASE FOUND: ${directCheck?.length || 0} records`)
    directCheck?.forEach((record, i) => {
      const isSent = record.user_id === currentUserId
      const otherName = isSent 
        ? record.friend?.[0]?.display_name 
        : record.requester?.[0]?.display_name
      addDebugLog(`  ${i+1}. ${isSent ? 'SENT to' : 'RECEIVED from'} ${otherName} (${record.status})`)
    })
    
    console.log('📊 FULL DATABASE CHECK:', directCheck)
    alert(`Check debug logs at top of sidebar\nFound ${directCheck?.length || 0} records in database`)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(380px, 90vw)',
      background: '#0a0a0f',
      borderLeft: '1px solid rgba(124,58,237,0.2)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s ease',
      boxShadow: '-5px 0 30px rgba(0,0,0,0.5)',
    }}>
      {/* DEBUG LOGS - AT THE VERY TOP */}
      <div style={{
        background: '#1a1a2e',
        borderBottom: '2px solid #7c3aed',
        padding: '8px 12px',
        maxHeight: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#0f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <strong style={{ color: '#7c3aed' }}>🐞 EVENT LOG</strong>
          <button 
            onClick={() => setDebugLogs([])}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '11px' }}
          >
            Clear
          </button>
        </div>
        {debugLogs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '10px' }}>
            No events yet. Click buttons to see logs.
          </div>
        ) : (
          debugLogs.map((log, i) => (
            <div key={i} style={{ marginBottom: '2px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
              {log}
            </div>
          ))
        )}
      </div>

      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#f0f0f0',
          fontFamily: "'Georgia', serif",
          margin: 0,
        }}>
          RANDO
        </h3>
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: '#a0a0b0',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        padding: '0 16px',
      }}>
        <button
          onClick={() => handleTabChange('info')}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'info' ? '#7c3aed' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Chat Info
        </button>
        <button
          onClick={() => handleTabChange('friends')}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'friends' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'friends' ? '#7c3aed' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button
          onClick={() => handleTabChange('requests')}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid #7c3aed' : '2px solid transparent',
            color: activeTab === 'requests' ? '#7c3aed' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '14px',
            position: 'relative' as const,
          }}
        >
          Requests
          {(pendingRequests.length > 0 || sentRequests.length > 0) && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '20px',
              background: pendingRequests.length > 0 ? '#ef4444' : '#f59e0b',
              color: 'white',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
            }}>
              {pendingRequests.length + sentRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
      }}>
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <>
            <div style={{
              background: 'rgba(124,58,237,0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
              }}>
                {partnerName?.[0]?.toUpperCase()}
              </div>
              <h4 style={{
                fontSize: '18px',
                color: '#f0f0f0',
                marginBottom: '4px',
                fontFamily: "'Georgia', serif",
              }}>
                {partnerName}
              </h4>
              {partnerId && (
                <p style={{
                  fontSize: '10px',
                  color: '#60607a',
                  marginTop: '4px',
                }}>
                  ID: {partnerId.slice(0, 8)}...
                </p>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '16px',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '20px', color: '#7c3aed', marginBottom: '4px' }}>⏱️</div>
                  <div style={{ fontSize: '11px', color: '#60607a' }}>Duration</div>
                  <div style={{ fontSize: '14px', color: '#f0f0f0' }}>{chatDuration}</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '20px', color: '#7c3aed', marginBottom: '4px' }}>💬</div>
                  <div style={{ fontSize: '11px', color: '#60607a' }}>Messages</div>
                  <div style={{ fontSize: '14px', color: '#f0f0f0' }}>{messageCount}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleAddFriend}
                style={{
                  ...actionButtonStyle,
                  opacity: partnerId ? 1 : 0.5,
                  cursor: partnerId ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => partnerId && (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
                onMouseLeave={(e) => partnerId && (e.currentTarget.style.background = 'transparent')}
                disabled={!partnerId}
              >
                ➕ Add {partnerName} as Friend
                {!partnerId && ' (loading...)'}
              </button>
              <button
                onClick={handleReport}
                style={actionButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ⚠️ Report User
              </button>
              <button
                onClick={handleBlock}
                style={{...actionButtonStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)'}}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                🚫 Block User
              </button>
            </div>
          </>
        )}

        {/* FRIENDS TAB */}
        {activeTab === 'friends' && (
          <div>
            <h4 style={{
              fontSize: '16px',
              color: '#f0f0f0',
              marginBottom: '16px',
              fontFamily: "'Georgia', serif",
            }}>
              Your Friends
            </h4>

            {friends.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#60607a',
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                <p>No friends yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Add friends during chat to see them here
                </p>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend.id} style={friendItemStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={friendAvatarStyle}>
                      {friend.display_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#f0f0f0', fontWeight: 500 }}>
                        {friend.display_name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      addDebugLog(`🗑️ Removing friend: ${friend.display_name}`)
                      removeFriend(friend.friend_id)
                    }}
                    style={removeButtonStyle}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div>
            {/* Manual refresh button */}
            <button
              onClick={handleRefresh}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '6px',
                color: '#a0a0b0',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
            >
              <span>🔄</span> Refresh Requests
            </button>

            {/* Debug Button */}
            <button
              onClick={debugCheckDatabase}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🐞</span> Debug: Check Database
            </button>

            <h4 style={{
              fontSize: '16px',
              color: '#f0f0f0',
              marginBottom: '16px',
              fontFamily: "'Georgia', serif",
            }}>
              Friend Requests
            </h4>

            {/* Received Requests */}
            {pendingRequests.length > 0 && (
              <>
                <h5 style={{
                  fontSize: '13px',
                  color: '#7c3aed',
                  marginBottom: '8px',
                }}>
                  Received ({pendingRequests.length})
                </h5>
                {pendingRequests.map(request => (
                  <div key={request.id} style={requestItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={friendAvatarStyle}>
                        {request.display_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#f0f0f0', fontWeight: 500 }}>
                          {request.display_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#f59e0b' }}>
                          ⏳ Wants to connect
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          addDebugLog(`✅ Accepting request from ${request.display_name}`)
                          acceptRequest(request.id)
                        }}
                        style={acceptButtonStyle}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          addDebugLog(`❌ Rejecting request from ${request.display_name}`)
                          rejectRequest(request.id)
                        }}
                        style={rejectButtonStyle}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <>
                <h5 style={{
                  fontSize: '13px',
                  color: '#f59e0b',
                  marginBottom: '8px',
                  marginTop: pendingRequests.length > 0 ? '20px' : 0,
                }}>
                  Sent ({sentRequests.length})
                </h5>
                {sentRequests.map(req => (
                  <div key={req.id} style={{...friendItemStyle, opacity: 0.7}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={friendAvatarStyle}>
                        {req.display_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#f0f0f0' }}>{req.display_name}</div>
                        <div style={{ fontSize: '10px', color: '#f59e0b' }}>⏳ Pending</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#60607a',
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <p>No pending requests</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Button - Bottom Right */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(124,58,237,0.2)',
      }}>
        <Link href="/settings/profile" style={{ textDecoration: 'none' }}>
          <button
            onClick={() => addDebugLog(`⚙️ Settings button clicked`)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '8px',
              color: '#f0f0f0',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
          >
            <span style={{ fontSize: '18px' }}>⚙️</span>
            Settings
          </button>
        </Link>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

const actionButtonStyle = {
  width: '100%',
  padding: '14px',
  background: 'transparent',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '10px',
  color: '#f0f0f0',
  fontSize: '15px',
  textAlign: 'left' as const,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const friendItemStyle = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const friendAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
}

const removeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#ef4444',
  fontSize: '18px',
  cursor: 'pointer',
  padding: '4px 8px',
}

const requestItemStyle = {
  background: 'rgba(124,58,237,0.1)',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '8px',
}

const acceptButtonStyle = {
  flex: 1,
  padding: '8px',
  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
}

const rejectButtonStyle = {
  flex: 1,
  padding: '8px',
  background: 'transparent',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: '6px',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: '13px',
}