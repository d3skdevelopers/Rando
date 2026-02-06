// app/src/components/Matchmaking.tsx - SIMPLE DIRECT MATCHING
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface MatchmakingProps {
  onMatchFound: (sessionId: string) => void;
  isGuest?: boolean;
  guestId?: string;
}

export default function Matchmaking({ onMatchFound, isGuest = false, guestId }: MatchmakingProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [lookingFor, setLookingFor] = useState<'text' | 'video'>('text');
  const [interests, setInterests] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [matchFound, setMatchFound] = useState(false);

  const interestsList = [
    'Gaming', 'Music', 'Movies', 'Sports', 'Technology',
    'Art', 'Travel', 'Food', 'Books', 'Fitness',
    'Fashion', 'Science', 'Business', 'Education', 'Health'
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // SIMPLE DIRECT MATCHING FUNCTION
  const startSearch = async () => {
    if (!user && !isGuest) {
      toast.error('Please start a chat session first');
      return;
    }

    setSearching(true);
    setTimer(0);
    setMatchFound(false);

    const userId = isGuest ? guestId : user?.id;
    const username = isGuest ? `Guest_${guestId?.slice(-4) || 'User'}` : user?.username || 'User';

    if (!userId) {
      toast.error('Unable to start search');
      setSearching(false);
      return;
    }

    toast.success('🔍 Searching for someone...');

    // Start timer
    const timerInterval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    try {
      // SIMPLE APPROACH: Create a waiting room in localStorage
      const waitingRoomKey = 'rando_waiting_room';
      const currentTime = Date.now();
      
      // Check if someone else is waiting
      const waitingUser = localStorage.getItem(waitingRoomKey);
      
      if (waitingUser) {
        // Someone is waiting! Parse their data
        const { waitingUserId, waitingUsername, waitingTime, waitingLookingFor } = JSON.parse(waitingUser);
        
        // Check if it's not the same user (prevent self-match)
        if (waitingUserId !== userId && waitingLookingFor === lookingFor) {
          clearInterval(timerInterval);
          setMatchFound(true);
          
          // Remove from waiting room
          localStorage.removeItem(waitingRoomKey);
          
          // Create chat session
          const sessionId = `session_${currentTime}_${Math.random().toString(36).slice(-6)}`;
          
          // Save to database if possible
          try {
            const { error: sessionError } = await supabase
              .from('chat_sessions')
              .insert({
                id: sessionId,
                user1_id: waitingUserId,
                user2_id: userId,
                session_type: lookingFor,
                started_at: new Date().toISOString(),
                is_guest1: waitingUserId.startsWith('guest_'),
                is_guest2: isGuest
              });

            if (sessionError) {
              console.log('Session save failed, using local:', sessionError);
            }
          } catch (dbError) {
            console.log('Database error, continuing locally:', dbError);
          }

          toast.success(`✅ Matched with ${waitingUsername}!`);
          
          // Short delay for UX
          setTimeout(() => {
            onMatchFound(sessionId);
          }, 1500);
          
          return;
        }
      }

      // No one waiting, so join the waiting room
      localStorage.setItem(waitingRoomKey, JSON.stringify({
        waitingUserId: userId,
        waitingUsername: username,
        waitingTime: currentTime,
        waitingLookingFor: lookingFor,
        waitingInterests: interests
      }));

      // Set timeout to clear old waiting room (5 minutes)
      setTimeout(() => {
        const currentWaiting = localStorage.getItem(waitingRoomKey);
        if (currentWaiting) {
          const { waitingUserId } = JSON.parse(currentWaiting);
          if (waitingUserId === userId) {
            localStorage.removeItem(waitingRoomKey);
          }
        }
      }, 5 * 60 * 1000);

      // Poll for a match every 2 seconds
      const pollInterval = setInterval(() => {
        // Check if we've been matched (someone else found us)
        const checkWaiting = localStorage.getItem(waitingRoomKey);
        if (!checkWaiting) {
          // We've been matched!
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setMatchFound(true);
          
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(-6)}`;
          
          toast.success('✅ Someone found you! Connecting...');
          
          setTimeout(() => {
            onMatchFound(sessionId);
          }, 1500);
        }
      }, 2000);

      // Set timeout to stop searching after 30 seconds
      setTimeout(() => {
        if (!matchFound) {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          localStorage.removeItem(waitingRoomKey);
          toast.error('No match found. Try again!');
          setSearching(false);
        }
      }, 30000);

    } catch (error) {
      console.error('Matchmaking error:', error);
      toast.error('Error searching');
      setSearching(false);
    }
  };

  const stopSearch = () => {
    setSearching(false);
    setTimer(0);
    setMatchFound(false);
    
    // Remove from waiting room
    localStorage.removeItem('rando_waiting_room');
    
    toast('Search stopped');
  };

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (searching && !matchFound) {
      timerInterval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [searching, matchFound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-2">
        {isGuest ? 'Anonymous Chat' : 'Find Someone to Chat With'}
      </h2>
      <p className="text-gray-400 text-center mb-8">
        {isGuest 
          ? 'Chat with random people. No account needed.'
          : 'Meet interesting people from around the world'}
      </p>

      {isGuest && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-gold/20 rounded-xl border border-gold/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">🎭</span>
            <span className="font-bold text-gold">Guest Mode</span>
          </div>
          <p className="text-sm text-center text-gray-300">
            Chat anonymously • No sign up required • Messages not saved
          </p>
          <div className="text-center mt-2">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gold hover:text-gold/80 underline"
            >
              Create free account for more features
            </button>
          </div>
        </div>
      )}

      {!searching ? (
        <>
          {/* Chat Type Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">What type of chat?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setLookingFor('text')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  lookingFor === 'text'
                    ? 'border-gold bg-gold bg-opacity-10'
                    : 'border-gray-700 hover:border-gold'
                }`}
              >
                <div className="text-4xl mb-2">💬</div>
                <h4 className="font-bold text-lg mb-2">Text Chat</h4>
                <p className="text-gray-400 text-sm">
                  {isGuest 
                    ? 'Anonymous text conversation'
                    : 'Classic text-based conversation. Safe and anonymous.'}
                </p>
              </button>
            </div>
          </div>

          {/* Interests Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Select your interests (optional)</h3>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                    interests.includes(interest)
                      ? 'bg-gold text-dark border-gold'
                      : 'border-gray-700 hover:border-gold'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-3">
              {interests.length === 0
                ? 'No interests selected - will match with anyone'
                : `${interests.length} interest${interests.length === 1 ? '' : 's'} selected`}
            </p>
          </div>

          <button
            onClick={startSearch}
            className="btn-primary w-full py-4 text-lg"
          >
            {isGuest ? 'Start Anonymous Chat' : 'Start Random Chat'}
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="animate-pulse-slow text-6xl mb-6">
            {matchFound ? '✅' : '🔍'}
          </div>

          {matchFound ? (
            <>
              <h3 className="text-2xl font-bold mb-2 text-gold">Match Found!</h3>
              <p className="text-gray-400 mb-6">
                Starting your chat...
              </p>
              <div className="w-20 h-20 mx-auto mb-6 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-2">Looking for a match...</h3>
              <p className="text-gray-400 mb-6">
                {isGuest 
                  ? 'Finding someone random for you to chat with'
                  : 'Searching for someone with similar interests'}
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <div className="text-3xl font-bold text-gold mb-2">{formatTime(timer)}</div>
                  <p className="text-gray-400">Time searching</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">
                    {timer < 5 ? 'Quick match' : 'Still searching'}
                  </div>
                  <p className="text-gray-400">Status</p>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-primary to-gold h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(timer * 3, 100)}%` }}
                ></div>
              </div>

              <button
                onClick={stopSearch}
                className="btn-secondary w-full py-3"
              >
                Stop Searching
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gold">100%</div>
            <div className="text-gray-400 text-sm">Free</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">24/7</div>
            <div className="text-gray-400 text-sm">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">
              {isGuest ? '🎭' : 'Safe'}
            </div>
            <div className="text-gray-400 text-sm">
              {isGuest ? 'Anonymous' : 'Moderated'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}