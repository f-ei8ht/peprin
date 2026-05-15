// Clipboard system for copy/cut/paste within and across projects.
// Stores serialized clip data in memory (not the real OS clipboard).

import type { TimelineElement } from "@/lib/db/types"

export interface ClippboardEntry {
  element: TimelineElement
  /** The type of media this clip references (for cross-project paste). */
  mediaKind: "video" | "image" | "audio"
}

let _clipboard: ClippboardEntry[] = []

export function getClipboard(): ClippboardEntry[] {
  return _clipboard
}

export function setClipboard(entries: ClippboardEntry[]): void {
  _clipboard = entries
}

export function clearClipboard(): void {
  _clipboard = []
}

export function hasClipboard(): boolean {
  return _clipboard.length > 0
}
