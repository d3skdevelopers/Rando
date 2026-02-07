// app/src/components/guest/GuestProgress.tsx
'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Lock, Unlock, MessageSquare, Save, Image as ImageIcon, Crown } from 'lucide-react';

interface GuestProgressProps {
  currentChatCount: number;
  onUpgrade: () => void;
  onContinue: () => void;
}

const GuestProgress = ({ currentChatCount, onUpgrade, onContinue }: GuestProgressProps) => {
  const progress = Math.min(currentChatCount, 5);
  const nextMilestone = progress < 5 ? progress + 1 : 5;

  const milestones = [
    { chat: 1, feature: 'Basic text chat', icon: MessageSquare, unlocked: true },
    { chat: 3, feature: 'Save 1 conversation', icon: Save, unlocked: progress >= 3 },
    { chat: 5, feature: 'Unlock image sharing', icon: ImageIcon, unlocked: progress >= 5 },
    { chat: 'Account', feature: 'All premium features', icon: Crown, unlocked: false },
  ];

  const getNextFeature = () => {
    if (progress < 3) return 'Save conversations';
    if (progress < 5) return 'Image sharing';
    return 'All premium features';
  };

  return (
    <Card variant="gradient" padding="lg" className="border-rando-purple/50">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="guest" size="lg" dot leftIcon="🎭">
          Guest Mode • Chat #{currentChatCount}
        </Badge>
        <div className="text-sm text-text-secondary">
          {5 - progress} chats until next unlock
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Progress to next feature</span>
            <span className="text-rando-gold font-semibold">
              {progress}/5 chats
            </span>
          </div>
          <div className="h-2 bg-rando-input rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rando-purple to-rando-gold rounded-full transition-all duration-500"
              style={{ width: `${(progress / 5) * 100}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary">
            Next: <span className="text-rando-gold font-semibold">{getNextFeature()}</span> at chat #{nextMilestone}
          </p>
        </div>

        {/* Milestones */}
        <div className="grid grid-cols-2 gap-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.chat}
              className={`p-3 rounded-lg border ${
                milestone.unlocked
                  ? 'border-success/30 bg-success/5'
                  : 'border-rando-border bg-rando-input/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`p-1.5 rounded ${
                    milestone.unlocked
                      ? 'bg-success/20 text-success'
                      : 'bg-rando-input text-text-muted'
                  }`}
                >
                  {milestone.unlocked ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-text-secondary">
                    Chat {milestone.chat}
                  </div>
                  <div className="text-sm font-medium">
                    {milestone.feature}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={onContinue}
            leftIcon="💬"
          >
            Continue Chatting ({progress}/5)
          </Button>
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={onUpgrade}
            leftIcon="⚡"
          >
            Upgrade Now
          </Button>
        </div>

        {/* Guest Limitations */}
        <div className="pt-4 border-t border-rando-border">
          <p className="text-sm text-text-secondary">
            ⚠️ <span className="font-semibold">Guest limitations:</span> Messages are not saved, 
            no image sharing, and chats expire after 24 hours.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default GuestProgress;