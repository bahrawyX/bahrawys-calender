/**
 * RFC 5545 RRULE engine — powered by the `rrule` library.
 * All functions are pure and stateless.
 *
 * The `rrule` package is an optional peer dependency. Call `initRecurrence()`
 * once at startup (or use `<BahrawyCalendarProvider enableRecurrence>`)
 * to load it before calling any recurrence functions.
 */

let RRule: typeof import('rrule').RRule;
let RRuleSet: typeof import('rrule').RRuleSet;
let rrulestr: typeof import('rrule').rrulestr;
let _loadPromise: Promise<void> | null = null;

/**
 * Pre-load the rrule library. Call once at app startup.
 * BahrawyCalendarProvider calls this automatically when enableRecurrence is true.
 *
 * @example
 * ```ts
 * import { initRecurrence, buildRRule } from 'bahrawy-calendar';
 *
 * await initRecurrence();
 * const rule = buildRRule({ freq: 'weekly', byDay: ['MO', 'WE', 'FR'] });
 * ```
 */
export async function initRecurrence(): Promise<void> {
  if (RRule) return;
  if (!_loadPromise) {
    _loadPromise = import('rrule')
      .then((mod) => {
        // In Node, rrule's CJS build exposes named exports under .default
        // (the module namespace is { __esModule: true, default: { RRule, ... } }).
        // In browsers/bundlers the ESM entry exposes them at the top level.
        const src = mod.default && (mod.default.RRule || mod.default.RRuleSet)
          ? mod.default
          : mod;
        RRule = src.RRule;
        RRuleSet = src.RRuleSet;
        rrulestr = src.rrulestr;
      })
      .catch(() => {
        _loadPromise = null; // allow retry
        throw new Error(
          'bahrawy-calendar: The `rrule` package is required for recurrence features. ' +
          'Install it with: npm install rrule',
        );
      });
  }
  await _loadPromise;
}

function ensureRRule() {
  if (!RRule) {
    throw new Error(
      'bahrawy-calendar: rrule is not loaded. ' +
      'Call `await initRecurrence()` before using recurrence functions, ' +
      'or use <BahrawyCalendarProvider enableRecurrence>. ' +
      'If not installed: npm install rrule',
    );
  }
}

export interface RecurrenceInput {
  /** RFC 5545 RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" */
  rrule: string;
  /** ISO start of the master event (DTSTART) */
  dtstart: string;
  /** ISO dates to exclude (EXDATE) */
  exdates?: string[];
}

export interface ExpandedInstance {
  startIso: string;
  endIso: string;
  isException: boolean;
}

const MAX_INSTANCES = 500;

/**
 * Validate an RRULE string before storing.
 */
export function validateRRule(
  rruleStr: string,
  dtstart: Date,
): { ok: true } | { ok: false; reason: string } {
  ensureRRule();
  if (typeof rruleStr !== 'string' || rruleStr.length === 0) {
    return { ok: false, reason: 'RRULE must be a non-empty string' };
  }
  if (rruleStr.length > 500) {
    return { ok: false, reason: 'RRULE exceeds max length (500)' };
  }

  let rule: InstanceType<typeof RRule>;
  try {
    rule = parseRRule(rruleStr, dtstart);
  } catch {
    return { ok: false, reason: 'Invalid RRULE syntax' };
  }

  const opts = rule.options;
  if (opts.freq >= 4) {
    return { ok: false, reason: 'Sub-daily frequencies are not allowed' };
  }
  if (opts.count && opts.count > MAX_INSTANCES) {
    return { ok: false, reason: `COUNT exceeds maximum (${MAX_INSTANCES})` };
  }
  if (opts.interval && opts.interval > 1000) {
    return { ok: false, reason: 'INTERVAL exceeds maximum (1000)' };
  }

  return { ok: true };
}

/**
 * Parse an RRULE string into an RRule object anchored to the given dtstart.
 */
export function parseRRule(rruleStr: string, dtstart: Date) {
  ensureRRule();
  if (rruleStr.includes('DTSTART')) {
    return rrulestr(rruleStr) as InstanceType<typeof RRule>;
  }
  const options = RRule.parseString(rruleStr);
  options.dtstart = dtstart;
  return new RRule(options);
}

/**
 * Expand a recurring event into individual instances within a date range.
 */
export function expandRecurrence(
  input: RecurrenceInput,
  rangeStart: Date,
  rangeEnd: Date,
  durationMs: number,
): ExpandedInstance[] {
  ensureRRule();
  const dtstart = new Date(input.dtstart);
  const rule = parseRRule(input.rrule, dtstart);

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  if (input.exdates) {
    for (const exdate of input.exdates) {
      ruleSet.exdate(new Date(exdate));
    }
  }

  const occurrences = ruleSet.between(rangeStart, rangeEnd, true);

  return occurrences.slice(0, MAX_INSTANCES).map((date) => ({
    startIso: date.toISOString(),
    endIso: new Date(date.getTime() + durationMs).toISOString(),
    isException: false,
  }));
}

/**
 * Get the next N occurrences of a recurring event from a given point.
 */
export function getNextOccurrences(
  input: RecurrenceInput,
  after: Date,
  count: number,
  durationMs: number,
): ExpandedInstance[] {
  ensureRRule();
  const dtstart = new Date(input.dtstart);
  const rule = parseRRule(input.rrule, dtstart);

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  if (input.exdates) {
    for (const exdate of input.exdates) {
      ruleSet.exdate(new Date(exdate));
    }
  }

  const farFuture = new Date(after.getTime() + 365 * 86_400_000 * 2);
  const occurrences = ruleSet.between(after, farFuture, true);

  return occurrences.slice(0, count).map((date) => ({
    startIso: date.toISOString(),
    endIso: new Date(date.getTime() + durationMs).toISOString(),
    isException: false,
  }));
}

/**
 * Build an RRULE string from user-friendly parameters.
 */
export function buildRRule(params: {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  byDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
  count?: number;
  until?: string;
}): string {
  ensureRRule();
  const freqMap: Record<string, number> = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  };

  const dayMap: Record<string, { weekday: number }> = {
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
    SU: RRule.SU,
  };

  const options: Record<string, unknown> = {
    freq: freqMap[params.freq],
    interval: params.interval ?? 1,
  };

  if (params.byDay?.length) {
    options.byweekday = params.byDay.map((d) => dayMap[d]).filter(Boolean);
  }
  if (params.byMonthDay?.length) {
    options.bymonthday = params.byMonthDay;
  }
  if (params.byMonth?.length) {
    options.bymonth = params.byMonth;
  }
  if (params.count) {
    options.count = params.count;
  }
  if (params.until) {
    options.until = new Date(params.until);
  }

  const rule = new RRule(options as ConstructorParameters<typeof RRule>[0]);
  return rule.toString().replace(/^DTSTART:[^\n]*\n/, '');
}

/**
 * Get a human-readable description of an RRULE.
 */
export function describeRRule(rruleStr: string, dtstart: Date): string {
  try {
    const rule = parseRRule(rruleStr, dtstart);
    return rule.toText();
  } catch {
    return 'Custom recurrence';
  }
}

/**
 * Check if a specific date is an occurrence of the recurrence rule.
 */
export function isOccurrence(input: RecurrenceInput, date: Date): boolean {
  ensureRRule();
  const dtstart = new Date(input.dtstart);
  const rule = parseRRule(input.rrule, dtstart);

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  if (input.exdates) {
    for (const exdate of input.exdates) {
      ruleSet.exdate(new Date(exdate));
    }
  }

  const windowStart = new Date(date.getTime() - 1000);
  const windowEnd = new Date(date.getTime() + 1000);
  const occurrences = ruleSet.between(windowStart, windowEnd, true);
  return occurrences.length > 0;
}
