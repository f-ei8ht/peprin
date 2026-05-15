"use client"

import * as React from "react"
import { Eye, EyeSlash, Trash, CaretDown, CaretRight } from "@phosphor-icons/react/dist/ssr"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { useEditorStore } from "@/lib/editor/editor-store"
import { pushCommand } from "@/lib/editor/history"
import { formatTimecode } from "@/lib/time"
import { toggleEffect, updateEffectParam, type ClipEffect } from "@/lib/effects"
import { type ClipMask } from "@/lib/masks"
import { FONT_CATALOG } from "@/lib/text/types"
import type { TimelineElement } from "@/lib/db/types"
import { cn } from "@/lib/utils"

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
        value={Math.round(value * 1000) / 1000}
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

function cl(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

const WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"]
const ALIGNS: { value: CanvasTextAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

export function InspectorPanel() {
  const tracks = useTimelineStore((s) => s.tracks)
  const selectedIds = useTimelineStore((s) => s.selectedElementIds)
  const snapshotTracks = useTimelineStore((s) => s.snapshotTracks)
  const updateElement = useTimelineStore((s) => s.updateElement)
  const setSelectedClips = useEditorStore((s) => s.setSelectedClips)

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

  React.useEffect(() => {
    setSelectedClips(selectedIds)
  }, [selectedIds, setSelectedClips])

  if (selected.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center p-4">
        <p className="text-foreground text-sm font-medium">Nothing selected</p>
        <p className="text-xs">Pick a clip to see its properties.</p>
      </div>
    )
  }

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

  const effects = el.effects ?? []
  const masks = el.masks ?? []

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-3">
        {/* Clip info */}
        <section>
          <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Clip</h4>
          <div className="flex flex-col gap-1.5">
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
              <span className="text-foreground/80 font-mono text-xs">{formatTimecode(el.startTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Duration</span>
              <span className="text-foreground/80 font-mono text-xs">{formatTimecode(el.duration)}</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Transform */}
        <section>
          <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Transform</h4>
          <div className="flex flex-col gap-2">
            <NumberField label="Position X" value={Math.round(el.positionX * 100) / 100}
              onChange={(v) => patchField({ positionX: v }, "Position X")} />
            <NumberField label="Position Y" value={Math.round(el.positionY * 100) / 100}
              onChange={(v) => patchField({ positionY: v }, "Position Y")} />
            <NumberField label="Scale X" value={Math.round(el.scaleX * 100) / 100} step={0.01} min={0.01} max={10}
              onChange={(v) => patchField({ scaleX: cl(v, 0.01, 10) }, "Scale X")} />
            <NumberField label="Scale Y" value={Math.round(el.scaleY * 100) / 100} step={0.01} min={0.01} max={10}
              onChange={(v) => patchField({ scaleY: cl(v, 0.01, 10) }, "Scale Y")} />
            <NumberField label="Rotation" value={Math.round(el.rotation * 100) / 100} step={1} min={-360} max={360}
              onChange={(v) => patchField({ rotation: cl(v, -360, 360) }, "Rotation")} />
            <NumberField label="Opacity" value={Math.round(el.opacity * 1000) / 1000} step={0.05} min={0} max={1}
              onChange={(v) => patchField({ opacity: cl(v, 0, 1) }, "Opacity")} />
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
                    onChange={(e) => patchField({ textContent: e.target.value }, "Text content")}
                    className="h-8 text-xs"
                  />
                </div>

                <NumberField label="Font Size" value={el.fontSize ?? 48} step={1} min={8} max={500}
                  onChange={(v) => patchField({ fontSize: cl(v, 8, 500) }, "Font size")} />

                {/* Font family selector */}
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-[11px] uppercase">Font</Label>
                  <select
                    value={el.fontFamily ?? "sans-serif"}
                    onChange={(e) => patchField({ fontFamily: e.target.value }, "Font family")}
                    className="h-7 w-full rounded-md border bg-transparent px-2 text-xs"
                  >
                    {FONT_CATALOG.map((f) => (
                      <option key={f.family} value={f.family}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Font weight selector */}
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-[11px] uppercase">Weight</Label>
                  <select
                    value={el.fontWeight ?? "400"}
                    onChange={(e) => patchField({ fontWeight: e.target.value }, "Font weight")}
                    className="h-7 w-full rounded-md border bg-transparent px-2 text-xs"
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {/* Text alignment */}
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-[11px] uppercase">Alignment</Label>
                  <div className="flex gap-1">
                    {ALIGNS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => patchField({ textAlign: a.value }, "Text align")}
                        className={cn(
                          "flex-1 rounded-md border py-1 text-[10px] font-medium transition-colors",
                          (el.textAlign ?? "center") === a.value
                            ? "bg-foreground/10 border-foreground/20"
                            : "border-transparent text-muted-foreground hover:bg-foreground/5"
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font color */}
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-muted-foreground text-[11px] uppercase flex-none w-20 truncate">Color</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={el.fontColor ?? "#ffffff"}
                      onChange={(e) => patchField({ fontColor: e.target.value }, "Font color")}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <Input
                      value={el.fontColor ?? "#ffffff"}
                      onChange={(e) => patchField({ fontColor: e.target.value }, "Font color")}
                      className="h-7 text-xs flex-1 tabular-nums"
                    />
                  </div>
                </div>

                {/* Line height */}
                <NumberField label="Line H" value={el.lineHeight ?? 1.2} step={0.1} min={0.5} max={5}
                  onChange={(v) => patchField({ lineHeight: cl(v, 0.5, 5) }, "Line height")} />

                {/* Letter spacing */}
                <NumberField label="Spacing" value={el.letterSpacing ?? 0} step={0.5} min={-10} max={50}
                  onChange={(v) => patchField({ letterSpacing: cl(v, -10, 50) }, "Letter spacing")} />

                <Separator />

                {/* Stroke */}
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-[10px] font-medium uppercase">Stroke</p>
                  <NumberField label="Width" value={el.textStrokeWidth ?? 0} step={0.5} min={0} max={20}
                    onChange={(v) => patchField({ textStrokeWidth: cl(v, 0, 20) }, "Stroke width")} />
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-muted-foreground text-[11px] uppercase flex-none w-20 truncate">Color</Label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={el.textStrokeColor ?? "#000000"}
                        onChange={(e) => patchField({ textStrokeColor: e.target.value }, "Stroke color")}
                        className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <Input
                        value={el.textStrokeColor ?? "#000000"}
                        onChange={(e) => patchField({ textStrokeColor: e.target.value }, "Stroke color")}
                        className="h-7 text-xs flex-1 tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Shadow */}
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-[10px] font-medium uppercase">Shadow</p>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-muted-foreground text-[11px] uppercase flex-none w-20 truncate">Color</Label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        value={el.textShadowColor ?? "rgba(0,0,0,0.5)"}
                        onChange={(e) => patchField({ textShadowColor: e.target.value }, "Shadow color")}
                        className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <Input
                        value={el.textShadowColor ?? "rgba(0,0,0,0.5)"}
                        onChange={(e) => patchField({ textShadowColor: e.target.value }, "Shadow color")}
                        className="h-7 text-xs flex-1 tabular-nums"
                      />
                    </div>
                  </div>
                  <NumberField label="Blur" value={el.textShadowBlur ?? 4} step={1} min={0} max={100}
                    onChange={(v) => patchField({ textShadowBlur: cl(v, 0, 100) }, "Shadow blur")} />
                </div>

                <Separator />

                {/* Background */}
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-muted-foreground text-[11px] uppercase flex-none w-20 truncate">BG Color</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={el.textBackgroundColor ?? "transparent"}
                      onChange={(e) => patchField({ textBackgroundColor: e.target.value === "transparent" ? "" : e.target.value }, "BG color")}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <Input
                      value={el.textBackgroundColor ?? ""}
                      placeholder="e.g. rgba(0,0,0,0.5)"
                      onChange={(e) => patchField({ textBackgroundColor: e.target.value || undefined }, "BG color")}
                      className="h-7 text-xs flex-1 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Effects */}
        <Separator />
        <section>
          <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Effects ({effects.length})</h4>
          {effects.length === 0 ? (
            <p className="text-muted-foreground text-[11px]">Add effects from the Effects panel.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {effects.map((effect) => (
                <EffectEditor
                  key={effect.id}
                  effect={effect}
                  onChange={(updated) => {
                    const next = effects.map((e) => (e.id === updated.id ? updated : e))
                    withHistory("Edit effect", () => updateElement(el.id, { effects: next }))
                  }}
                  onRemove={() => {
                    const next = effects.filter((e) => e.id !== effect.id)
                    withHistory("Remove effect", () => updateElement(el.id, { effects: next }))
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Masks */}
        <Separator />
        <section>
          <h4 className="text-foreground/90 mb-2 text-xs font-semibold">Masks ({masks.length})</h4>
          {masks.length === 0 ? (
            <p className="text-muted-foreground text-[11px]">Add masks from the Masks panel.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {masks.map((mask) => (
                <MaskEditor
                  key={mask.id}
                  mask={mask}
                  onChange={(updated) => {
                    const next = masks.map((m) => (m.id === updated.id ? updated : m))
                    withHistory("Edit mask", () => updateElement(el.id, { masks: next }))
                  }}
                  onRemove={() => {
                    const next = masks.filter((m) => m.id !== mask.id)
                    withHistory("Remove mask", () => updateElement(el.id, { masks: next }))
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Multiple selection notice */}
        {selected.length > 1 && (
          <>
            <Separator />
            <p className="text-muted-foreground text-xs text-center">
              {selected.length} clips selected — editing common properties
            </p>
          </>
        )}
      </div>
    </ScrollArea>
  )
}

function EffectEditor({
  effect,
  onChange,
  onRemove,
}: {
  effect: ClipEffect
  onChange: (e: ClipEffect) => void
  onRemove: () => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="rounded-lg border bg-muted/30">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground"
        >
          {open ? <CaretDown size={10} /> : <CaretRight size={10} />}
        </button>
        <span className="text-foreground flex-1 text-[11px] font-medium">{effect.name}</span>
        <button
          type="button"
          onClick={() => onChange(toggleEffect(effect))}
          className="text-muted-foreground hover:text-foreground"
          title={effect.enabled ? "Disable" : "Enable"}
        >
          {effect.enabled ? <Eye size={12} /> : <EyeSlash size={12} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
          title="Remove"
        >
          <Trash size={12} />
        </button>
      </div>
      {open && (
        <div className="border-t px-2 py-2">
          {effect.params.map((param) => (
            <div key={param.id} className="flex flex-col gap-1 mb-2 last:mb-0">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px]">{param.name}</span>
                <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                  {param.value}{param.unit ?? ""}
                </span>
              </div>
              <Slider
                value={[param.value]}
                min={param.min}
                max={param.max}
                step={param.step}
                onValueChange={([v]) => {
                  const updated = updateEffectParam(effect, param.id, v)
                  onChange(updated)
                }}
                className="h-3"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MaskEditor({
  mask,
  onChange,
  onRemove,
}: {
  mask: ClipMask
  onChange: (m: ClipMask) => void
  onRemove: () => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="rounded-lg border bg-muted/30">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground"
        >
          {open ? <CaretDown size={10} /> : <CaretRight size={10} />}
        </button>
        <span className="text-foreground flex-1 text-[11px] font-medium capitalize">{mask.type}</span>
        <button
          type="button"
          onClick={() => onChange({ ...mask, enabled: !mask.enabled })}
          className="text-muted-foreground hover:text-foreground"
          title={mask.enabled ? "Disable" : "Enable"}
        >
          {mask.enabled ? <Eye size={12} /> : <EyeSlash size={12} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
          title="Remove"
        >
          <Trash size={12} />
        </button>
      </div>
      {open && (
        <div className="border-t px-2 py-2 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px]">Feather</span>
              <span className="text-muted-foreground font-mono text-[10px] tabular-nums">{mask.feather}px</span>
            </div>
            <Slider
              value={[mask.feather]}
              min={0}
              max={60}
              step={1}
              onValueChange={([v]) => onChange({ ...mask, feather: v })}
              className="h-3"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...mask, inverted: !mask.inverted })}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                mask.inverted
                  ? "bg-foreground/10 border-foreground/20"
                  : "text-muted-foreground"
              )}
            >
              Inverted
            </button>
          </div>
          <NumberFieldInline
            label="Opacity"
            value={mask.opacity}
            step={0.05}
            min={0}
            max={1}
            onChange={(v) => onChange({ ...mask, opacity: cl(v, 0, 1) })}
          />
        </div>
      )}
    </div>
  )
}

function NumberFieldInline({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: NumberFieldProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-[10px] uppercase flex-none w-14 truncate">{label}</Label>
      <Input
        type="number"
        value={Math.round(value * 1000) / 1000}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        className="h-6 text-[10px] w-full tabular-nums text-right"
      />
    </div>
  )
}
