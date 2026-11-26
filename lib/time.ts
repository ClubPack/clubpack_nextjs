/**
 * Timezone helpers. Events are stored as timestamptz; the club's IANA timezone decides how
 * admins enter times and how everyone sees them, wherever the viewer is.
 */

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") }
}

function offsetMs(date: Date, timeZone: string) {
  const p = partsInZone(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** "2026-12-03" + "18:30" in America/New_York -> Date (UTC instant). */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  const first = guess - offsetMs(new Date(guess), timeZone)
  // Re-check at the result in case the guess straddled a DST change.
  return new Date(guess - offsetMs(new Date(first), timeZone))
}

/** UTC instant -> { date: "YYYY-MM-DD", time: "HH:MM" } in the zone, for form defaults. */
export function utcToZonedParts(iso: string, timeZone: string) {
  const p = partsInZone(new Date(iso), timeZone)
  const pad = (n: number) => String(n).padStart(2, "0")
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` }
}

export function formatEventDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso))
}

export function formatEventTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(iso))
}

export function formatEventRange(startIso: string, endIso: string | null, timeZone: string) {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric" }).format(new Date(startIso))
  const start = formatEventTime(startIso, timeZone)
  const end = endIso ? ` – ${formatEventTime(endIso, timeZone)}` : ""
  const zone = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(new Date(startIso))
    .find((p) => p.type === "timeZoneName")?.value
  return `${day} · ${start}${end}${zone ? ` ${zone}` : ""}`
}

export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
]

/** ISO timestamp `days` ago (kept out of components so render stays pure). */
export function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 864e5).toISOString()
}
