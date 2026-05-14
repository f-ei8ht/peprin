// Timecode helpers used across the editor.

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function pad2(value: number) {
  return value.toString().padStart(2, "0")
}

/** Format seconds as `HH:MM:SS` or `MM:SS` (when hours are zero). */
export function formatTimecode(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
  return `${pad2(m)}:${pad2(s)}`
}

/** Format seconds as `MM:SS.cc` for fine-grained editing. */
export function formatTimecodeFrames(seconds: number, fps = 30) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  const frames = Math.floor((seconds - total) * fps)
  return `${pad2(m)}:${pad2(s)}.${pad2(frames)}`
}

/** Parse a timecode string back into seconds. Accepts MM:SS, HH:MM:SS, or seconds. */
export function parseTimecode(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }
  const parts = trimmed.split(":").map((p) => Number(p))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 2) {
    const [m, s] = parts
    return m * 60 + s
  }
  if (parts.length === 3) {
    const [h, m, s] = parts
    return h * 3600 + m * 60 + s
  }
  return null
}
