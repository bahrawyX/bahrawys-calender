'use client';

import React, { useState } from 'react';

// ── Curated emoji catalogue ────────────────────────────────────────────────────

const GROUPS = [
  {
    id: 'mood',
    icon: '🙂',
    label: 'Mood',
    emojis: [
      '😀','😄','😂','🥰','😍','🤩','😎','🤔','😮','🥳',
      '😤','😢','😅','🤯','🤗','🫡','🥺','😭','😱','🤬',
      '😈','🙃','😏','😬','🤤','🧐','🥱','😶','🫥','😜',
    ],
  },
  {
    id: 'focus',
    icon: '⚡',
    label: 'Focus',
    emojis: [
      '🎯','🔥','⚡','💡','✅','🚀','💪','🎉','📌','⭐',
      '🏆','💯','✨','🎊','🔑','💎','🏅','🥇','⏳','🔒',
      '🧩','🎲','♟️','🏹','🎖️','🌟','💫','🔮','🃏','🎴',
    ],
  },
  {
    id: 'work',
    icon: '💼',
    label: 'Work',
    emojis: [
      '💼','📚','🖥️','📱','✏️','📝','📋','🗓️','⏰','📧',
      '💻','📊','📈','🗂️','📎','🔬','💰','📣','🎨','🔧',
      '🛠️','📐','📏','🗃️','🖨️','📡','🔭','⚗️','🔖','📮',
    ],
  },
  {
    id: 'life',
    icon: '🏃',
    label: 'Life',
    emojis: [
      '🏃','🏋️','🧘','🍎','💊','😴','🛒','🍽️','🏡','☕',
      '🍕','🎮','📺','🎵','📷','✈️','🎭','🎬','🎤','🛁',
      '🚴','🤸','⚽','🏊','🧗','🛺','🚂','🎸','🎻','🎹',
    ],
  },
  {
    id: 'nature',
    icon: '🌿',
    label: 'Nature',
    emojis: [
      '🌿','🌸','🌻','🌙','☀️','🌈','❄️','⛅','🌊','🦋',
      '🐶','🐱','🌲','🍀','🌺','🌍','🔵','🟣','🟡','🔴',
      '🦅','🦁','🐯','🦊','🐻','🌴','🍁','🌵','🌾','🍄',
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

interface CompactEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const CompactEmojiPicker: React.FC<CompactEmojiPickerProps> = ({ onSelect }) => {
  const [activeGroup, setActiveGroup] = useState('mood');
  const [query, setQuery] = useState('');

  const emojis = query.trim()
    ? GROUPS.flatMap((g) => g.emojis).filter((e) => e.includes(query.trim()))
    : GROUPS.find((g) => g.id === activeGroup)!.emojis;

  return (
    <div className="flex flex-col w-[min(272px,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden">

      {/* Search bar */}
      <div className="px-3 pt-3 pb-2.5">
        <div className="relative flex items-center">
          <svg className="absolute left-2.5 text-muted-foreground/60 pointer-events-none" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full h-7 pl-7 pr-3 rounded-lg bg-muted/50 border border-border/50 text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category tabs — hidden when searching */}
      {!query && (
        <div className="flex items-center gap-0.5 px-2.5 pb-2">
          {GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroup(group.id)}
              title={group.label}
              className={`flex flex-1 items-center justify-center h-9 rounded-lg text-[15px] transition-all ${
                activeGroup === group.id
                  ? 'bg-primary/20 scale-110'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {group.icon}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mx-2.5 mb-2 h-px bg-border/50" />

      {/* Emoji grid — 6 cols on narrow, 8 on wider */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-0.5 px-2 pb-2.5 max-h-[180px] overflow-y-auto no-scrollbar">
        {emojis.length === 0 ? (
          <div className="col-span-6 sm:col-span-8 py-4 text-center text-[11px] text-muted-foreground/60">No results</div>
        ) : (
          emojis.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(emoji)}
              className="h-9 w-full flex items-center justify-center rounded-lg text-[18px] leading-none hover:bg-muted/60 active:scale-90 transition-all"
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
