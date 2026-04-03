export type DailyCount = { date: string; count: number }

export function isoDateOnly(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function buildDayBins(days: number) {
  const today = startOfDay(new Date())
  const start = addDays(today, -(days - 1))
  const bins: DailyCount[] = []
  for (let i = 0; i < days; i++) {
    bins.push({ date: isoDateOnly(addDays(start, i)), count: 0 })
  }
  return { start, end: addDays(today, 1), bins }
}

/**
 * Bucket an array of rows into daily bins by a date-like string key.
 */
export function bucketByDay<T extends Record<string, unknown>>(
  rows: T[],
  dateKey: keyof T & string,
  days: number,
): DailyCount[] {
  const { bins } = buildDayBins(days)
  const binMap = new Map(bins.map((b, i) => [b.date, i]))
  for (const row of rows) {
    const raw = row[dateKey]
    if (typeof raw !== "string") continue
    const d = isoDateOnly(new Date(raw))
    const idx = binMap.get(d)
    if (idx !== undefined) bins[idx]!.count += 1
  }
  return bins
}
