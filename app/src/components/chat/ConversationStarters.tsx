// app/src/components/chat/ConversationStarters.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Sparkles, RefreshCw, Star, MessageSquare } from 'lucide-react';

interface ConversationStartersProps {
  onSelect: (starter: string) => void;
}

const conversationStarters = [
  {
    category: 'Fun & Casual',
    starters: [
      "What's the most interesting thing you've learned recently?",
      "If you could master any skill instantly, what would it be?",
      "What's your go-to music when you need to focus?",
      "What's something that always makes you laugh?",
    ],
    emoji: '😄',
  },
  {
    category: 'Deep & Thoughtful',
    starters: [
      "What's one thing you wish everyone understood about you?",
      "What experience has changed your perspective the most?",
      "What does 'success' mean to you personally?",
      "What's something you're unlearning or relearning lately?",
    ],
    emoji: '🤔',
  },
  {
    category: 'Student Life',
    starters: [
      "What's the most interesting class you're taking this semester?",
      "What's your study routine like when exams are coming?",
      "What's one thing you wish your professors understood?",
      "How do you balance studies with social life?",
    ],
    emoji: '🎓',
  },
  {
    category: 'Creative & Arts',
    starters: [
      "What's a creative project you're currently excited about?",
      "If you could collaborate with any artist/creator, who would it be?",
      "What's something you find beautiful that others might overlook?",
      "What's your favorite way to express yourself creatively?",
    ],
    emoji: '🎨',
  },
];

const ConversationStarters = ({ onSelect }: ConversationStartersProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (starter: string) => {
    setFavorites((prev) =>
      prev.includes(starter)
        ? prev.filter((s) => s !== starter)
        : [...prev, starter]
    );
  };

  const getRandomStarter = () => {
    const allStarters = conversationStarters.flatMap(cat => cat.starters);
    const randomIndex = Math.floor(Math.random() * allStarters.length);
    onSelect(allStarters[randomIndex]);
  };

  const currentCategory = conversationStarters[selectedCategory];

  return (
    <Card variant="default" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-rando-gold" />
          <h3 className="font-semibold">💡 Conversation Starters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={getRandomStarter}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Random
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
        {conversationStarters.map((category, index) => (
          <button
            key={category.category}
            onClick={() => setSelectedCategory(index)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === index
                ? 'bg-rando-gold text-rando-bg'
                : 'bg-rando-input text-text-secondary hover:text-text-primary'
            }`}
          >
            {category.emoji} {category.category}
          </button>
        ))}
      </div>

      {/* Starters List */}
      <div className="space-y-2 mb-4">
        {currentCategory.starters.map((starter, index) => (
          <div
            key={index}
            className="group flex items-center justify-between p-3 rounded-lg bg-rando-input hover:bg-rando-input/80 transition-colors"
          >
            <button
              onClick={() => onSelect(starter)}
              className="flex-1 text-left hover:text-rando-gold transition-colors"
            >
              {starter}
            </button>
            <button
              onClick={() => toggleFavorite(starter)}
              className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rando-card transition-all"
            >
              <Star
                className={`h-4 w-4 ${
                  favorites.includes(starter)
                    ? 'fill-rando-gold text-rando-gold'
                    : 'text-text-secondary'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="border-t border-rando-border pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <Star className="h-4 w-4 text-rando-gold" />
            <h4 className="text-sm font-semibold">Your Favorites</h4>
          </div>
          <div className="space-y-2">
            {favorites.slice(0, 3).map((starter, index) => (
              <div
                key={index}
                className="p-2 rounded bg-rando-gold/10 border border-rando-gold/30"
              >
                <div className="text-sm">{starter}</div>
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(starter)}
                  >
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-rando-purple/20 to-rando-gold/10 border border-rando-border">
        <div className="flex items-center space-x-2 mb-1">
          <Sparkles className="h-4 w-4 text-rando-gold" />
          <span className="text-sm font-medium">Pro Tip</span>
        </div>
        <p className="text-xs text-text-secondary">
          People respond best to open-ended questions that show genuine interest in their thoughts and experiences.
        </p>
      </div>
    </Card>
  );
};

export default ConversationStarters;