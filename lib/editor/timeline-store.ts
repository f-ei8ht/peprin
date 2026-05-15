// Timeline store — Zustand state for tracks, clips, zoom, and selection.
//
// Works in seconds. Tracks are stored in a flat array matching the
// TimelineSnapshot.tracks shape for direct persistence.

import { nanoid } from "nanoid"
import { create } from "zustand"

import type { TimelineTrack, TimelineElement, TrackType, ElementType } from "@/lib/db/types"

export const BASE_PPS = 50 // base pixels per second at zoom 1x
export const ZOOM_MIN = 3 // px/s
export const ZOOM_MAX = 600 // px/s
export const TRACK_H = 44 // track row height (px)
export const RULER_H = 28 // ruler height (px)
export const TRACK_LABEL_W = 128 // label column width (px)

export interface TimelineState {
  tracks: TimelineTrack[]
  selectedElementIds: Set<string>
  zoom: number // pixels per second
  snapEnabled: boolean

  // Reactive getters
  duration: number // computed max end time across all elements

  // Actions
  loadTracks: (tracks: TimelineTrack[]) => void
  addTrack: (type: TrackType, name?: string) => string
  removeTrack: (trackId: string) => void

  addElement: (args: {
    trackId: string
    type: ElementType
    name: string
    mediaId: string
    startTime: number
    duration: number
    sourceDuration: number
  }) => string

  removeElement: (elementId: string) => void
  moveElement: (elementId: string, toTrackId: string, newStartTime: number) => void
  trimElement: (elementId: string, trimStart: number, trimEnd: number) => void
  updateElement: (elementId: string, patch: Partial<TimelineElement>) => void

  setZoom: (zoom: number) => void
  toggleSnap: () => void

  setSelectedElements: (ids: Iterable<string>) => void
  toggleSelectedElement: (id: string) => void
  clearSelection: () => void
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  tracks: [],
  selectedElementIds: new Set(),
  zoom: BASE_PPS,
  snapEnabled: true,

  get duration() {
    let max = 0
    for (const track of get().tracks) {
      for (const el of track.elements) {
        const end = el.startTime + el.duration
        if (end > max) max = end
      }
    }
    return max
  },

  loadTracks: (tracks) => set({ tracks }),

  addTrack: (type, name) => {
    const id = nanoid(8)
    const track: TimelineTrack = {
      id,
      type,
      name: name ?? (type === "video" ? "Video" : type === "audio" ? "Audio" : type === "text" ? "Text" : type === "sticker" ? "Stickers" : "Subtitles"),
      elements: [],
      muted: false,
      hidden: false,
    }
    set((s) => ({ tracks: [...s.tracks, track] }))
    return id
  },

  removeTrack: (trackId) =>
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== trackId) })),

  addElement: ({ trackId, type, name, mediaId, startTime, duration, sourceDuration }) => {
    const id = nanoid(10)
    const element: TimelineElement = {
      id,
      type,
      name,
      mediaId,
      startTime,
      duration,
      trimStart: 0,
      trimEnd: Math.max(0, sourceDuration - duration),
      positionX: 0,
      positionY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
    }
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, elements: [...t.elements, element] } : t
      ),
      selectedElementIds: new Set([id]),
    }))
    return id
  },

  removeElement: (elementId) =>
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        elements: t.elements.filter((e) => e.id !== elementId),
      })),
      selectedElementIds: new Set(),
    })),

  moveElement: (elementId, toTrackId, newStartTime) =>
    set((s) => {
      // Find the element and its source track
      let found: TimelineElement | null = null
      for (const t of s.tracks) {
        const el = t.elements.find((e) => e.id === elementId)
        if (el) { found = el; break }
      }
      if (!found) return s

      const moved: TimelineElement = { ...found, startTime: Math.max(0, newStartTime) }
      return {
        tracks: s.tracks.map((t) => {
          const filtered = t.elements.filter((e) => e.id !== elementId)
          if (t.id === toTrackId) {
            return { ...t, elements: [...filtered, moved] }
          }
          return { ...t, elements: filtered }
        }),
      }
    }),

  trimElement: (elementId, trimStart, trimEnd) =>
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        elements: t.elements.map((e) =>
          e.id === elementId
            ? { ...e, trimStart: Math.max(0, trimStart), trimEnd: Math.max(0, trimEnd) }
            : e
        ),
      })),
    })),

  updateElement: (elementId, patch) =>
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        elements: t.elements.map((e) =>
          e.id === elementId ? { ...e, ...patch } : e
        ),
      })),
    })),

  setZoom: (zoom) => set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),

  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  setSelectedElements: (ids) => set({ selectedElementIds: new Set(ids) }),

  toggleSelectedElement: (id) =>
    set((s) => {
      const next = new Set(s.selectedElementIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedElementIds: next }
    }),

  clearSelection: () => set({ selectedElementIds: new Set() }),
}))
