'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';

const moods = [
  { value: 'excited', emoji: '😄', label: 'Entusiasmado' },
  { value: 'energized', emoji: '⚡', label: 'Energizado' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'tired', emoji: '😴', label: 'Cansado' },
  { value: 'anxious', emoji: '😰', label: 'Ansioso' },
];

interface MoodSelectorProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

export function MoodSelector({ label, value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-3">
        {moods.map((mood) => (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              value === mood.value
                ? 'border-blue-600 bg-blue-50 scale-110'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className="text-xs font-medium">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
