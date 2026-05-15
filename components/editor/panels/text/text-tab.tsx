"use client"

import * as React from "react"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { TEXT_PRESETS, FONT_CATALOG, type TextPreset } from "@/lib/text/types"
import { cn } from "@/lib/utils"
import { nanoid } from "nanoid"

export function TextTab() {
  const [customText, setCustomText] = React.useState("")
  const addElement = useTimelineStore((s) => s.addElement)
  const tracks = useTimelineStore((s) => s.tracks)
  const duration = useTimelineStore((s) => s.duration)

  const handleAddPreset = (preset: TextPreset) => {
    let track = tracks.find((t) => t.type === "text")
    if (!track) {
      track = {
        id: nanoid(8),
        type: "text",
        name: "Text",
        elements: [],
        muted: false,
        hidden: false,
      }
      useTimelineStore.getState().loadTracks([...tracks, track])
    }

    addElement({
      trackId: track.id,
      type: "text",
      name: preset.name,
      mediaId: "",
      startTime: duration > 0 ? 0 : 0,
      duration: 3,
      sourceDuration: 0,
    })

    const newElement = {
      textContent: preset.name,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      fontColor: preset.fontColor,
      fontWeight: preset.fontWeight,
      textAlign: preset.textAlign,
      textStrokeColor: preset.textStrokeColor,
      textStrokeWidth: preset.textStrokeWidth,
      textShadowColor: preset.textShadowColor,
      textShadowBlur: preset.textShadowBlur,
      textBackgroundColor: preset.textBackgroundColor,
    }

    const state = useTimelineStore.getState()
    const newTrack = state.tracks.find((t) => t.id === track!.id)
    if (newTrack && newTrack.elements.length > 0) {
      const lastEl = newTrack.elements[newTrack.elements.length - 1]
      useTimelineStore.getState().updateElement(lastEl.id, newElement)
    }
  }

  const handleAddCustomText = () => {
    if (!customText.trim()) return

    let track = tracks.find((t) => t.type === "text")
    if (!track) {
      track = {
        id: nanoid(8),
        type: "text",
        name: "Text",
        elements: [],
        muted: false,
        hidden: false,
      }
      useTimelineStore.getState().loadTracks([...tracks, track])
    }

    addElement({
      trackId: track.id,
      type: "text",
      name: customText,
      mediaId: "",
      startTime: duration > 0 ? 0 : 0,
      duration: 3,
      sourceDuration: 0,
    })

    const state = useTimelineStore.getState()
    const newTrack = state.tracks.find((t) => t.id === track!.id)
    if (newTrack && newTrack.elements.length > 0) {
      const lastEl = newTrack.elements[newTrack.elements.length - 1]
      useTimelineStore.getState().updateElement(lastEl.id, {
        textContent: customText,
        fontFamily: FONT_CATALOG[0].family,
        fontSize: 48,
        fontColor: "#ffffff",
        fontWeight: "700",
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowBlur: 4,
      })
    }

    setCustomText("")
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Type text..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCustomText()
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleAddCustomText} disabled={!customText.trim()}>
            <Plus size={14} className="mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="p-3">
        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
          Presets
        </p>
        <div className="flex flex-col gap-2">
          {TEXT_PRESETS.map((preset) => (
            <PresetCard key={preset.id} preset={preset} onAdd={handleAddPreset} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PresetCard({
  preset,
  onAdd,
}: {
  preset: TextPreset
  onAdd: (preset: TextPreset) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(preset)}
      className="group flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-foreground/20"
    >
      <div
        className="flex min-h-[2.5rem] flex-1 items-center justify-center rounded-md bg-muted/50 px-2"
        style={{
          fontFamily: preset.fontFamily,
          fontSize: Math.min(preset.fontSize * 0.4, 20),
          fontWeight: preset.fontWeight,
          color: preset.fontColor,
        }}
      >
        {preset.name}
      </div>
      <span className={cn("text-muted-foreground text-[10px] capitalize", "shrink-0")}>
        {preset.category}
      </span>
    </button>
  )
}
