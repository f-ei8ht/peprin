export interface SubtitleEntry {
  id: string
  startTime: number
  endTime: number
  text: string
}

export interface SubtitleTrack {
  id: string
  name: string
  entries: SubtitleEntry[]
}

export function parseSRT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const blocks = content.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 3) continue

    const timeLine = lines.find((l) => l.includes("-->"))
    if (!timeLine) continue

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim())
    const startTime = parseSRTTime(startStr)
    const endTime = parseSRTTime(endStr)

    if (startTime === null || endTime === null) continue

    const text = lines.slice(lines.indexOf(timeLine) + 1).join("\n").trim()
    if (!text) continue

    entries.push({
      id: crypto.randomUUID(),
      startTime,
      endTime,
      text,
    })
  }

  return entries
}

export function serializeSRT(entries: SubtitleEntry[]): string {
  return entries
    .map((entry, i) => {
      const start = formatSRTTime(entry.startTime)
      const end = formatSRTTime(entry.endTime)
      return `${i + 1}\n${start} --> ${end}\n${entry.text}`
    })
    .join("\n\n")
}

export function parseVTT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const lines = content.trim().split("\n")

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim())
      const startTime = parseVTTTime(startStr)
      const endTime = parseVTTTime(endStr)

      if (startTime !== null && endTime !== null) {
        const textLines: string[] = []
        i++
        while (i < lines.length && lines[i].trim() !== "") {
          textLines.push(lines[i].trim())
          i++
        }
        const text = textLines.join("\n")
        if (text) {
          entries.push({
            id: crypto.randomUUID(),
            startTime,
            endTime,
            text,
          })
        }
        continue
      }
    }
    i++
  }

  return entries
}

export function serializeVTT(entries: SubtitleEntry[]): string {
  const header = "WEBVTT\n\n"
  const body = entries
    .map((entry) => {
      const start = formatVTTTime(entry.startTime)
      const end = formatVTTTime(entry.endTime)
      return `${start} --> ${end}\n${entry.text}`
    })
    .join("\n\n")
  return header + body
}

function parseSRTTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
  if (!match) return null
  const [, h, m, s, ms] = match.map(Number)
  return h * 3600 + m * 60 + s + ms / 1000
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`
}

function parseVTTTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/)
  if (!match) return null
  const [, h, m, s, ms] = match.map(Number)
  return h * 3600 + m * 60 + s + ms / 1000
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
}
