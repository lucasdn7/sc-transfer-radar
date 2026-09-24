export const FIXED_BRASILIA_OFFSET = "-03:00"
export const PROCESSOR_TOLERANCE_MS = 5 * 60 * 1000

type RecurrenceConfig = {
  interval?: number
  weekdays?: number[]
  day_of_month?: number
  custom_unit?: "hour" | "day" | "week" | "month"
  custom_value?: number
}

function localParts(date: Date) {
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000)
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate(), hours: shifted.getUTCHours(), minutes: shifted.getUTCMinutes(), seconds: shifted.getUTCSeconds() }
}

function atFixedOffset(year: number, month: number, day: number, hours: number, minutes: number, seconds = 0) {
  return new Date(`${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${FIXED_BRASILIA_OFFSET}`)
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

export function calculateNextOccurrence(scheduleType: string, occurrence: Date, config: RecurrenceConfig | null): Date | null {
  const parts = localParts(occurrence)
  const interval = Math.max(1, Number(config?.interval || 1))
  if (scheduleType === "once") return null
  if (scheduleType === "daily") {
    const next = new Date(Date.UTC(parts.year, parts.month, parts.day + interval, parts.hours, parts.minutes, parts.seconds))
    const nextParts = localParts(next)
    return atFixedOffset(nextParts.year, nextParts.month, nextParts.day, parts.hours, parts.minutes, parts.seconds)
  }
  if (scheduleType === "business_days") {
    let candidate = occurrence
    let remaining = interval
    while (remaining > 0) {
      candidate = new Date(candidate.getTime() + 86400000)
      const weekday = new Date(candidate.getTime() - 3 * 60 * 60 * 1000).getUTCDay()
      if (weekday !== 0 && weekday !== 6) remaining -= 1
    }
    return candidate
  }
  if (scheduleType === "weekly") {
    const weekdays = (config?.weekdays || [1]).map(day => day === 0 ? 7 : day).filter(day => day >= 1 && day <= 7)
    for (let dayOffset = 1; dayOffset <= 14; dayOffset += 1) {
      const candidate = new Date(occurrence.getTime() + dayOffset * 86400000)
      const weekday = new Date(candidate.getTime() - 3 * 60 * 60 * 1000).getUTCDay() || 7
      if (weekdays.includes(weekday)) {
        const candidateParts = localParts(candidate)
        return atFixedOffset(candidateParts.year, candidateParts.month, candidateParts.day, parts.hours, parts.minutes, parts.seconds)
      }
    }
    return null
  }
  if (scheduleType === "monthly") {
    const month = parts.month + interval
    const year = parts.year + Math.floor(month / 12)
    const normalizedMonth = ((month % 12) + 12) % 12
    return atFixedOffset(year, normalizedMonth, Math.min(Math.max(1, Number(config?.day_of_month || parts.day)), lastDayOfMonth(year, normalizedMonth)), parts.hours, parts.minutes, parts.seconds)
  }
  if (scheduleType === "yearly") {
    const year = parts.year + interval
    return atFixedOffset(year, parts.month, Math.min(parts.day, lastDayOfMonth(year, parts.month)), parts.hours, parts.minutes, parts.seconds)
  }
  if (scheduleType === "custom_interval") {
    const amount = Math.max(1, Number(config?.custom_value || 1))
    if (config?.custom_unit === "hour") return new Date(occurrence.getTime() + amount * 3600000)
    if (config?.custom_unit === "week") return new Date(occurrence.getTime() + amount * 7 * 86400000)
    if (config?.custom_unit === "month") {
      const month = parts.month + amount
      const year = parts.year + Math.floor(month / 12)
      const normalizedMonth = ((month % 12) + 12) % 12
      return atFixedOffset(year, normalizedMonth, Math.min(parts.day, lastDayOfMonth(year, normalizedMonth)), parts.hours, parts.minutes, parts.seconds)
    }
    return new Date(occurrence.getTime() + amount * 86400000)
  }
  return null
}

export function isDue(value: string | Date, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() <= now.getTime() + PROCESSOR_TOLERANCE_MS
}
