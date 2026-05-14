// Domain types for projects, canvas, and timeline placeholders.
// Keep these stable — schema migrations key off PROJECT_VERSION.

export const PROJECT_VERSION = 1

export type CanvasPreset =
  | "16:9-1080p"
  | "9:16-1080p"
  | "1:1-1080p"
  | "4:5-1080p"
  | "custom"

export interface CanvasSize {
  width: number
  height: number
}

export type Background =
  | { type: "color"; color: string }
  | { type: "blur"; blurIntensity: number }

export interface ProjectSettings {
  fps: 24 | 25 | 30 | 50 | 60
  canvasSize: CanvasSize
  canvasPreset: CanvasPreset
  background: Background
}

/** Placeholder for the real timeline that lands in 1.7. */
export interface TimelineSnapshot {
  durationMs: number
  tracks: unknown[]
}

export interface ProjectRecord {
  /** Stable id (nanoid). */
  id: string
  name: string
  /** Optional rendered preview frame (data URL). */
  thumbnailDataUrl?: string
  createdAt: number
  updatedAt: number
  settings: ProjectSettings
  timeline: TimelineSnapshot
  /** Schema version. Used by future migrations. */
  version: number
}

export type ProjectSummary = Omit<ProjectRecord, "timeline" | "version">

export type ProjectSortKey = "updatedAt" | "createdAt" | "name" | "durationMs"
export type SortOrder = "asc" | "desc"

export const CANVAS_PRESETS: {
  id: CanvasPreset
  label: string
  size: CanvasSize
}[] = [
  { id: "16:9-1080p", label: "16:9 · 1080p", size: { width: 1920, height: 1080 } },
  { id: "9:16-1080p", label: "9:16 · 1080p", size: { width: 1080, height: 1920 } },
  { id: "1:1-1080p", label: "1:1 · 1080", size: { width: 1080, height: 1080 } },
  { id: "4:5-1080p", label: "4:5 · 1080", size: { width: 1080, height: 1350 } },
]

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  fps: 30,
  canvasSize: { width: 1920, height: 1080 },
  canvasPreset: "16:9-1080p",
  background: { type: "color", color: "#000000" },
}

export const DEFAULT_TIMELINE: TimelineSnapshot = {
  durationMs: 0,
  tracks: [],
}
