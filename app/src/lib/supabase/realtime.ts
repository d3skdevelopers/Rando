// app/src/lib/supabase/realtime.ts
import { supabase } from './client';
import { Message, ChatSession } from '@/types';

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

  async subscribeToOnlineUsers(callback: (count: number) => void) {
    try {
      // Count active users in matchmaking queue
      const { count, error } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting online users:', error);
        callback(1);
        return null;
      }

      console.log(`Online users (searching): ${count || 0}`);
      callback(count || 0);

      // Subscribe to real-time updates
      const channel = supabase
        .channel('online-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matchmaking_queue',
          },
          async () => {
            const { count: newCount } = await supabase
              .from('matchmaking_queue')
              .select('*', { count: 'exact', head: true });
            
            console.log(`Online users updated: ${newCount || 0}`);
            callback(newCount || 0);
          }
        )
        .subscribe();

      this.channels.set('online-count', channel);
      return channel;

    } catch (error) {
      console.error('Failed to subscribe to online users:', error);
      callback(1);
      return null;
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