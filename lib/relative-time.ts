// Tiny relative-time formatter (avoids pulling in date-fns).
// Falls back to a localized date for anything older than ~30 days.

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export function formatRelative(timestampMs: number, now = Date.now()) {
  const diff = now - timestampMs
  if (diff < 30 * SECOND) return "just now"
  if (diff < MINUTE) return `${Math.floor(diff / SECOND)}s ago`
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `${m} minute${m === 1 ? "" : "s"} ago`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `${h} hour${h === 1 ? "" : "s"} ago`
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY)
    return `${d} day${d === 1 ? "" : "s"} ago`
  }
  if (diff < 30 * DAY) {
    const w = Math.floor(diff / WEEK)
    return `${w} week${w === 1 ? "" : "s"} ago`
  }
  return new Date(timestampMs).toLocaleDateString()
}
