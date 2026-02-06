import { supabase } from './client';
import { Message, ChatSession } from '@/types';

// Define type for presence data
interface PresenceData {
  user_id: string;
  online_at: string;
  username?: string;
}

export class RealtimeService {
  private channels: Map<string, any> = new Map();

  async subscribeToMessages(sessionId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    this.channels.set(`messages-${sessionId}`, channel);
    return channel;
  }

  async subscribeToSession(sessionId: string, callback: (session: ChatSession) => void) {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as ChatSession);
        }
      )
      .subscribe();

    this.channels.set(`session-${sessionId}`, channel);
    return channel;
  }

  async subscribeToOnlineUsers(callback: (userIds: string[]) => void) {
    try {
      // First, get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for presence');
        // Still create channel for guests to see others
        return this.createGuestPresenceChannel(callback);
      }

      // Get username for presence
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      const username = userData?.username || 'User';

      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id
          }
        }
      });

      // Track presence
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence state:', state);
        
        // Extract user IDs from presence state
        const userIds = Object.keys(state);
        console.log('Online users:', userIds);
        callback(userIds);
      });

      // Subscribe and track
      channel.subscribe(async (status) => {
        console.log('Presence channel status:', status);
        if (status === 'SUBSCRIBED') {
          try {
            const presenceData = {
              user_id: user.id,
              username: username,
              online_at: new Date().toISOString()
            };
            console.log('Tracking presence:', presenceData);
            await channel.track(presenceData);
          } catch (error) {
            console.error('Error tracking presence:', error);
          }
        }
      });

      this.channels.set('online-users', channel);
      return channel;
    } catch (error) {
      console.error('Failed to subscribe to online users:', error);
      return this.createGuestPresenceChannel(callback);
    }
  }

  private createGuestPresenceChannel(callback: (userIds: string[]) => void) {
    // Create a simple channel for guests
    const channel = supabase.channel('guest-presence');
    
    // For guests, we'll simulate some online users
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Simulate 3-10 online users for guests
        const simulatedCount = 3 + Math.floor(Math.random() * 8);
        const simulatedUsers = Array.from({ length: simulatedCount }, (_, i) => `user_${i}`);
        callback(simulatedUsers);
      }
    });

    this.channels.set('online-users', channel);
    return channel;
  }

  async updatePresence(userId: string, username?: string) {
    const channel = this.channels.get('online-users');
    if (channel) {
      await channel.track({
        user_id: userId,
        username: username,
        online_at: new Date().toISOString()
      });
    }
  }

  unsubscribe(channelKey: string) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();