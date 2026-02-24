'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatSidebar } from './ChatSidebar'
import { ChatModals } from './ChatModals'
import { TypingIndicator } from './TypingIndicator'
import { SafetyWarning } from './SafetyWarning'
import { RegisterNudge } from './RegisterNudge'
import { supabase } from '@/lib/supabase/client'

interface ChatInterfaceProps {
  sessionId: string
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const router = useRouter()
  const chat = useChat(sessionId)
  const [partnerId, setPartnerId] = useState<string | undefined>()

  const [showSidebar, setShowSidebar] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [showSafetyWarning, setShowSafetyWarning] = useState(false)
  const [chatDuration, setChatDuration] = useState('0m')
  const [messageCount, setMessageCount] = useState(0)
  const [leftAt, setLeftAt] = useState<string | undefined>()
  const [showLeftMessage, setShowLeftMessage] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Load partner ID directly from session (CORRECTED)
  useEffect(() => {
    const loadPartnerId = async () => {
      if (!chat.guestSession?.guest_id) {
        console.log('⏳ Waiting for guest session...')
        return
      }

      console.log('🔍 Loading partner ID for session:', sessionId)
      console.log('👤 Current guest ID:', chat.guestSession.guest_id)

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('user1_id, user2_id, user1_display_name, user2_display_name')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('❌ Error loading session:', error)
        return
      }

      console.log('📊 Session data:', session)

      // CORRECT LOGIC: partner is the OTHER user
      if (session.user1_id === chat.guestSession.guest_id) {
        setPartnerId(session.user2_id)
        console.log('✅ Partner ID is user2:', session.user2_id, session.user2_display_name)
      } else {
        setPartnerId(session.user1_id)
        console.log('✅ Partner ID is user1:', session.user1_id, session.user1_display_name)
      }
    }

    loadPartnerId()
  }, [sessionId, chat.guestSession])

  // Update stats
  useEffect(() => {
    if (chat.messages.length > 0) {
      setMessageCount(chat.messages.length)

      const firstMsg = new Date(chat.messages[0].created_at)
      const now = new Date()
      const diff = Math.floor((now.getTime() - firstMsg.getTime()) / 60000)
      setChatDuration(`${diff}m`)
    }
  }, [chat.messages])

  // Handle partner leaving - show message and disable input
  useEffect(() => {
    if (chat.partnerLeft && !leftAt) {
      setLeftAt(new Date().toISOString())
      setShowLeftMessage(true)
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setShowLeftMessage(false)
      }, 5000)
    }
  }, [chat.partnerLeft, leftAt])

  // Handle escape key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSidebar(false)
        setShowReport(false)
        setSelectedImage(null)
        setEditImage(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleEndChat = async () => {
    await chat.endChat()
    router.push(`/chat/end/${sessionId}`)
  }

  const handleReport = async (reason: string, category: string = 'other') => {
    if (!chat.guestSession || !sessionId) return
    
    try {
      await chat.reportUser(reason, category)
      setShowReport(false)
      setShowSafetyWarning(true)
      setTimeout(() => setShowSafetyWarning(false), 3000)
    } catch (err) {
      console.error('Report error:', err)
    }
  }

  const handleBlock = async () => {
    if (confirm('Block this user? They will not be able to match with you again.')) {
      await chat.blockUser()
      await handleEndChat()
    }
  }

  const handleAddFriend = async () => {
    await chat.addFriend()
    setShowSafetyWarning(true)
    setTimeout(() => setShowSafetyWarning(false), 3000)
  }

  const handleImageUpload = async (file: File) => {
    if (!chat.guestSession || !sessionId) return
    await chat.uploadImage(file)
  }

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 'min(600px, 80vw)', height: 'min(600px, 80vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          animation: 'float1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 'min(500px, 70vw)', height: 'min(500px, 70vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
          animation: 'float2 10s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
      `}</style>

      {/* Partner Left Message - Shows when partner leaves */}
      {showLeftMessage && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '30px',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
          backdropFilter: 'blur(4px)',
          animation: 'slideDown 0.3s ease',
        }}>
          👋 {chat.partnerName} has left the chat
        </div>
      )}

      {/* Header */}
      <ChatHeader
        partnerName={chat.partnerName}
        isOnline={true}
        isTyping={chat.isTyping}
        partnerLeft={chat.partnerLeft}
        onOpenSidebar={() => {
          console.log('📊 Opening sidebar, partnerId:', partnerId)
          setShowSidebar(true)
        }}
        onReport={() => setShowReport(true)}
        onEndChat={handleEndChat}
      />

      {/* Main Chat Area */}
      <div style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}>
        <ChatMessages
          messages={chat.messages}
          currentUserId={chat.guestSession?.guest_id}
          currentUserName={chat.guestSession?.display_name}
          partnerLeft={chat.partnerLeft}
          onImageClick={(url) => setSelectedImage(url)}
          messagesEndRef={chat.messagesEndRef}
          leftAt={leftAt}
        />

        {chat.isTyping && !chat.partnerLeft && (
          <TypingIndicator
            names={[chat.partnerName || '']}
            isVisible={true}
          />
        )}
      </div>

      {/* Register nudge — shown after 5 messages, dismissed once */}
      {!chat.partnerLeft && messageCount >= 5 && (
        <RegisterNudge chatId={sessionId} />
      )}

      {/* Input Area - Hidden when partner leaves */}
      {!chat.partnerLeft && (
        <ChatInput
          sessionId={sessionId}
          onSendMessage={async (content) => {
            await chat.sendMessage(content)
          }}
          onTyping={() => chat.sendTyping(true)}
          isSending={chat.isSending}
          onEditImage={(url) => setEditImage(url)}
        />
      )}

      {/* Safety Warning */}
      {showSafetyWarning && (
        <SafetyWarning
          message="Friend request sent!"
          type="success"
          onClose={() => setShowSafetyWarning(false)}
        />
      )}

      {/* Sidebar - With CORRECT partnerId */}
      <ChatSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        partnerName={chat.partnerName || ''}
        partnerId={partnerId}  // This is now the CORRECT partner ID
        chatDuration={chatDuration}
        messageCount={messageCount}
        onReport={() => {
          setShowSidebar(false)
          setShowReport(true)
        }}
        onBlock={handleBlock}
        onAddFriend={handleAddFriend}
        guestId={chat.guestSession?.guest_id}
      />

      {/* Modals */}
      <ChatModals
        showReport={showReport}
        onCloseReport={() => setShowReport(false)}
        onSubmitReport={handleReport}
        selectedImage={selectedImage}
        onCloseImage={() => setSelectedImage(null)}
        editImage={editImage}
        onCloseEdit={() => setEditImage(null)}
        onSendEdit={(file) => {
          handleImageUpload(file)
          setEditImage(null)
        }}
      />

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  )
}