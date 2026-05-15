'use client';

/**
 * DatePicker — pure UI component.
 * Uses date-fns (peer dependency) and shadcn Calendar component.
 * Keep shadcn imports relative to your project.
 */

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from './icons';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Pick a date',
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    if (!value) return undefined;
    try { return parseISO(value); } catch { return undefined; }
  }, [value]);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    onChange(iso);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-9 w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              disabled && 'opacity-70 cursor-not-allowed'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" strokeWidth={1.5} />
            {selected
              ? format(selected, 'MMMM do, yyyy')
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
