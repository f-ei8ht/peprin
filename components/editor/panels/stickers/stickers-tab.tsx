"use client"

import * as React from "react"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { BUILTIN_STICKERS, STICKER_CATEGORIES, drawBuiltinSticker, type StickerItem } from "@/lib/stickers/types"
import { cn } from "@/lib/utils"
import { nanoid } from "nanoid"

export function StickersTab() {
  const [category, setCategory] = React.useState<string>("all")
  const addElement = useTimelineStore((s) => s.addElement)
  const tracks = useTimelineStore((s) => s.tracks)
  const duration = useTimelineStore((s) => s.duration)

  const filtered =
    category === "all"
      ? BUILTIN_STICKERS
      : BUILTIN_STICKERS.filter((s) => s.category === category)

  const handleAddSticker = (sticker: StickerItem) => {
    const existingTrack = tracks.find((t) => t.type === "sticker")
    let trackId = existingTrack?.id

    if (!existingTrack) {
      trackId = nanoid(8)
      useTimelineStore.getState().loadTracks([...tracks, {
        id: trackId,
        type: "sticker",
        name: "Stickers",
        elements: [],
        muted: false,
        hidden: false,
      }])
    }

    if (!trackId) return

    addElement({
      trackId,
      type: "sticker",
      name: sticker.name,
      mediaId: "",
      startTime: duration > 0 ? 0 : 0,
      duration: 3,
      sourceDuration: 0,
    })

    // Write stickerId to the newly created element
    const state = useTimelineStore.getState()
    const newTrack = state.tracks.find((t) => t.id === trackId)
    if (newTrack && newTrack.elements.length > 0) {
      const lastEl = newTrack.elements[newTrack.elements.length - 1]
      useTimelineStore.getState().updateElement(lastEl.id, {
        stickerId: sticker.id,
        nativeWidth: sticker.width,
        nativeHeight: sticker.height,
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex gap-1 border-b px-3 py-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-colors",
            category === "all"
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
              category === cat
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 p-3">
        {filtered.map((sticker) => (
          <StickerCard key={sticker.id} sticker={sticker} onAdd={handleAddSticker} />
        ))}
      </div>
    </div>
  )
}

function StickerCard({
  sticker,
  onAdd,
}: {
  sticker: StickerItem
  onAdd: (sticker: StickerItem) => void
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const size = 64
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)
    drawBuiltinSticker(ctx, sticker.id, size, size, "currentColor")
  }, [sticker.id])

  return (
    <div className="group relative flex flex-col items-center gap-1 rounded-lg border bg-card p-2 transition-colors hover:border-foreground/20">
      <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted/50">
        <canvas ref={canvasRef} className="size-12 text-foreground" />
      </div>
      <span className="text-foreground truncate text-[10px] font-medium">{sticker.name}</span>
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-0.5 top-0.5 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onAdd(sticker)}
      >
        <Plus size={10} />
      </Button>
    </div>
  )
}
