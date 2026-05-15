'use client';

/**
 * RecurrenceSelector — adapted for bahrawy-calendar package.
 *
 * Uses rrule engine from the bahrawy-calendar package core.
 * Requires `rrule` peer dependency to be installed.
 */

import React, { useState, useCallback } from 'react';
import type { RecurrenceRule } from 'bahrawy-calendar';

// These are local component imports — keep them relative to your project
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

type Frequency = RecurrenceRule['frequency'];

const DAY_LABELS = [
  { key: 'MO', label: 'M' },
  { key: 'TU', label: 'T' },
  { key: 'WE', label: 'W' },
  { key: 'TH', label: 'T' },
  { key: 'FR', label: 'F' },
  { key: 'SA', label: 'S' },
  { key: 'SU', label: 'S' },
] as const;

const DAY_INDEX: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/**
 * Build an RRULE string from structured params.
 * This is a simplified builder — for full rrule support, install `rrule` and
 * use the `buildRRule`/`describeRRule` functions from your rrule engine.
 */
function buildSimpleRRule(opts: {
  freq: string;
  interval?: number;
  byDay?: string[];
  count?: number;
  until?: string;
}): string {
  const parts = [`FREQ=${opts.freq.toUpperCase()}`];
  if (opts.interval && opts.interval > 1) parts.push(`INTERVAL=${opts.interval}`);
  if (opts.byDay?.length) parts.push(`BYDAY=${opts.byDay.join(',')}`);
  if (opts.count) parts.push(`COUNT=${opts.count}`);
  if (opts.until) parts.push(`UNTIL=${opts.until.replace(/-/g, '')}T000000Z`);
  return `RRULE:${parts.join(';')}`;
}

interface RecurrenceSelectorProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
  dtstart?: string;
  disabled?: boolean;
}

type Preset = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';

function ruleToPreset(rule: RecurrenceRule | null): Preset {
  if (!rule) return 'none';
  if (rule.frequency === 'DAILY' && rule.interval === 1 && !rule.daysOfWeek?.length) return 'daily';
  if (
    rule.frequency === 'WEEKLY' && rule.interval === 1
    && rule.daysOfWeek?.length === 5
    && [1, 2, 3, 4, 5].every((d) => rule.daysOfWeek!.includes(d))
  ) return 'weekdays';
  if (rule.frequency === 'WEEKLY' && rule.interval === 1 && (!rule.daysOfWeek || rule.daysOfWeek.length <= 1)) return 'weekly';
  if (rule.frequency === 'MONTHLY' && rule.interval === 1) return 'monthly';
  if (rule.frequency === 'YEARLY' && rule.interval === 1) return 'yearly';
  return 'custom';
}

function presetToRule(preset: Preset, currentDate?: string): RecurrenceRule | null {
  const base: Pick<RecurrenceRule, 'interval' | 'endCondition'> = {
    interval: 1,
    endCondition: { type: 'NEVER' },
  };

  switch (preset) {
    case 'none': return null;
    case 'daily': return { ...base, frequency: 'DAILY', rrule: buildSimpleRRule({ freq: 'daily' }) };
    case 'weekdays': return {
      ...base, frequency: 'WEEKLY',
      daysOfWeek: [1, 2, 3, 4, 5],
      rrule: buildSimpleRRule({ freq: 'weekly', byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] }),
    };
    case 'weekly': {
      const dayIndex = currentDate ? new Date(currentDate).getDay() : 1;
      return { ...base, frequency: 'WEEKLY', daysOfWeek: [dayIndex], rrule: buildSimpleRRule({ freq: 'weekly' }) };
    }
    case 'monthly': return { ...base, frequency: 'MONTHLY', rrule: buildSimpleRRule({ freq: 'monthly' }) };
    case 'yearly': return { ...base, frequency: 'YEARLY', rrule: buildSimpleRRule({ freq: 'yearly' }) };
    case 'custom': return { ...base, frequency: 'WEEKLY', rrule: buildSimpleRRule({ freq: 'weekly' }) };
  }
}

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  value,
  onChange,
  dtstart,
  disabled,
}) => {
  const [showCustom, setShowCustom] = useState(() => ruleToPreset(value) === 'custom');
  const [customFreq, setCustomFreq] = useState<Frequency>(value?.frequency ?? 'WEEKLY');
  const [customInterval, setCustomInterval] = useState(value?.interval ?? 1);
  const [customDays, setCustomDays] = useState<string[]>(() => {
    if (!value?.daysOfWeek) return [];
    return value.daysOfWeek.map((d) => DAY_LABELS.find((dl) => DAY_INDEX[dl.key] === d)?.key ?? '').filter(Boolean);
  });
  const [endType, setEndType] = useState<'NEVER' | 'COUNT' | 'UNTIL'>(value?.endCondition.type ?? 'NEVER');
  const [endCount, setEndCount] = useState(value?.endCondition.type === 'COUNT' ? value.endCondition.count : 10);
  const [endDate, setEndDate] = useState(value?.endCondition.type === 'UNTIL' ? value.endCondition.untilDate : '');

  const preset = ruleToPreset(value);

  const handlePresetChange = useCallback((p: string) => {
    const newPreset = p as Preset;
    if (newPreset === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(presetToRule(newPreset, dtstart));
  }, [onChange, dtstart]);

  const handleCustomApply = useCallback(() => {
    const endCondition: RecurrenceRule['endCondition'] =
      endType === 'COUNT' ? { type: 'COUNT', count: endCount }
      : endType === 'UNTIL' ? { type: 'UNTIL', untilDate: endDate }
      : { type: 'NEVER' };

    const daysOfWeek = customFreq === 'WEEKLY' && customDays.length > 0
      ? customDays.map((d) => DAY_INDEX[d]).filter((n) => n !== undefined)
      : undefined;

    const rrule = buildSimpleRRule({
      freq: customFreq.toLowerCase(),
      interval: customInterval,
      byDay: customFreq === 'WEEKLY' ? customDays : undefined,
      count: endType === 'COUNT' ? endCount : undefined,
      until: endType === 'UNTIL' ? endDate : undefined,
    });

    onChange({
      frequency: customFreq,
      interval: customInterval,
      daysOfWeek,
      endCondition,
      rrule,
    });
  }, [customFreq, customInterval, customDays, endType, endCount, endDate, onChange]);

  const toggleDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Repeat</Label>
        <Select
          value={showCustom ? 'custom' : preset}
          onValueChange={handlePresetChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Does not repeat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Every day</SelectItem>
            <SelectItem value="weekdays">Every weekday (Mon-Fri)</SelectItem>
            <SelectItem value="weekly">Every week</SelectItem>
            <SelectItem value="monthly">Every month</SelectItem>
            <SelectItem value="yearly">Every year</SelectItem>
            <SelectItem value="custom">Custom...</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showCustom && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">Every</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={customInterval}
              onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-8 w-16 text-center"
              disabled={disabled}
            />
            <Select
              value={customFreq}
              onValueChange={(v) => setCustomFreq(v as Frequency)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">{customInterval > 1 ? 'days' : 'day'}</SelectItem>
                <SelectItem value="WEEKLY">{customInterval > 1 ? 'weeks' : 'week'}</SelectItem>
                <SelectItem value="MONTHLY">{customInterval > 1 ? 'months' : 'month'}</SelectItem>
                <SelectItem value="YEARLY">{customInterval > 1 ? 'years' : 'year'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {customFreq === 'WEEKLY' && (
            <div className="flex gap-1">
              {DAY_LABELS.map((day, idx) => (
                <button
                  key={`${day.key}-${idx}`}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  disabled={disabled}
                  className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                    customDays.includes(day.key)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Ends</Label>
            <Select
              value={endType}
              onValueChange={(v) => setEndType(v as 'NEVER' | 'COUNT' | 'UNTIL')}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEVER">Never</SelectItem>
                <SelectItem value="COUNT">After # occurrences</SelectItem>
                <SelectItem value="UNTIL">On date</SelectItem>
              </SelectContent>
            </Select>

            {endType === 'COUNT' && (
              <Input
                type="number"
                min={1}
                max={999}
                value={endCount}
                onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 w-24"
                disabled={disabled}
              />
            )}
            {endType === 'UNTIL' && (
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8"
                disabled={disabled}
              />
            )}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCustomApply}
            disabled={disabled}
            className="w-full"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecurrenceSelector;
