"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { useEditorStore } from "@/lib/editor/editor-store"
import { pushCommand } from "@/lib/editor/history"
import { formatTimecode } from "@/lib/time"
import type { TimelineElement } from "@/lib/db/types"

interface NumberFieldProps {
  label: string
  value: number
  onChange: (val: number) => void
  step?: number
  min?: number
  max?: number
}

function NumberField({ label, value, onChange, step = 1, min, max }: NumberFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-[11px] uppercase tracking-wide flex-none w-20 truncate">
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        className="h-7 text-xs w-full tabular-nums text-right"
      />
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function InspectorPanel() {
  const tracks = useTimelineStore((s) => s.tracks)
  const selectedIds = useTimelineStore((s) => s.selectedElementIds)
  const snapshotTracks = useTimelineStore((s) => s.snapshotTracks)
  const updateElement = useTimelineStore((s) => s.updateElement)
  const setSelectedClips = useEditorStore((s) => s.setSelectedClips)

  // Collect selected elements
  const selected = React.useMemo(() => {
    const result: { element: TimelineElement; trackId: string }[] = []
    for (const tid of selectedIds) {
      for (const track of tracks) {
        const el = track.elements.find((e) => e.id === tid)
        if (el) {
          result.push({ element: el, trackId: track.id })
          break
        }
      }
    }
    return result
  }, [tracks, selectedIds])

  // Keep editor store selection in sync
  React.useEffect(() => {
    setSelectedClips(selectedIds)
  }, [selectedIds, setSelectedClips])

  if (selected.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-foreground text-sm font-medium">Nothing selected</p>
        <p className="text-xs">Pick a clip to see its properties.</p>
      </div>
    )
  }

  // Use the first selected element for editing (multi-select shows common params)
  const { element: el } = selected[0]

  const withHistory = (label: string, fn: () => void) => {
    const before = snapshotTracks()
    fn()
    const after = snapshotTracks()
    pushCommand(label, before, after)
  }

  const patchField = (patch: Partial<TimelineElement>, label: string) => {
    withHistory(label, () => {
      for (const { element } of selected) {
        updateElement(element.id, patch)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Clip info */}
      <section>
        <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Clip</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">Name</span>
            <span className="text-foreground/80 text-xs truncate max-w-[120px]">{el.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">Type</span>
            <span className="text-foreground/80 text-xs capitalize">{el.type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">Start</span>
            <span className="text-foreground/80 font-mono text-xs">
              {formatTimecode(el.startTime)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px]">Duration</span>
            <span className="text-foreground/80 font-mono text-xs">
              {formatTimecode(el.duration)}
            </span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Transform */}
      <section>
        <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Transform</h4>
        <div className="flex flex-col gap-2">
          <NumberField
            label="Position X"
            value={Math.round(el.positionX * 100) / 100}
            step={1}
            onChange={(v) => patchField({ positionX: v }, "Position X")}
          />
          <NumberField
            label="Position Y"
            value={Math.round(el.positionY * 100) / 100}
            step={1}
            onChange={(v) => patchField({ positionY: v }, "Position Y")}
          />
          <NumberField
            label="Scale X"
            value={Math.round(el.scaleX * 100) / 100}
            step={0.01}
            min={0.01}
            max={10}
            onChange={(v) =>
              patchField(
                { scaleX: clamp(v, 0.01, 10) },
                "Scale X"
              )
            }
          />
          <NumberField
            label="Scale Y"
            value={Math.round(el.scaleY * 100) / 100}
            step={0.01}
            min={0.01}
            max={10}
            onChange={(v) =>
              patchField(
                { scaleY: clamp(v, 0.01, 10) },
                "Scale Y"
              )
            }
          />
          <NumberField
            label="Rotation"
            value={Math.round(el.rotation * 100) / 100}
            step={1}
            min={-360}
            max={360}
            onChange={(v) =>
              patchField(
                { rotation: clamp(v, -360, 360) },
                "Rotation"
              )
            }
          />
          <NumberField
            label="Opacity"
            value={Math.round(el.opacity * 1000) / 1000}
            step={0.05}
            min={0}
            max={1}
            onChange={(v) =>
              patchField(
                { opacity: clamp(v, 0, 1) },
                "Opacity"
              )
            }
          />
        </div>
      </section>

      {/* Text properties */}
      {el.type === "text" && (
        <>
          <Separator />
          <section>
            <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Text</h4>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-[11px] uppercase">Content</Label>
                <Input
                  value={el.textContent ?? ""}
                  onChange={(e) =>
                    patchField({ textContent: e.target.value }, "Text content")
                  }
                  className="h-8 text-xs"
                />
              </div>
              <NumberField
                label="Font size"
                value={el.fontSize ?? 48}
                step={1}
                min={8}
                max={500}
                onChange={(v) =>
                  patchField(
                    { fontSize: clamp(v, 8, 500) },
                    "Font size"
                  )
                }
              />
            </div>
          </section>
        </>
      )}

      {/* Selected count */}
      {selected.length > 1 && (
        <>
          <Separator />
          <p className="text-muted-foreground text-xs text-center">
            {selected.length} clips selected — editing common properties
          </p>
        </>
      )}
    </div>
  )
}
