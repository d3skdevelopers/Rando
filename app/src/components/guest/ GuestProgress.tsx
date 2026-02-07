'use client';

import React from 'react';
import { Button } from '../ui/Button';

interface GuestProgressProps {
  currentChatCount: number;
  onUpgrade: () => void;
  onContinue: () => void;
}

const GuestProgress = ({ currentChatCount, onUpgrade, onContinue }: GuestProgressProps) => {
  const progress = Math.min(currentChatCount, 5);
  const nextMilestone = progress < 5 ? progress + 1 : 5;

  const milestones = [
    { chat: 1, feature: 'Basic text chat', unlocked: true },
    { chat: 3, feature: 'Save 1 conversation', unlocked: progress >= 3 },
    { chat: 5, feature: 'Unlock image sharing', unlocked: progress >= 5 },
    { chat: 'Account', feature: 'All premium features', unlocked: false },
  ];

  const getNextFeature = () => {
    if (progress < 3) return 'Save conversations';
    if (progress < 5) return 'Image sharing';
    return 'All premium features';
  };

  return (
    <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-xl border border-[#2E235E]/50">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-[#2E235E] to-[#4A3F8C] text-white">
          🎭 Guest Mode • Chat #{currentChatCount}
        </div>
        <div className="text-sm text-[#8a8aa3]">
          {5 - progress} chats until next unlock
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8aa3]">Progress to next feature</span>
            <span className="text-[#D4AF37] font-semibold">
              {progress}/5 chats
            </span>
          </div>
          <div className="h-2 bg-[#252540] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2E235E] to-[#D4AF37] rounded-full transition-all duration-500"
              style={{ width: `${(progress / 5) * 100}%` }}
            />
          </div>
          <p className="text-sm text-[#8a8aa3]">
            Next: <span className="text-[#D4AF37] font-semibold">{getNextFeature()}</span> at chat #{nextMilestone}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={onContinue}
          >
            💬 Continue Chatting ({progress}/5)
          </Button>
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={onUpgrade}
          >
            ⚡ Upgrade Now
          </Button>
        </div>

        {/* Guest Limitations */}
        <div className="pt-4 border-t border-[#2d2d4a]">
          <p className="text-sm text-[#8a8aa3]">
            ⚠️ <span className="font-semibold">Guest limitations:</span> Messages are not saved, 
            no image sharing, and chats expire after 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestProgress;