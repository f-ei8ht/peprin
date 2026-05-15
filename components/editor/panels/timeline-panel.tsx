"use client"

import * as React from "react"
import {
  Magnet,
  Plus,
  Scissors,
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
  const addTrack = useTimelineStore((s) => s.addTrack)
  const addElement = useTimelineStore((s) => s.addElement)
  const moveElement = useTimelineStore((s) => s.moveElement)
  const removeElement = useTimelineStore((s) => s.removeElement)
  const setZoom = useTimelineStore((s) => s.setZoom)
  const toggleSnap = useTimelineStore((s) => s.toggleSnap)
  const setSelectedElements = useTimelineStore((s) => s.setSelectedElements)
  const selectedIds = useTimelineStore((s) => s.selectedElementIds)
  const loadTracks = useTimelineStore((s) => s.loadTracks)

  const mediaAssets = useMediaStore((s) => s.assets)

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

      // Find the track to verify compatibility
      const track = tracks.find((t) => t.id === trackId)
      if (!track) return

      // Map media kind → element type
      const typeMap: Record<string, ElementType> = {
        video: "video",
        image: "image",
        audio: "audio",
      }
      const elType = typeMap[asset.kind]
      if (!elType) return

      // Audio can only go on audio tracks, visuals on video tracks
      if (elType === "audio" && track.type !== "audio") {
        // Try to find or create an audio track
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
        return
      }
      if (elType !== "audio" && track.type !== "video") return

      addElement({
        trackId,
        type: elType,
        name: asset.name,
        mediaId: asset.id,
        startTime: duration,
        duration: asset.durationSec || 5,
        sourceDuration: asset.durationSec || 5,
      })
    },
    [mediaAssets, tracks, addTrack, addElement, duration]
  )

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
  })

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

  const handleElementPointerDown = React.useCallback(
    (e: React.PointerEvent, elementId: string) => {
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
        isTrim: null,
        originalTrimStart: found.element.trimStart,
        originalTrimEnd: found.element.trimEnd,
      }
    },
    [setSelectedElements, findElement]
  )

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d.active || d.pointerId !== e.pointerId || !d.elementId) return
      if (d.isTrim) return // trim handled separately

      const dx = e.clientX - d.startX
      const dt = dx / zoom
      let newStart = d.startTime + dt

      // Snap
      if (snapEnabled) {
        // Snap to 0
        if (Math.abs(newStart) < 0.1) newStart = 0
        // Snap to playhead
        const pm = getPlaybackManager()
        if (Math.abs(newStart - pm.currentTime) < 0.15) newStart = pm.currentTime
        // Snap to element edges (simplified)
        for (const t of tracks) {
          for (const el of t.elements) {
            if (el.id === d.elementId) continue
            const elEnd = el.startTime + el.duration
            if (Math.abs(newStart - el.startTime) < 0.15) newStart = el.startTime
            if (Math.abs(newStart - elEnd) < 0.15) newStart = elEnd
            const found = findElement(d.elementId!)
            if (found && Math.abs(newStart + found.element.duration - el.startTime) < 0.15)
              newStart = el.startTime - found.element.duration
          }
        }
      }

      moveElement(d.elementId, d.originalTrackId!, Math.max(0, newStart))
    }

    const onUp = (e: PointerEvent) => {
      if (dragRef.current.pointerId !== e.pointerId) return
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
      }
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [zoom, snapEnabled, moveElement, tracks, findElement])

  // --- Split at playhead ---
  const handleSplit = React.useCallback(() => {
    const pm = getPlaybackManager()
    const playheadTime = pm.currentTime

    for (const id of selectedIds) {
      const found = findElement(id)
      if (!found) continue

      const { element, trackId } = found
      const elStart = element.startTime
      const elEnd = elStart + element.duration

      if (playheadTime <= elStart || playheadTime >= elEnd) continue

      // Update first half — trim second half off
      moveElement(id, trackId, elStart)
      // This is getting complex. Let me simplify by directly manipulating
      // via the updateElement action
    }
    // For now, a simplified split: delete and create two new elements
    const splits: Array<{ trackId: string; element: TimelineElement }> = []
    for (const id of selectedIds) {
      const found = findElement(id)
      if (!found) continue
      const { element, trackId } = found
      const elStart = element.startTime
      const elEnd = elStart + element.duration
      if (playheadTime <= elStart || playheadTime >= elEnd) continue
      splits.push({ trackId, element })
    }

    for (const { trackId, element } of splits) {
      removeElement(element.id)
      const firstDur = playheadTime - element.startTime
      const secondDur = element.startTime + element.duration - playheadTime
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
  }, [selectedIds, findElement, removeElement, addElement, moveElement])

  // --- Add track ---
  const handleAddTrack = () => {
    addTrack(tracks.length === 0 ? "video" : "audio")
  }

  return (
    <PanelShell
      title="Timeline"
      trailing={
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Split at playhead"
                onClick={handleSplit}
                disabled={selectedIds.size === 0}
              >
                <Scissors size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split at playhead</TooltipContent>
          </Tooltip>
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
                  className={snapEnabled ? "text-primary" : "text-muted-foreground"}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle snapping</TooltipContent>
          </Tooltip>
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
          <div className="relative" style={{ width: contentWidth, minHeight: "100%" }}>
            {tracks.map((track) => (
              <TimelineTrackRow
                key={track.id}
                track={track}
                zoom={zoom}
                onElementPointerDown={handleElementPointerDown}
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
                  const mediaId = e.dataTransfer.getData("application/x-peprin-media")
                  if (!mediaId) return
                  const asset = mediaAssets.find((a) => a.id === mediaId)
                  if (!asset) return
                  const trackType: TrackType = asset.kind === "audio" ? "audio" : "video"
                  const elType: ElementType =
                    asset.kind === "audio" ? "audio" : asset.kind === "image" ? "image" : "video"
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
