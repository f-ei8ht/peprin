// Domain types for projects, canvas, and timeline placeholders.
// Keep these stable — schema migrations key off PROJECT_VERSION.

export const PROJECT_VERSION = 2

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

// --- Timeline types ---

export type TrackType = "video" | "audio" | "text" | "sticker" | "subtitle"

export interface TimelineTrack {
  id: string
  type: TrackType
  name: string
  elements: TimelineElement[]
  muted: boolean
  hidden: boolean
}

export type ElementType = "video" | "image" | "audio" | "text" | "sticker" | "subtitle"

export interface TimelineElement {
  id: string
  type: ElementType
  name: string
  /** References a MediaAsset id from the media library. */
  mediaId: string
  /** Start position on the timeline (seconds). */
  startTime: number
  /** Duration on the timeline (seconds). */
  duration: number
  /** Source trim start offset (seconds from the beginning of source media). */
  trimStart: number
  /** Source trim end offset (seconds from the end of source media). */
  trimEnd: number
  /** Visual parameters (applied during compositing). */
  positionX: number
  positionY: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  /** Text-specific params */
  textContent?: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  fontWeight?: string
  textAlign?: string
  textStrokeColor?: string
  textStrokeWidth?: number
  textShadowColor?: string
  textShadowBlur?: number
  textBackgroundColor?: string
  /** Native dimensions of the source media */
  nativeWidth?: number
  nativeHeight?: number
}

export interface TimelineSnapshot {
  durationMs: number
  tracks: TimelineTrack[]
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
