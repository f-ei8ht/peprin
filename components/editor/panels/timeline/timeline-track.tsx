"use client"

import * as React from "react"

import type { TimelineElement, TimelineTrack } from "@/lib/db/types"
import {
  useTimelineStore,
  TRACK_LABEL_W,
} from "@/lib/editor/timeline-store"

interface TimelineClipProps {
  element: TimelineElement
  track: TimelineTrack
  zoom: number
  isSelected: boolean
  onPointerDown: (e: React.PointerEvent, elementId: string) => void
}

export function TimelineClip({
  element,
  track,
  zoom,
  isSelected,
  onPointerDown,
}: TimelineClipProps) {
  const left = element.startTime * zoom
  const width = Math.max(4, element.duration * zoom)

  const color = track.type === "audio" ? "#8F5DBA" : "#5D93BA"
  const bg = track.type === "audio"
    ? "bg-[#8F5DBA]/20"
    : "bg-[#5D93BA]/20"

  return (
    <div
      className="absolute top-1 bottom-1 rounded-md border cursor-grab active:cursor-grabbing select-none"
      style={{
        left,
        width,
        backgroundColor: isSelected ? `${color}40` : undefined,
        borderColor: isSelected ? color : `${color}40`,
      }}
      onPointerDown={(e) => onPointerDown(e, element.id)}
    >
      {/* Thumbnail area */}
      <div className={`${bg} absolute inset-0 rounded-md flex items-center px-2 overflow-hidden`}>
        <span className="text-foreground/70 truncate text-[11px] font-medium">
          {element.name}
        </span>
      </div>

      {/* Trim handles — only when selected */}
      {isSelected && (
        <>
          <button
            className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/20 rounded-l-md"
            onPointerDown={(e) => {
              e.stopPropagation()
              // handled by trim logic in parent
            }}
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/20 rounded-r-md"
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
          />
        </>
      )}
    </div>
  )
}

interface TimelineTrackRowProps {
  track: TimelineTrack
  zoom: number
  onElementPointerDown: (e: React.PointerEvent, elementId: string) => void
  onTrackDrop: (e: React.DragEvent, trackId: string) => void
}

export function TimelineTrackRow({
  track,
  zoom,
  onElementPointerDown,
  onTrackDrop,
}: TimelineTrackRowProps) {
  const selectedIds = useTimelineStore((s) => s.selectedElementIds)

  return (
    <div className="flex h-[44px] shrink-0 items-stretch border-b border-foreground/10">
      {/* Label */}
      <div
        className="bg-background flex shrink-0 items-center border-r border-foreground/10 px-3"
        style={{ width: TRACK_LABEL_W }}
      >
        <span className="text-foreground/70 text-xs font-medium">{track.name}</span>
      </div>

      {/* Clip area */}
      <div
        className="bg-foreground/[0.02] relative flex-1 overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = "copy"
        }}
        onDrop={(e) => onTrackDrop(e, track.id)}
      >
        {track.elements.map((el) => (
          <TimelineClip
            key={el.id}
            element={el}
            track={track}
            zoom={zoom}
            isSelected={selectedIds.has(el.id)}
            onPointerDown={onElementPointerDown}
          />
        ))}
      </div>
    </div>
  )
}
