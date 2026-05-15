"use client"

import * as React from "react"
import {
  Magnet,
  Plus,
  Scissors,
  Trash,
  FlowArrow,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { PanelShell } from "@/components/editor/panel-shell"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TimelineRuler } from "@/components/editor/panels/timeline/timeline-ruler"
import { TimelineTrackRow } from "@/components/editor/panels/timeline/timeline-track"
import { TimelinePlayhead } from "@/components/editor/panels/timeline/timeline-playhead"
import { useEditorCommands } from "@/hooks/use-editor-commands"
import { pushCommand } from "@/lib/editor/history"
import { useTimelineStore, ZOOM_MIN, ZOOM_MAX, TRACK_LABEL_W } from "@/lib/editor/timeline-store"
import { useEditorStore } from "@/lib/editor/editor-store"
import { useMediaStore } from "@/lib/media/store"
import { getPlaybackManager } from "@/lib/editor/playback"
import type { TimelineElement, TrackType, ElementType } from "@/lib/db/types"

export function TimelinePanel() {
  const project = useEditorStore((s) => s.project)
  const tracks = useTimelineStore((s) => s.tracks)
  const zoom = useTimelineStore((s) => s.zoom)
  const duration = useTimelineStore((s) => s.duration)
  const snapEnabled = useTimelineStore((s) => s.snapEnabled)
  const rippleEnabled = useTimelineStore((s) => s.rippleEnabled)
  const addTrack = useTimelineStore((s) => s.addTrack)
  const addElement = useTimelineStore((s) => s.addElement)
  const moveElement = useTimelineStore((s) => s.moveElement)
  const removeElement = useTimelineStore((s) => s.removeElement)
  const trimElement = useTimelineStore((s) => s.trimElement)
  const updateElement = useTimelineStore((s) => s.updateElement)
  const setZoom = useTimelineStore((s) => s.setZoom)
  const toggleSnap = useTimelineStore((s) => s.toggleSnap)
  const toggleRipple = useTimelineStore((s) => s.toggleRipple)
  const setSelectedElements = useTimelineStore((s) => s.setSelectedElements)
  const toggleSelectedElement = useTimelineStore((s) => s.toggleSelectedElement)
  const clearSelection = useTimelineStore((s) => s.clearSelection)
  const selectedIds = useTimelineStore((s) => s.selectedElementIds)
  const loadTracks = useTimelineStore((s) => s.loadTracks)
  const snapshotTracks = useTimelineStore((s) => s.snapshotTracks)
  const restoreTracks = useTimelineStore((s) => s.restoreTracks)

  const mediaAssets = useMediaStore((s) => s.assets)

  // Register editor commands (shortcuts, undo/redo, clipboard)
  useEditorCommands()

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = React.useState(0)

  // Load tracks from project on mount
  React.useEffect(() => {
    if (project?.timeline?.tracks?.length) {
      loadTracks(project.timeline.tracks as typeof tracks)
    }
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep playback manager duration in sync
  React.useEffect(() => {
    const pm = getPlaybackManager()
    pm.setDuration(duration)
  }, [duration])

  // Zoom slider value (0–1 → zoom range)
  const zoomSlider = Math.max(
    0,
    Math.min(1, Math.log(zoom / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN))
  )

  // Total timeline content width
  const contentWidth = Math.max(
    800,
    duration * zoom + TRACK_LABEL_W + 200
  )

  // --- Drag-drop from media library ---
  const handleTrackDrop = React.useCallback(
    (e: React.DragEvent, trackId: string) => {
      e.preventDefault()
      const mediaId = e.dataTransfer.getData("application/x-peprin-media")
      if (!mediaId) return

      const asset = mediaAssets.find((a) => a.id === mediaId)
      if (!asset) return

      const track = tracks.find((t) => t.id === trackId)
      if (!track) return

      const typeMap: Record<string, ElementType> = {
        video: "video",
        image: "image",
        audio: "audio",
      }
      const elType = typeMap[asset.kind]
      if (!elType) return

      const before = snapshotTracks()

      if (elType === "audio" && track.type !== "audio") {
        const audioTrack =
          tracks.find((t) => t.type === "audio") ||
          (() => {
            const id = addTrack("audio", "Audio")
            return tracks.find((t) => t.id === id) || null
          })()
        if (!audioTrack) return
        addElement({
          trackId: audioTrack.id,
          type: elType,
          name: asset.name,
          mediaId: asset.id,
          startTime: duration,
          duration: asset.durationSec || 5,
          sourceDuration: asset.durationSec || 5,
        })
      } else if (elType !== "audio" && track.type === "video") {
        addElement({
          trackId,
          type: elType,
          name: asset.name,
          mediaId: asset.id,
          startTime: duration,
          duration: asset.durationSec || 5,
          sourceDuration: asset.durationSec || 5,
        })
      } else {
        return
      }

      const after = snapshotTracks()
      pushCommand(`Add ${asset.name}`, before, after)
    },
    [mediaAssets, tracks, addTrack, addElement, duration, snapshotTracks]
  )

  // --- Find element helper ---
  const findElement = React.useCallback(
    (id: string): { element: TimelineElement; trackId: string } | null => {
      for (const t of tracks) {
        const el = t.elements.find((e) => e.id === id)
        if (el) return { element: el, trackId: t.id }
      }
      return null
    },
    [tracks]
  )

  // --- Auto-scroll when dragging near edges ---
  const autoScrollTimerRef = React.useRef<number | null>(null)
  const startAutoScroll = React.useCallback(
    (edgeDist: number, direction: number) => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current)
      autoScrollTimerRef.current = window.setInterval(() => {
        const el = scrollRef.current
        if (!el) return
        const speed = Math.max(8, Math.abs(80 - edgeDist) * 0.5)
        el.scrollLeft += direction * speed
      }, 16)
    },
    []
  )
  const stopAutoScroll = React.useCallback(() => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current)
      autoScrollTimerRef.current = null
    }
  }, [])

  // --- Clip dragging (move) ---
  const dragRef = React.useRef<{
    active: boolean
    elementId: string | null
    pointerId: number | null
    startX: number
    startTime: number
    originalTrackId: string | null
    isTrim: "left" | "right" | null
    originalTrimStart: number
    originalTrimEnd: number
    originalDuration: number
    sourceDuration: number
    beforeTracks: ReturnType<typeof snapshotTracks> | null
  }>({
    active: false,
    elementId: null,
    pointerId: null,
    startX: 0,
    startTime: 0,
    originalTrackId: null,
    isTrim: null,
    originalTrimStart: 0,
    originalTrimEnd: 0,
    originalDuration: 0,
    sourceDuration: 0,
    beforeTracks: null,
  })

  // --- Move element ---
  const handleElementPointerDown = React.useCallback(
    (e: React.PointerEvent, elementId: string) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const found = findElement(elementId)
      if (!found) return

      if (e.shiftKey) {
        toggleSelectedElement(elementId)
      } else {
        setSelectedElements([elementId])
      }

      dragRef.current = {
        active: true,
        elementId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startTime: found.element.startTime,
        originalTrackId: found.trackId,
        isTrim: null,
        originalTrimStart: found.element.trimStart,
        originalTrimEnd: found.element.trimEnd,
        originalDuration: found.element.duration,
        sourceDuration: found.element.trimStart + found.element.duration + found.element.trimEnd,
        beforeTracks: snapshotTracks(),
      }
    },
    [setSelectedElements, toggleSelectedElement, findElement, snapshotTracks]
  )

  // --- Trim element ---
  const handleTrimPointerDown = React.useCallback(
    (e: React.PointerEvent, elementId: string, side: "left" | "right") => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const found = findElement(elementId)
      if (!found) return

      setSelectedElements([elementId])

      dragRef.current = {
        active: true,
        elementId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startTime: found.element.startTime,
        originalTrackId: found.trackId,
        isTrim: side,
        originalTrimStart: found.element.trimStart,
        originalTrimEnd: found.element.trimEnd,
        originalDuration: found.element.duration,
        sourceDuration:
          found.element.trimStart + found.element.duration + found.element.trimEnd,
        beforeTracks: snapshotTracks(),
      }
    },
    [setSelectedElements, findElement, snapshotTracks]
  )

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d.active || d.pointerId !== e.pointerId || !d.elementId) return

      const dx = e.clientX - d.startX
      const dt = dx / zoom

      // Auto-scroll near window edges
      const edgeDist = 80
      if (e.clientX < edgeDist) startAutoScroll(e.clientX, -1)
      else if (e.clientX > window.innerWidth - edgeDist)
        startAutoScroll(window.innerWidth - e.clientX, 1)
      else stopAutoScroll()

      if (d.isTrim === "left") {
        // Left trim: change startTime and duration, adjust trimStart
        const newStart = d.startTime + dt
        const sourceDur = d.sourceDuration
        const originalEnd = d.startTime + d.originalDuration

        let clampStart = Math.max(0, newStart)
        const maxStart = originalEnd - 0.1
        if (clampStart >= maxStart) clampStart = maxStart - 0.1

        const newDur = Math.max(0.1, originalEnd - clampStart)
        const trimDelta = clampStart - d.startTime
        const newTrimStart = Math.max(0, d.originalTrimStart + trimDelta)
        const newTrimEnd = Math.max(0, sourceDur - newTrimStart - newDur)

        updateElement(d.elementId, {
          startTime: Math.max(0, clampStart),
          duration: newDur,
          trimStart: newTrimStart,
          trimEnd: newTrimEnd,
        })
      } else if (d.isTrim === "right") {
        // Right trim: change duration, adjust trimEnd
        const newDur = Math.max(0.1, d.originalDuration + dt)
        const sourceDur = d.sourceDuration
        const newTrimEnd = Math.max(0, sourceDur - d.originalTrimStart - newDur)

        updateElement(d.elementId, {
          duration: newDur,
          trimEnd: newTrimEnd,
        })
      } else {
        // Move
        let newStart = d.startTime + dt

        if (snapEnabled) {
          if (Math.abs(newStart) < 0.1) newStart = 0
          const pm = getPlaybackManager()
          if (Math.abs(newStart - pm.currentTime) < 0.15) newStart = pm.currentTime
          for (const t of tracks) {
            for (const el of t.elements) {
              if (el.id === d.elementId) continue
              const elEnd = el.startTime + el.duration
              if (Math.abs(newStart - el.startTime) < 0.15) newStart = el.startTime
              if (Math.abs(newStart - elEnd) < 0.15) newStart = elEnd
              const found = findElement(d.elementId!)
              if (
                found &&
                Math.abs(newStart + found.element.duration - el.startTime) < 0.15
              )
                newStart = el.startTime - found.element.duration
            }
          }
        }

        moveElement(d.elementId, d.originalTrackId!, Math.max(0, newStart))
      }
    }

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current
      if (d.pointerId !== e.pointerId) return

      stopAutoScroll()

      if (d.active && d.elementId && d.beforeTracks) {
        const after = snapshotTracks()
        const label = d.isTrim
          ? `Trim`
          : `Move`
        pushCommand(label, d.beforeTracks, after)
      }

      dragRef.current = {
        active: false,
        elementId: null,
        pointerId: null,
        startX: 0,
        startTime: 0,
        originalTrackId: null,
        isTrim: null,
        originalTrimStart: 0,
        originalTrimEnd: 0,
        originalDuration: 0,
        sourceDuration: 0,
        beforeTracks: null,
      }
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      stopAutoScroll()
    }
  }, [zoom, snapEnabled, moveElement, trimElement, tracks, findElement, snapshotTracks, startAutoScroll, stopAutoScroll])

  // --- Delete selection ---
  const handleDelete = React.useCallback(() => {
    if (selectedIds.size === 0) return

    const before = snapshotTracks()
    const store = useTimelineStore.getState()
    const ripple = store.rippleEnabled

    const toRemove: Array<{
      elementId: string
      trackId: string
      startTime: number
      duration: number
    }> = []
    for (const tid of selectedIds) {
      for (const track of tracks) {
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

    for (const item of toRemove) {
      removeElement(item.elementId)
    }

    if (ripple) {
      for (const item of toRemove) {
        for (const track of tracks) {
          if (track.id === item.trackId) {
            for (const el of track.elements) {
              if (el.startTime >= item.startTime) {
                moveElement(el.id, track.id, Math.max(0, el.startTime - item.duration))
              }
            }
            break
          }
        }
      }
    }

    const after = snapshotTracks()
    pushCommand(`Delete ${toRemove.length} clip${toRemove.length > 1 ? "s" : ""}`, before, after)
  }, [selectedIds, tracks, removeElement, moveElement, snapshotTracks])

  // --- Split at playhead ---
  const handleSplit = React.useCallback(() => {
    if (selectedIds.size === 0) return
    const pm = getPlaybackManager()
    const playheadTime = pm.currentTime

    const before = snapshotTracks()
    const store = useTimelineStore.getState()
    const elements: Array<{ element: TimelineElement; trackId: string }> = []

    for (const tid of selectedIds) {
      for (const track of store.tracks) {
        const el = track.elements.find((e) => e.id === tid)
        if (!el) continue
        const elStart = el.startTime
        const elEnd = elStart + el.duration
        if (playheadTime <= elStart || playheadTime >= elEnd) continue
        elements.push({ element: el, trackId: track.id })
      }
    }

    for (const { element, trackId } of elements) {
      const firstDur = playheadTime - element.startTime
      const secondDur = element.startTime + element.duration - playheadTime

      removeElement(element.id)

      addElement({
        trackId,
        type: element.type,
        name: `${element.name} (1)`,
        mediaId: element.mediaId,
        startTime: element.startTime,
        duration: firstDur,
        sourceDuration: element.trimStart + element.duration + element.trimEnd,
      })

      addElement({
        trackId,
        type: element.type,
        name: `${element.name} (2)`,
        mediaId: element.mediaId,
        startTime: playheadTime,
        duration: secondDur,
        sourceDuration: element.trimStart + element.duration + element.trimEnd,
      })
    }

    const after = snapshotTracks()
    pushCommand("Split", before, after)
  }, [selectedIds, removeElement, addElement, snapshotTracks])

  // --- Add track ---
  const handleAddTrack = React.useCallback(() => {
    const before = snapshotTracks()
    addTrack(tracks.length === 0 ? "video" : "audio")
    const after = snapshotTracks()
    pushCommand("Add track", before, after)
  }, [addTrack, tracks.length, snapshotTracks])

  // Clear selection on outside click
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-timeline-clip]") || target.closest("[data-timeline-track-label]")) return
      if (selectedIds.size > 0) {
        clearSelection()
      }
    }
    window.addEventListener("click", onClick)
    return () => window.removeEventListener("click", onClick)
  }, [selectedIds, clearSelection])

  return (
    <PanelShell
      title="Timeline"
      trailing={
        <div className="flex items-center gap-1">
          {/* Split */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Split at playhead (S)"
                onClick={handleSplit}
                disabled={selectedIds.size === 0}
              >
                <Scissors size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split at playhead (S)</TooltipContent>
          </Tooltip>

          {/* Delete */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete selected clips"
                onClick={handleDelete}
                disabled={selectedIds.size === 0}
              >
                <Trash size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected clips (Del)</TooltipContent>
          </Tooltip>

          {/* Ripple */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={rippleEnabled ? "Ripple on" : "Ripple off"}
                onClick={toggleRipple}
              >
                <FlowArrow
                  size={14}
                  weight="bold"
                  className={
                    rippleEnabled ? "text-primary" : "text-muted-foreground"
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle ripple mode</TooltipContent>
          </Tooltip>

          {/* Snap */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={snapEnabled ? "Snap on" : "Snap off"}
                onClick={toggleSnap}
              >
                <Magnet
                  size={14}
                  weight="bold"
                  className={
                    snapEnabled ? "text-primary" : "text-muted-foreground"
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle snapping</TooltipContent>
          </Tooltip>

          {/* Zoom slider */}
          <div className="w-20 px-1">
            <Slider
              min={0}
              max={1}
              step={0.001}
              value={[zoomSlider]}
              onValueChange={([v]) => {
                if (v === undefined) return
                const z = ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, v)
                setZoom(z)
              }}
            />
          </div>

          {/* Add track */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Add track"
                onClick={handleAddTrack}
              >
                <Plus size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add track</TooltipContent>
          </Tooltip>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {/* Ruler */}
        <TimelineRuler
          scrollLeft={scrollLeft}
          onSeek={(time) => {
            const pm = getPlaybackManager()
            pm.seek(time)
          }}
        />

        {/* Tracks + playhead */}
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col overflow-auto"
          onScroll={(e) => {
            setScrollLeft((e.target as HTMLElement).scrollLeft)
          }}
        >
          {/* Scrollable content wrapper */}
          <div
            className="relative"
            style={{ width: contentWidth, minHeight: "100%" }}
          >
            {tracks.map((track) => (
              <TimelineTrackRow
                key={track.id}
                track={track}
                zoom={zoom}
                onElementPointerDown={handleElementPointerDown}
                onTrimPointerDown={handleTrimPointerDown}
                onTrackDrop={handleTrackDrop}
              />
            ))}

            {/* Drop zone when no tracks */}
            {tracks.length === 0 && (
              <div
                className="flex h-32 items-center justify-center text-muted-foreground text-xs"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "copy"
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const mediaId = e.dataTransfer.getData(
                    "application/x-peprin-media"
                  )
                  if (!mediaId) return
                  const asset = mediaAssets.find((a) => a.id === mediaId)
                  if (!asset) return
                  const trackType: TrackType =
                    asset.kind === "audio" ? "audio" : "video"
                  const elType: ElementType =
                    asset.kind === "audio"
                      ? "audio"
                      : asset.kind === "image"
                        ? "image"
                        : "video"

                  const before = snapshotTracks()
                  const trackId = addTrack(trackType)
                  addElement({
                    trackId,
                    type: elType,
                    name: asset.name,
                    mediaId: asset.id,
                    startTime: 0,
                    duration: asset.durationSec || 5,
                    sourceDuration: asset.durationSec || 5,
                  })
                  const after = snapshotTracks()
                  pushCommand(`Add ${asset.name}`, before, after)
                }}
              >
                Drop media here to add a track
              </div>
            )}

            {/* Playhead */}
            <TimelinePlayhead scrollLeft={scrollLeft} />
          </div>
        </div>
      </div>
    </PanelShell>
  )
}
