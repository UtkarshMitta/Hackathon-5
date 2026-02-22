import { LaborLog } from './types';

/** True burdened labor cost for a single log entry */
export function laborCost(log: LaborLog): number {
  return (log.hours_st + log.hours_ot * 1.5) * log.hourly_rate * log.burden_multiplier;
}

/** Overtime premium only (extra 0.5x cost beyond straight time) */
export function overtimePremium(log: LaborLog): number {
  return log.hours_ot * 0.5 * log.hourly_rate * log.burden_multiplier;
}

/** Parse Python-style list string: "['A', 'B']" -> ["A", "B"] */
export function parseAffectedLines(val: string | null | undefined): string[] {
  if (!val || val === '' || val === '[]') return [];
  try {
    return JSON.parse(val.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

/** Parse string boolean: "True" -> true */
export function parseBool(val: string | boolean | null | undefined): boolean {
  if (typeof val === 'boolean') return val;
  return String(val).toLowerCase() === 'true';
}

/** Get ISO week string from a date string */
export function getWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Safe division - returns 0 instead of NaN/Infinity */
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0;
  return numerator / denominator;
}

/** Round to N decimal places */
export function round(val: number, decimals: number = 2): number {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
