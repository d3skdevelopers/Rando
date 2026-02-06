// app/src/pages/LandingPage.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signIn, signUp } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick anonymous access
  const handleQuickChat = () => {
    router.push('/chat');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, username || `user_${Date.now()}`);
      }

      if (result.success) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created!');
        router.push('/chat');
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Simple Header */}
      <div className="text-center pt-16 px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-gold via-white to-gold bg-clip-text text-transparent">
          RANDO
        </h1>
        <p className="text-xl text-gray-300 mb-8">Chat with random people. 100% free.</p>
      </div>

      {/* Main Content - Focus on Quick Action */}
      <div className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        {/* Quick Chat Button (Big & Prominent) */}
        <div className="text-center mb-12">
          <button
            onClick={handleQuickChat}
            className="btn-primary text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:scale-105 transition-transform"
          >
            🎯 Start Random Chat Now
          </button>
          <p className="text-gray-400 mt-4">No account needed • Instant matching</p>
        </div>

        {/* Optional Auth (Collapsible) */}
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold hover:text-gold/80 text-lg"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </button>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-center">
              {isLogin ? 'Login to Save Chats' : 'Sign Up for Profile'}
            </h3>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (optional)"
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-secondary w-full py-3"
              >
                {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              <p>Sign up to: Save favorites • Get notifications • Earn badges</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gold">24/7</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">100%</div>
            <div className="text-sm text-gray-400">Free</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">Safe</div>
            <div className="text-sm text-gray-400">Chat</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">Global</div>
            <div className="text-sm text-gray-400">Users</div>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="py-8 text-center text-gray-500 text-sm">
        <p>Chat randomly • Meet authentically • No subscriptions ever</p>
      </div>
    </div>
  );
}