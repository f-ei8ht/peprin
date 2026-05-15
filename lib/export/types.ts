// Export types — settings, progress, and format definitions.

export type ExportFormat = "mp4" | "webm" | "gif" | "png-sequence"

export type ExportPhase =
  | "idle"
  | "preparing"
  | "encoding"
  | "finalizing"
  | "done"
  | "cancelled"
  | "error"

export interface ExportSettings {
  format: ExportFormat
  width: number
  height: number
  fps: number
  videoBitrate: number
  includeAudio: boolean
  quality: "low" | "medium" | "high"
}

export interface ExportProgress {
  phase: ExportPhase
  framesRendered: number
  framesTotal: number
  elapsedMs: number
  estimatedRemainingMs: number | null
  error?: string
}

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  mp4: "MP4 (H.264 + AAC)",
  webm: "WebM (VP9 + Opus)",
  gif: "Animated GIF",
  "png-sequence": "PNG Sequence",
}

export const EXPORT_FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  mp4: ".mp4",
  webm: ".webm",
  gif: ".gif",
  "png-sequence": ".zip",
}
