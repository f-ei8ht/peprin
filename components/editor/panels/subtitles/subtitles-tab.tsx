"use client"

import * as React from "react"
import { UploadSimple, DownloadSimple, Plus, Trash } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { parseSRT, serializeSRT, parseVTT, serializeVTT, type SubtitleEntry } from "@/lib/subtitles/parser"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { usePlaybackStore } from "@/lib/editor/playback-store"
import { formatTimecode } from "@/lib/time"
import { nanoid } from "nanoid"
import { cn } from "@/lib/utils"

export function SubtitlesTab() {
  const [entries, setEntries] = React.useState<SubtitleEntry[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [format, setFormat] = React.useState<"srt" | "vtt">("srt")
  const tracks = useTimelineStore((s) => s.tracks)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const addElement = useTimelineStore((s) => s.addElement)
  const updateElement = useTimelineStore((s) => s.updateElement)

  const handleImport = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".srt,.vtt"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        const parsed = file.name.endsWith(".vtt") ? parseVTT(content) : parseSRT(content)
        setEntries(parsed)
        syncToTimeline(parsed)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleExport = () => {
    const content = format === "srt" ? serializeSRT(entries) : serializeVTT(entries)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `subtitles.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const syncToTimeline = (subs: SubtitleEntry[]) => {
    let track = tracks.find((t) => t.type === "subtitle")
    if (!track) {
      track = {
        id: nanoid(8),
        type: "subtitle",
        name: "Subtitles",
        elements: [],
        muted: false,
        hidden: false,
      }
      useTimelineStore.getState().loadTracks([...tracks, track])
    }

    for (const entry of subs) {
      const existing = track!.elements.find((e) => e.id === entry.id)
      if (existing) {
        updateElement(entry.id, {
          textContent: entry.text,
          startTime: entry.startTime,
          duration: entry.endTime - entry.startTime,
        })
      } else {
        addElement({
          trackId: track!.id,
          type: "subtitle",
          name: entry.text.substring(0, 30),
          mediaId: "",
          startTime: entry.startTime,
          duration: entry.endTime - entry.startTime,
          sourceDuration: 0,
        })

        const state = useTimelineStore.getState()
        const t = state.tracks.find((tr) => tr.id === track!.id)
        if (t && t.elements.length > 0) {
          const lastEl = t.elements[t.elements.length - 1]
          updateElement(lastEl.id, {
            id: entry.id,
            textContent: entry.text,
          })
        }
      }
    }
  }

  const handleAddEntry = () => {
    const endTime = currentTime + 2
    const newEntry: SubtitleEntry = {
      id: nanoid(10),
      startTime: currentTime,
      endTime,
      text: "New subtitle",
    }
    setEntries([...entries, newEntry])
    syncToTimeline([...entries, newEntry])
  }

  const handleDeleteEntry = (id: string) => {
    const next = entries.filter((e) => e.id !== id)
    setEntries(next)
  }

  const handleUpdateEntry = (id: string, patch: Partial<SubtitleEntry>) => {
    const next = entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
    setEntries(next)
    syncToTimeline(next)
  }

  const activeEntry = entries.find(
    (e) => currentTime >= e.startTime && currentTime <= e.endTime
  )

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center gap-2 border-b p-3">
        <Button size="sm" variant="outline" onClick={handleImport}>
          <UploadSimple size={14} className="mr-1" />
          Import
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <DownloadSimple size={14} className="mr-1" />
          Export
        </Button>
        <Select value={format} onValueChange={(v) => setFormat(v as "srt" | "vtt")}>
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="srt">SRT</SelectItem>
            <SelectItem value="vtt">VTT</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={handleAddEntry}>
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      {activeEntry && (
        <div className="border-b p-3">
          <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
            Active ({formatTimecode(currentTime)})
          </p>
          <Textarea
            value={activeEntry.text}
            onChange={(e) => handleUpdateEntry(activeEntry.id, { text: e.target.value })}
            className="h-16 resize-none text-sm"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-auto">
        {entries.map((entry, i) => {
          const isActive = entry.id === activeEntry?.id
          return (
            <div
              key={entry.id}
              className={cn(
                "flex items-start gap-2 border-b px-3 py-2 text-xs",
                isActive && "bg-foreground/5"
              )}
            >
              <span className="text-muted-foreground mt-0.5 shrink-0 tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground font-mono text-[10px] tabular-nums">
                  {formatTimecode(entry.startTime)} → {formatTimecode(entry.endTime)}
                </div>
                <div className="text-foreground mt-0.5 break-words">{entry.text}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteEntry(entry.id)}
                className="text-muted-foreground shrink-0 hover:text-destructive"
              >
                <Trash size={12} />
              </button>
            </div>
          )
        })}

        {entries.length === 0 && (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div>
              <p className="text-foreground text-sm font-medium">No subtitles</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Import an SRT/VTT file or add subtitles manually.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
