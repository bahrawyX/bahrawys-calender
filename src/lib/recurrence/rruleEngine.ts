import { RRule, RRuleSet, rrulestr } from 'rrule';

export interface RecurrenceInput {
  /** RFC 5545 RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" */
  rrule: string;
  /** ISO start of the master event (DTSTART) */
  dtstart: string;
  /** ISO dates to exclude (EXDATE) */
  exdates?: string[];
}

export interface ExpandedInstance {
  /** ISO start of this occurrence */
  startIso: string;
  /** ISO end of this occurrence */
  endIso: string;
  /** Whether this is an exception (modified instance) */
  isException: boolean;
}

const MAX_INSTANCES = 500;

/**
 * Validate an RRULE string before it is stored. This is a safety check to
 * prevent denial-of-service via pathological rules (e.g. FREQ=SECONDLY with
 * no UNTIL/COUNT, or absurdly large COUNT values) that would blow up CPU
 * every time the engine expands them.
 *
 * Returns { ok: true } on success, or { ok: false, reason } on rejection.
 */
export function validateRRule(
  rruleStr: string,
  dtstart: Date,
): { ok: true } | { ok: false; reason: string } {
  if (typeof rruleStr !== 'string' || rruleStr.length === 0) {
    return { ok: false, reason: 'RRULE must be a non-empty string' };
  }
  if (rruleStr.length > 500) {
    return { ok: false, reason: 'RRULE exceeds max length (500)' };
  }

  let rule: RRule;
  try {
    rule = parseRRule(rruleStr, dtstart);
  } catch {
    return { ok: false, reason: 'Invalid RRULE syntax' };
  }

  const opts = rule.options;

  // Disallow sub-daily frequencies entirely — they have no productivity use
  // case and are the easiest way to construct a CPU bomb.
  // RRule FREQ numeric values: YEARLY=0 MONTHLY=1 WEEKLY=2 DAILY=3
  // HOURLY=4 MINUTELY=5 SECONDLY=6
  if (opts.freq >= 4) {
    return { ok: false, reason: 'Sub-daily frequencies are not allowed' };
  }

  // Cap explicit COUNT to something reasonable. 500 aligns with MAX_INSTANCES.
  if (opts.count && opts.count > MAX_INSTANCES) {
    return { ok: false, reason: `COUNT exceeds maximum (${MAX_INSTANCES})` };
  }

  // If neither COUNT nor UNTIL is set, that's fine — we always window-clip
  // on expansion. But guard against absurdly large INTERVALs.
  if (opts.interval && opts.interval > 1000) {
    return { ok: false, reason: 'INTERVAL exceeds maximum (1000)' };
  }

  return { ok: true };
}

/**
 * Parse an RRULE string into an RRule object anchored to the given dtstart.
 */
export function parseRRule(rruleStr: string, dtstart: Date): RRule {
  // If the string already contains DTSTART, parse as-is
  if (rruleStr.includes('DTSTART')) {
    return rrulestr(rruleStr) as RRule;
  }
  // Otherwise, parse the RRULE and anchor it
  const options = RRule.parseString(rruleStr);
  options.dtstart = dtstart;
  return new RRule(options);
}

/**
 * Expand a recurring event into individual instances within a date range.
 *
 * @param input - The recurrence rule, start time, and excluded dates
 * @param rangeStart - Start of the expansion window (inclusive)
 * @param rangeEnd - End of the expansion window (exclusive)
 * @param durationMs - Duration of each instance in milliseconds
 * @returns Array of expanded instances
 */
export function expandRecurrence(
  input: RecurrenceInput,
  rangeStart: Date,
  rangeEnd: Date,
  durationMs: number,
): ExpandedInstance[] {
  const dtstart = new Date(input.dtstart);
  const rule = parseRRule(input.rrule, dtstart);

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  // Add excluded dates
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
  const dtstart = new Date(input.dtstart);
  const rule = parseRRule(input.rrule, dtstart);

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  if (input.exdates) {
    for (const exdate of input.exdates) {
      ruleSet.exdate(new Date(exdate));
    }
  }

  // Use a far-future end date and limit by count
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

  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: freqMap[params.freq],
    interval: params.interval ?? 1,
  };

  if (params.byDay?.length) {
    options.byweekday = params.byDay.map((d) => dayMap[d]).filter(Boolean) as unknown as number[];
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
  // Return just the RRULE part without DTSTART
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
export function isOccurrence(
  input: RecurrenceInput,
  date: Date,
): boolean {
  const dtstart = new Date(input.dtstart);
  const rule = parseRRule(input.rrule, dtstart);

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  if (input.exdates) {
    for (const exdate of input.exdates) {
      ruleSet.exdate(new Date(exdate));
    }
  }

  // Check a small window around the target date
  const windowStart = new Date(date.getTime() - 1000);
  const windowEnd = new Date(date.getTime() + 1000);
  const occurrences = ruleSet.between(windowStart, windowEnd, true);
  return occurrences.length > 0;
}
