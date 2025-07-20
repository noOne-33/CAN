'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ColorSwatchProps {
  color: string;
  hex: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function ColorSwatch({ color, hex, isSelected, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-8 h-8 rounded-full border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80',
        isSelected ? 'border-primary shadow-md scale-110' : 'border-muted hover:border-foreground/50'
      )}
      style={{ backgroundColor: hex }}
      aria-label={`Select color ${color}`}
      title={color}
    >
      {isSelected && <Check size={16} className="text-primary-foreground w-full h-full p-1" strokeWidth={3} />}
      <span className="sr-only">{color}</span>
    </button>
  );
}
