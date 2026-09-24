export const FIXED_BRASILIA_TIMEZONE = "Etc/GMT+3";
export const FIXED_BRASILIA_OFFSET = "-03:00";
export const PROCESSOR_TOLERANCE_MS = 5 * 60 * 1000;

type RecurrenceConfig = {
  interval?: number;
  weekdays?: number[];
  day_of_month?: number;
  custom_unit?: "hour" | "day" | "week" | "month";
  custom_value?: number;
};

function localParts(date: Date) {
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate(), hours: shifted.getUTCHours(), minutes: shifted.getUTCMinutes(), seconds: shifted.getUTCSeconds() };
}

function atFixedOffset(year: number, month: number, day: number, hours: number, minutes: number, seconds = 0) {
  return new Date(`${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${FIXED_BRASILIA_OFFSET}`);
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function parseBrasiliaFixedOffsetDate(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const parsed = new Date(`${date}T${time}:00${FIXED_BRASILIA_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toBrasiliaFixedOffsetIso(date: string, time: string): string | null {
  return parseBrasiliaFixedOffsetDate(date, time)?.toISOString() || null;
}

export function formatBrasiliaFixedOffsetDate(value: Date | string | null | undefined): string {
  if (!value) return "Data não informada";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FIXED_BRASILIA_TIMEZONE, dateStyle: "short", timeStyle: "short" }).format(date);
}

export function calculateNextOccurrence(scheduleType: string, occurrence: Date, config: RecurrenceConfig | null): Date | null {
  const parts = localParts(occurrence);
  const interval = Math.max(1, Number(config?.interval || 1));
  if (scheduleType === "once") return null;
  if (scheduleType === "daily") {
    const next = new Date(Date.UTC(parts.year, parts.month, parts.day + interval, parts.hours, parts.minutes, parts.seconds));
    const nextParts = localParts(next);
    return atFixedOffset(nextParts.year, nextParts.month, nextParts.day, parts.hours, parts.minutes, parts.seconds);
  }
  if (scheduleType === "business_days") {
    let candidate = atFixedOffset(parts.year, parts.month, parts.day, parts.hours, parts.minutes, parts.seconds);
    let remaining = interval;
    while (remaining > 0) {
      candidate = new Date(candidate.getTime() + 86400000);
      const weekday = localParts(candidate).day;
      const jsWeekday = new Date(candidate.getTime() - 3 * 60 * 60 * 1000).getUTCDay();
      if (jsWeekday !== 0 && jsWeekday !== 6) remaining -= 1;
      void weekday;
    }
    return candidate;
  }
  if (scheduleType === "weekly") {
    const weekdays = (config?.weekdays || [1]).map(day => day === 0 ? 7 : day).filter(day => day >= 1 && day <= 7);
    for (let dayOffset = 1; dayOffset <= 14; dayOffset += 1) {
      const candidate = new Date(occurrence.getTime() + dayOffset * 86400000);
      const weekday = new Date(candidate.getTime() - 3 * 60 * 60 * 1000).getUTCDay() || 7;
      if (weekdays.includes(weekday)) {
        const candidateParts = localParts(candidate);
        return atFixedOffset(candidateParts.year, candidateParts.month, candidateParts.day, parts.hours, parts.minutes, parts.seconds);
      }
    }
    return null;
  }
  if (scheduleType === "monthly") {
    const month = parts.month + interval;
    const year = parts.year + Math.floor(month / 12);
    const normalizedMonth = ((month % 12) + 12) % 12;
    const day = Math.min(Math.max(1, Number(config?.day_of_month || parts.day)), lastDayOfMonth(year, normalizedMonth));
    return atFixedOffset(year, normalizedMonth, day, parts.hours, parts.minutes, parts.seconds);
  }
  if (scheduleType === "yearly") {
    const year = parts.year + interval;
    const day = Math.min(parts.day, lastDayOfMonth(year, parts.month));
    return atFixedOffset(year, parts.month, day, parts.hours, parts.minutes, parts.seconds);
  }
  if (scheduleType === "custom_interval") {
    const amount = Math.max(1, Number(config?.custom_value || 1));
    const unit = config?.custom_unit || "day";
    const milliseconds = unit === "hour" ? amount * 3600000 : unit === "week" ? amount * 7 * 86400000 : unit === "month" ? 0 : amount * 86400000;
    if (unit !== "month") return new Date(occurrence.getTime() + milliseconds);
    const month = parts.month + amount;
    const year = parts.year + Math.floor(month / 12);
    const normalizedMonth = ((month % 12) + 12) % 12;
    return atFixedOffset(year, normalizedMonth, Math.min(parts.day, lastDayOfMonth(year, normalizedMonth)), parts.hours, parts.minutes, parts.seconds);
  }
  return null;
}

export function isNotificationDue(nextRunAt: Date, now = new Date(), toleranceMs = PROCESSOR_TOLERANCE_MS) {
  return nextRunAt.getTime() <= now.getTime() + toleranceMs;
}

export function calculateSnoozeDate(option: "hour" | "tomorrow" | "next_week", now = new Date()) {
  if (option === "hour") return new Date(now.getTime() + 3600000);
  const parts = localParts(now);
  const offset = option === "tomorrow" ? 1 : 7;
  const date = new Date(Date.UTC(parts.year, parts.month, parts.day + offset));
  const next = localParts(date);
  return atFixedOffset(next.year, next.month, next.day, option === "tomorrow" ? 12 : 9, 0);
}
