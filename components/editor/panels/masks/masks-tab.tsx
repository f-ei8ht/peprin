"use client"

import * as React from "react"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { useEditorStore } from "@/lib/editor/editor-store"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { MASK_DEFINITIONS, createMask, type MaskType } from "@/lib/masks"

export function MasksTab() {
  const selectedClipIds = useEditorStore((s) => s.selectedClipIds)
  const tracks = useTimelineStore((s) => s.tracks)
  const updateElement = useTimelineStore((s) => s.updateElement)

  const handleAddMask = (type: MaskType) => {
    if (selectedClipIds.size === 0) return

    const mask = createMask(type)

    for (const clipId of selectedClipIds) {
      for (const track of tracks) {
        const el = track.elements.find((e) => e.id === clipId)
        if (el) {
          const existingMasks = el.masks ?? []
          updateElement(clipId, {
            masks: [...existingMasks, mask],
          })
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-3">
      <div className="grid grid-cols-2 gap-2">
        {MASK_DEFINITIONS.map((def) => (
          <MaskCard key={def.type} definition={def} onAdd={handleAddMask} />
        ))}
      </div>
    </div>
  )
}

function MaskCard({
  definition,
  onAdd,
}: {
  definition: { type: MaskType; name: string; description: string }
  onAdd: (type: MaskType) => void
}) {
  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-foreground/20">
      <div className="flex aspect-square items-center justify-center rounded-md bg-muted/50">
        <MaskPreview type={definition.type} />
      </div>
      <div>
        <span className="text-foreground text-xs font-medium">{definition.name}</span>
        <p className="text-muted-foreground text-[10px]">{definition.description}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onAdd(definition.type)}
      >
        <Plus size={12} />
      </Button>
    </div>
  )
}

function MaskPreview({ type }: { type: MaskType }) {
  switch (type) {
    case "rectangle":
      return (
        <div className="border-2 border-foreground/40 h-10 w-14 rounded-sm" />
      )
    case "ellipse":
      return (
        <div className="border-2 border-foreground/40 h-10 w-14 rounded-full" />
      )
    case "polygon":
      return (
        <svg viewBox="0 0 40 30" className="h-10 w-14">
          <polygon
            points="20,2 38,28 2,28"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
        </svg>
      )
    case "freeform":
      return (
        <svg viewBox="0 0 40 30" className="h-10 w-14">
          <path
            d="M5,15 Q10,5 20,10 T35,15 Q30,25 20,20 T5,15"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
        </svg>
      )
  }
}
