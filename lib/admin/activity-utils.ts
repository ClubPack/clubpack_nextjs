export function activityTitle(actionType: string | null) {
  const t = (actionType ?? "").toLowerCase()
  if (t === "event_created") return "Event created"
  if (t === "event_deleted") return "Event deleted"
  if (t === "event_updated") return "Event updated"
  if (t === "member_joined") return "New member joined"
  if (t === "member_left") return "Member left"
  return "Activity"
}

export function formatTimeAgo(dateIso: string) {
  const ts = new Date(dateIso).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}
