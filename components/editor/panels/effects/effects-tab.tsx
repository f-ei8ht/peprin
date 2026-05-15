"use client"

import * as React from "react"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { useEditorStore } from "@/lib/editor/editor-store"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import {
  EFFECT_DEFINITIONS,
  createEffect,
  type EffectDefinition,
} from "@/lib/effects"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "all" as const, label: "All" },
  { id: "blur" as const, label: "Blur" },
  { id: "color" as const, label: "Color" },
  { id: "distortion" as const, label: "Distortion" },
  { id: "stylize" as const, label: "Stylize" },
]

export function EffectsTab() {
  const [category, setCategory] = React.useState<"all" | EffectDefinition["category"]>("all")
  const selectedClipIds = useEditorStore((s) => s.selectedClipIds)
  const tracks = useTimelineStore((s) => s.tracks)
  const updateElement = useTimelineStore((s) => s.updateElement)

  const filtered =
    category === "all"
      ? EFFECT_DEFINITIONS
      : EFFECT_DEFINITIONS.filter((d) => d.category === category)

  const handleAddEffect = (def: EffectDefinition) => {
    if (selectedClipIds.size === 0) return

    const effect = createEffect(def.type)

    for (const clipId of selectedClipIds) {
      for (const track of tracks) {
        const el = track.elements.find((e) => e.id === clipId)
        if (el) {
          const existingEffects = el.effects ?? []
          updateElement(clipId, {
            effects: [...existingEffects, effect],
          })
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex gap-1 border-b px-3 py-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
              category === cat.id
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {filtered.map((def) => (
          <EffectCard key={def.type} definition={def} onAdd={handleAddEffect} />
        ))}
      </div>
    </div>
  )
}

function EffectCard({
  definition,
  onAdd,
}: {
  definition: EffectDefinition
  onAdd: (def: EffectDefinition) => void
}) {
  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-foreground/20">
      <div className="flex aspect-video items-center justify-center rounded-md bg-muted/50">
        <span className="text-muted-foreground text-xs">{definition.name}</span>
      </div>
      <span className="text-foreground text-xs font-medium">{definition.name}</span>
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onAdd(definition)}
      >
        <Plus size={12} />
      </Button>
    </div>
  )
}
