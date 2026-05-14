// Domain types for imported media assets.

export type MediaKind = "video" | "audio" | "image"

/**
 * A media asset stored in the project library.
 * Binary data lives separately in IndexedDB (see media-repo).
 */
export interface MediaAsset {
  id: string
  /** Owning project. Lets us scope listings and cleanup. */
  projectId: string
  name: string
  kind: MediaKind
  mimeType: string
  byteSize: number
  /** Source duration in seconds. 0 for stills. */
  durationSec: number
  /** Native resolution if known. */
  width?: number
  height?: number
  /** Frame rate, if known. */
  fps?: number
  /** Audio sample rate / channels, if known. */
  sampleRate?: number
  channelCount?: number
  /** Data URL for the cover/poster frame. */
  thumbnailDataUrl?: string
  createdAt: number
  /** Schema version for future migrations. */
  version: number
}

export const MEDIA_VERSION = 1

export const ACCEPTED_MIME_PATTERNS = [
  "video/",
  "audio/",
  "image/",
] as const

export function detectKind(mime: string): MediaKind | null {
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  if (mime.startsWith("image/")) return "image"
  return null
}
