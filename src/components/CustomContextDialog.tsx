'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { getFieldError, contextNameSchema } from '../lib/validation';

interface CustomContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, color: string) => boolean | void;
  initialName?: string;
  initialColor?: string;
  mode?: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#6D59E0',
  '#8B5CF6',
  '#EC4899',
  '#A855F7',
];

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CustomContextDialog: React.FC<CustomContextDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialName = '',
  initialColor = PRESET_COLORS[0],
  mode = 'create',
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setSelectedColor(initialColor || PRESET_COLORS[0]);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, initialName, initialColor]);

  const handleSave = () => {
    const schemaError = getFieldError(contextNameSchema, name);
    if (schemaError) { setError(schemaError); return; }

    const trimmed = name.trim();
    const saved = onSave(trimmed, selectedColor);
    if (saved === false) {
      setError('A context with this name already exists.');
      return;
    }
    setName('');
    setSelectedColor(PRESET_COLORS[0]);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-[360px] overflow-hidden rounded-2xl border border-border/60 shadow-elevated bg-background">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="font-display text-[15px] font-semibold tracking-tight text-foreground">
            {mode === 'edit' ? 'Edit Context' : 'New Context'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Name
            </label>
            <div className="relative flex items-center">
              <div
                className="absolute left-3 w-[7px] h-[7px] rounded-full flex-shrink-0 transition-colors duration-150"
                style={{ backgroundColor: selectedColor }}
              />
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="e.g., Deep Work, Client, Exercise"
                maxLength={50}
                className={`w-full pl-8 pr-3 h-9 rounded-xl bg-muted/50 border text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none focus:bg-background transition-colors duration-150 ${
                  error ? 'border-destructive focus:border-destructive' : 'border-border/60 focus:border-primary/50'
                }`}
              />
            </div>
            {error && (
              <p className="text-[11px] text-destructive">{error}</p>
            )}
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="relative w-6 h-6 rounded-full transition-transform duration-100 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <CheckIcon className="text-white drop-shadow-sm" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/50 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-4 text-xs font-semibold"
          >
            {mode === 'edit' ? 'Save' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomContextDialog;
