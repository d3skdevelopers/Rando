'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export default function Matchmaking({ onMatchFound, isGuest = false, guestId }: any) {
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);
  const [timer, setTimer] = useState(0);

  const startSearch = async () => {
    const userId = isGuest ? guestId : user?.id;
    const username = isGuest ? `Guest_${guestId?.slice(-4)}` : user?.username || 'User';
    
    setSearching(true);
    setTimer(0);
    
    // 1. Join queue in database
    await supabase
      .from('matchmaking_queue')
      .upsert({
        user_id: userId,
        username: username,
        looking_for: 'text',
        is_guest: isGuest,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    
    // 2. Poll for matches every 2 seconds
    const interval = setInterval(async () => {
      if (!searching) {
        clearInterval(interval);
        return;
      }
      
      setTimer(prev => prev + 1);
      
      // Check if we've been matched
      const { data: ourEntry } = await supabase
        .from('matchmaking_queue')
        .select('matched_with, matched_at')
        .eq('user_id', userId)
        .single();
      
      if (ourEntry?.matched_with) {
        clearInterval(interval);
        
        // Create chat session
        const sessionId = uuidv4();
        await supabase.from('chat_sessions').insert({
          id: sessionId,
          user1_id: userId,
          user2_id: ourEntry.matched_with,
          session_type: 'text',
          started_at: new Date().toISOString(),
          is_guest1: isGuest,
          is_guest2: true // Assume other is guest for now
        });
        
        onMatchFound(sessionId);
        return;
      }
      
      // 3. Try to find a match for others
      const { data: waitingUsers } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .is('matched_at', null)
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (waitingUsers?.length) {
        const match = waitingUsers[0];
        
        // Mark both as matched
        await Promise.all([
          supabase
            .from('matchmaking_queue')
            .update({ 
              matched_with: userId, 
              matched_at: new Date().toISOString() 
            })
            .eq('user_id', match.user_id),
          supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', userId)
        ]);
        
        // Create session
        const sessionId = uuidv4();
        await supabase.from('chat_sessions').insert({
          id: sessionId,
          user1_id: match.user_id,
          user2_id: userId,
          session_type: 'text',
          started_at: new Date().toISOString(),
          is_guest1: match.is_guest,
          is_guest2: isGuest
        });
        
        clearInterval(interval);
        onMatchFound(sessionId);
      }
    }, 2000);
  };

  // ... rest of your UI code
}