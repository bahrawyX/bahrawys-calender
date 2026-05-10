/**
 * parseCommitment.ts
 *
 * Converts a natural-language commitment string into structured CalendarEvent
 * fields using Gemini, with a local regex fallback so it never hard-fails on
 * common inputs like "Meeting with Sarah next Friday at 2pm".
 */

import { GoogleGenAI, Type } from "@google/genai";
import { EventCategory } from "../types";

const apiKey = process.env.GEMINI_API_KEY ?? '';
const ai = new GoogleGenAI({ apiKey });

export interface ParsedCommitment {
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm  24h
  endTime: string;    // HH:mm  24h
  category: EventCategory;
}

const VALID_CATEGORIES: EventCategory[] = [
  "Critical", "Focus", "Work", "Personal", "Social", "Health",
];

const pad = (n: number) => String(n).padStart(2, "0");

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

/** Strip markdown code fences that some models wrap around JSON */
function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

// ─── Local fallback parser ────────────────────────────────────────────────────

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function resolveLocalDate(input: string, now: Date): string {
  const lower = input.toLowerCase();

  if (/\btoday\b/.test(lower)) {
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  }
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now); d.setDate(d.getDate()+1);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const dayName = DAY_NAMES[i];
    if (new RegExp(`\\b(?:next\\s+)?${dayName}\\b`).test(lower)) {
      const isNext = new RegExp(`\\bnext\\s+${dayName}\\b`).test(lower);
      const d = new Date(now);
      const diff = (i - now.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + (isNext ? diff + 7 : diff));
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    }
  }
  const ordMatch = lower.match(/\bthe\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (ordMatch) {
    const day = parseInt(ordMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const candidate = new Date(now.getFullYear(), now.getMonth(), day);
      if (candidate <= now) candidate.setMonth(candidate.getMonth()+1);
      return `${candidate.getFullYear()}-${pad(candidate.getMonth()+1)}-${pad(candidate.getDate())}`;
    }
  }
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}

function resolveLocalTime(input: string): string {
  const lower = input.toLowerCase();
  const m12 = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2] ? parseInt(m12[2], 10) : 0;
    if (m12[3] === "pm" && h < 12) h += 12;
    if (m12[3] === "am" && h === 12) h = 0;
    return `${pad(h)}:${pad(min)}`;
  }
  const m24 = lower.match(/\bat\s+(\d{1,2}):(\d{2})\b/);
  if (m24) return `${pad(parseInt(m24[1],10))}:${pad(parseInt(m24[2],10))}`;
  return "09:00";
}

function localFallbackParse(input: string, now: Date): ParsedCommitment {
  const date      = resolveLocalDate(input, now);
  const startTime = resolveLocalTime(input);
  const endTime   = addMinutesToTime(startTime, 60);
  const title = input
    .replace(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/\b(today|tomorrow)\b/gi, "")
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "")
    .replace(/\bon\s+the\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, "")
    .replace(/\bthe\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, "")
    .replace(/\s+/g, " ").trim();
  return { title: title || input.slice(0, 60), date, startTime, endTime, category: "Work" };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function parseCommitment(input: string): Promise<ParsedCommitment> {
  const now = new Date();
  const todayStr   = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const resolvedDate = resolveLocalDate(input, now);
  const resolvedTime = resolveLocalTime(input);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const prompt = `You are a calendar event parser.
Today: ${todayStr} | Timezone: ${tz}

I have already resolved the date to: ${resolvedDate}
I have already resolved the start time to: ${resolvedTime}

Use these unless the input explicitly overrides them with a different date/time.

Rules:
- title: concise, properly capitalized (e.g. "Meeting with Sarah").
- endTime: startTime + 60 min unless a duration or end time is stated.
- category: exactly one of Critical, Focus, Work, Personal, Social, Health. Default: Work.

Return ONLY a JSON object, no markdown.

Input: "${input}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title:     { type: Type.STRING },
            date:      { type: Type.STRING },
            startTime: { type: Type.STRING },
            endTime:   { type: Type.STRING },
            category:  { type: Type.STRING },
          },
          required: ["title", "date", "startTime", "endTime", "category"],
        },
      },
    });

    const raw = stripCodeFences(response.text?.trim() ?? "");
    if (!raw) throw new Error("Empty AI response");

    const parsed = JSON.parse(raw);

    const title: string         = parsed.title?.trim()                             || input.slice(0, 60);
    const date: string          = isValidDate(parsed.date)                         ? parsed.date      : resolvedDate;
    const startTime: string     = isValidTime(parsed.startTime)                    ? parsed.startTime : resolvedTime;
    const endTime: string       = isValidTime(parsed.endTime)                      ? parsed.endTime   : addMinutesToTime(startTime, 60);
    const category: EventCategory = VALID_CATEGORIES.includes(parsed.category)
      ? (parsed.category as EventCategory)
      : "Work";

    return { title, date, startTime, endTime, category };
  } catch (err) {
    console.warn("Gemini parse failed, using local fallback:", err);
    return localFallbackParse(input, now);
  }
}
