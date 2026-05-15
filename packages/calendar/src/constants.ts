/**
 * bahrawy-calendar — Shared constants.
 */

import type { EventCategory } from './types';

export const CATEGORIES: { name: EventCategory; color: string; bg: string }[] = [
  { name: 'Critical', color: '#EF4444', bg: 'bg-red-500' },
  { name: 'Focus', color: '#6D59E0', bg: 'bg-primary' },
  { name: 'Work', color: '#475569', bg: 'bg-slate-600' },
  { name: 'Social', color: '#F59E0B', bg: 'bg-amber-500' },
  { name: 'Personal', color: '#10B981', bg: 'bg-emerald-500' },
  { name: 'Health', color: '#EC4899', bg: 'bg-pink-500' },
];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const EVENT_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  Focus: '#6D59E0',
  Work: '#475569',
  Social: '#F59E0B',
  Personal: '#10B981',
  Health: '#EC4899',
};

/** Provider brand colors — used by event cards and badges. */
export const PROVIDER_COLORS = {
  google: { hex: '#34A853', rgb: '52,168,83' },
  microsoft: { hex: '#0078D4', rgb: '0,120,212' },
  apple: { hex: '#A8A9B0', rgb: '168,169,176' },
} as const;

export const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google Calendar',
  microsoft: 'Outlook Calendar',
  apple: 'Apple Calendar',
};
