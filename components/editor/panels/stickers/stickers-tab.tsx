"use client"

import * as React from "react"
import { Plus, Star, Heart, ArrowRight, SealCheck } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { BUILTIN_STICKERS, STICKER_CATEGORIES, type StickerItem } from "@/lib/stickers/types"
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
    let track = tracks.find((t) => t.type === "sticker")
    if (!track) {
      const trackId = nanoid(8)
      addElement({
        trackId: "__create_sticker_track__",
        type: "sticker" as any,
        name: sticker.name,
        mediaId: "",
        startTime: duration > 0 ? 0 : 0,
        duration: 3,
        sourceDuration: 0,
      })
      return
    }

    addElement({
      trackId: track.id,
      type: "sticker" as any,
      name: sticker.name,
      mediaId: sticker.id,
      startTime: duration > 0 ? 0 : 0,
      duration: 3,
      sourceDuration: 0,
    })
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
  return (
    <div className="group relative flex flex-col items-center gap-1 rounded-lg border bg-card p-2 transition-colors hover:border-foreground/20">
      <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted/50">
        <StickerIcon id={sticker.id} />
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

function StickerIcon({ id }: { id: string }) {
  switch (id) {
    case "star":
      return <Star size={24} weight="fill" className="text-yellow-400" />
    case "heart":
      return <Heart size={24} weight="fill" className="text-red-400" />
    case "arrow-right":
      return <ArrowRight size={24} weight="bold" className="text-blue-400" />
    case "check-badge":
      return <SealCheck size={24} weight="fill" className="text-green-400" />
    default:
      return <Star size={24} className="text-muted-foreground" />
  }
}
