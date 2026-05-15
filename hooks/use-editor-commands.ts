"use client"

import * as React from "react"
import { toast } from "sonner"
import { nanoid } from "nanoid"

import type { ShortcutAction } from "@/lib/editor/shortcuts"
import { registerShortcuts } from "@/lib/editor/shortcuts"
import {
  pushCommand,
  undo as undoHistory,
  redo as redoHistory,
  canUndo,
  canRedo,
  getHistory,
  resetHistory,
} from "@/lib/editor/history"
import {
  setClipboard,
  getClipboard,
  hasClipboard,
  clearClipboard,
} from "@/lib/editor/clipboard"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { useEditorStore } from "@/lib/editor/editor-store"
import { usePlaybackStore } from "@/lib/editor/playback-store"
import { getPlaybackManager } from "@/lib/editor/playback"
import { updateProject } from "@/lib/projects/repo"
import type { TimelineElement } from "@/lib/db/types"

/**
 * Registers keyboard shortcuts and orchestrates undo/redo, clipboard,
 * and bulk timeline operations.
 */
export function useEditorCommands() {
  const selectedIdsRef = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    resetHistory()
    clearClipboard()
  }, [])

  // Keep selectedIdsRef in sync
  const selectedIds = useTimelineStore((s) => s.selectedElementIds)
  selectedIdsRef.current = selectedIds

  const handleAction = React.useCallback(
    (action: ShortcutAction, _event: KeyboardEvent) => {
      const store = useTimelineStore.getState()
      const pm = getPlaybackManager()

      // --- Snapshot helper ---
      const withHistory = (label: string, fn: () => void) => {
        const before = store.snapshotTracks()
        fn()
        const after = useTimelineStore.getState().snapshotTracks()
        pushCommand(label, before, after)
        scheduleAutosave()
      }

      switch (action) {
        // --- Transport ---
        case "playPause":
          pm.toggle()
          return

        case "frameForward":
          pm.frameForward()
          return

        case "frameBackward":
          pm.frameBackward()
          return

        case "jumpStart":
          pm.jumpToStart()
          return

        case "jumpEnd":
          pm.jumpToEnd()
          return

        // --- Split ---
        case "split": {
          const ids = store.selectedElementIds
          if (ids.size === 0) return
          const playheadTime = pm.currentTime

          withHistory("Split", () => {
            const s = useTimelineStore.getState()
            const elements: Array<{ elementId: string; trackId: string }> = []

            for (const tid of ids) {
              for (const track of s.tracks) {
                const el = track.elements.find((e) => e.id === tid)
                if (!el) continue
                const elStart = el.startTime
                const elEnd = elStart + el.duration
                if (playheadTime <= elStart || playheadTime >= elEnd) continue
                elements.push({ elementId: el.id, trackId: track.id })
              }
            }

            for (const { elementId, trackId } of elements) {
              const el = s.tracks
                .flatMap((t) => t.elements)
                .find((e) => e.id === elementId)
              if (!el) continue

              const firstDur = playheadTime - el.startTime
              const secondDur = el.startTime + el.duration - playheadTime

              // Remove original
              s.removeElement(elementId)

              // Add first half
              s.addElement({
                trackId,
                type: el.type,
                name: `${el.name} (1)`,
                mediaId: el.mediaId,
                startTime: el.startTime,
                duration: firstDur,
                sourceDuration: el.trimStart + el.duration + el.trimEnd,
              })

              // Add second half
              s.addElement({
                trackId,
                type: el.type,
                name: `${el.name} (2)`,
                mediaId: el.mediaId,
                startTime: playheadTime,
                duration: secondDur,
                sourceDuration: el.trimStart + el.duration + el.trimEnd,
              })
            }
          })
          return
        }

        // --- Delete ---
        case "delete": {
          const ids = store.selectedElementIds
          if (ids.size === 0) return

          withHistory(`Delete ${ids.size} clip${ids.size > 1 ? "s" : ""}`, () => {
            const s = useTimelineStore.getState()
            const ripple = s.rippleEnabled

            // Collect info before removal for ripple
            const toRemove: Array<{
              elementId: string
              trackId: string
              startTime: number
              duration: number
            }> = []
            for (const tid of ids) {
              for (const track of s.tracks) {
                const el = track.elements.find((e) => e.id === tid)
                if (el) {
                  toRemove.push({
                    elementId: el.id,
                    trackId: track.id,
                    startTime: el.startTime,
                    duration: el.duration,
                  })
                  break
                }
              }
            }

            // Remove all
            for (const item of toRemove) {
              s.removeElement(item.elementId)
            }

            // Ripple: shift later elements on same tracks
            if (ripple) {
              for (const item of toRemove) {
                for (const track of s.tracks) {
                  if (track.id === item.trackId) {
                    for (const el of track.elements) {
                      if (el.startTime >= item.startTime) {
                        s.moveElement(
                          el.id,
                          track.id,
                          Math.max(0, el.startTime - item.duration)
                        )
                      }
                    }
                    break
                  }
                }
              }
            }
          })
          return
        }

        // --- Undo / Redo ---
        case "undo": {
          if (!canUndo()) return
          const result = undoHistory()
          if (result) {
            store.restoreTracks(result.tracks)
            store.clearSelection()
            scheduleAutosave()
          }
          return
        }

        case "redo": {
          if (!canRedo()) return
          const result = redoHistory()
          if (result) {
            store.restoreTracks(result.tracks)
            store.clearSelection()
            scheduleAutosave()
          }
          return
        }

        // --- Cut ---
        case "cut": {
          const ids = store.selectedElementIds
          if (ids.size === 0) return

          const entries = collectClipEntries(ids, store)
          if (entries.length === 0) return
          setClipboard(entries)

          withHistory(`Cut ${entries.length} clip${entries.length > 1 ? "s" : ""}`, () => {
            const s = useTimelineStore.getState()
            for (const id of ids) {
              s.removeElement(id)
            }
          })
          return
        }

        // --- Copy ---
        case "copy": {
          const ids = store.selectedElementIds
          if (ids.size === 0) return
          const entries = collectClipEntries(ids, store)
          if (entries.length > 0) {
            setClipboard(entries)
          }
          return
        }

        // --- Paste ---
        case "paste": {
          if (!hasClipboard()) return
          const entries = getClipboard()

          withHistory(`Paste ${entries.length} clip${entries.length > 1 ? "s" : ""}`, () => {
            const s = useTimelineStore.getState()
            const pasteTime = pm.currentTime

            for (const entry of entries) {
              const videoTrack =
                s.tracks.find((t) => t.type === "video") ??
                (() => {
                  const tid = s.addTrack("video", "Video")
                  return useTimelineStore.getState().tracks.find((t) => t.id === tid) ?? null
                })()

              if (!videoTrack) continue

              const newEl = { ...entry.element, id: nanoid(10) }
              s.addElement({
                trackId: videoTrack.id,
                type: newEl.type,
                name: entry.element.name,
                mediaId: entry.element.mediaId,
                startTime: pasteTime,
                duration: entry.element.duration,
                sourceDuration:
                  entry.element.trimStart + entry.element.duration + entry.element.trimEnd,
              })
            }
          })
          return
        }

        // --- Duplicate ---
        case "duplicate": {
          const ids = store.selectedElementIds
          if (ids.size === 0) return

          withHistory(`Duplicate ${ids.size} clip${ids.size > 1 ? "s" : ""}`, () => {
            const s = useTimelineStore.getState()
            const newIds: string[] = []

            for (const id of ids) {
              let found: { element: TimelineElement; trackId: string } | null = null
              for (const track of s.tracks) {
                const el = track.elements.find((e) => e.id === id)
                if (el) {
                  found = { element: el, trackId: track.id }
                  break
                }
              }
              if (!found) continue

              const nid = s.addElement({
                trackId: found.trackId,
                type: found.element.type,
                name: `${found.element.name} (copy)`,
                mediaId: found.element.mediaId,
                startTime: found.element.startTime + found.element.duration + 0.1,
                duration: found.element.duration,
                sourceDuration:
                  found.element.trimStart +
                  found.element.duration +
                  found.element.trimEnd,
              })
              newIds.push(nid)
            }

            s.setSelectedElements(newIds)
          })
          return
        }

        // --- Selection ---
        case "selectAll":
          store.selectAllElements()
          return

        case "deselect":
          store.clearSelection()
          return

        // --- Toggles ---
        case "toggleRipple":
          store.toggleRipple()
          return

        case "toggleSnap":
          store.toggleSnap()
          return

        case "showShortcuts":
          useEditorStore.getState().setShortcutsDialogOpen(true)
          return

        default:
          return
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  React.useEffect(() => {
    return registerShortcuts(handleAction)
  }, [handleAction])

  return { canUndo, canRedo, getHistory }
}

/** Collect clipboard entries from selected element IDs. */
function collectClipEntries(
  ids: Set<string>,
  store: ReturnType<typeof useTimelineStore.getState>
) {
  const entries: Array<{
    element: ReturnType<typeof store.snapshotTracks> extends Array<infer T> ? any : never
    mediaKind: "video" | "image" | "audio"
  }> = []

  for (const id of ids) {
    for (const track of store.tracks) {
      const el = track.elements.find((e) => e.id === id)
      if (!el) continue

      let mediaKind: "video" | "image" | "audio" = "video"
      if (el.type === "image") mediaKind = "image"
      else if (el.type === "audio") mediaKind = "audio"

      entries.push({ element: { ...el }, mediaKind })
      break
    }
  }
  return entries
}

let _autosaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutosave() {
  if (_autosaveTimer) clearTimeout(_autosaveTimer)
  _autosaveTimer = setTimeout(() => {
    const project = useEditorStore.getState().project
    if (!project) return
    const tracks = useTimelineStore.getState().snapshotTracks()
    const duration = useTimelineStore.getState().duration

    useEditorStore.getState().setSaveStatus("saving")
    updateProject(project.id, {
      timeline: { durationMs: duration * 1000, tracks },
    })
      .then(() => {
        useEditorStore.getState().markSaved()
      })
      .catch(() => {
        toast.error("Failed to save project")
        useEditorStore.getState().setSaveStatus("error", "Save failed")
      })
  }, 1000)
}
