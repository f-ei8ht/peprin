"use client"

import * as React from "react"
import {
  ArrowsOut,
  Pause,
  Play,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useElementSize } from "@/hooks/use-element-size"
import { useEditorStore } from "@/lib/editor/editor-store"
import { formatTimecode } from "@/lib/time"

const ZOOM_PRESETS = [25, 50, 75, 100, 150, 200] as const

type ZoomMode = "fit" | number

export function PreviewPanel() {
  const project = useEditorStore((s) => s.project)
  const [playing, setPlaying] = React.useState(false)
  const [zoomMode, setZoomMode] = React.useState<ZoomMode>("fit")

  const viewportRef = React.useRef<HTMLDivElement>(null)
  const viewport = useElementSize(viewportRef)

  if (!project) return null

  const { canvasSize } = project.settings
  const fitScale = computeFitScale(canvasSize, viewport)
  const scale = zoomMode === "fit" ? fitScale : zoomMode / 100
  const sceneWidth = canvasSize.width * scale
  const sceneHeight = canvasSize.height * scale
  const zoomPercent = Math.round(scale * 100)
  const isFit = zoomMode === "fit"

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="bg-background flex h-9 shrink-0 items-center justify-between border-b px-3">
        <span className="text-foreground/80 text-[11px] font-semibold uppercase tracking-wider">
          Preview
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {formatTimecode(0)} / {formatTimecode(0)}
        </span>
      </div>

      {/* Viewport */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-zinc-950 p-3">
        <div
          ref={viewportRef}
          className="relative flex size-full min-h-0 min-w-0 items-center justify-center"
        >
          <PreviewStage
            project={project}
            sceneWidth={sceneWidth}
            sceneHeight={sceneHeight}
            visible={viewport.width > 0 && viewport.height > 0}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-background grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-t px-3">
        <div className="flex min-w-0 items-center text-muted-foreground font-mono text-xs tabular-nums">
          {formatTimecode(0)}
          <span className="px-2">/</span>
          {formatTimecode(0)}
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? (
            <Pause size={14} weight="fill" />
          ) : (
            <Play size={14} weight="fill" />
          )}
        </Button>

        <div className="flex items-center gap-2 justify-self-end">
          <Select
            value={isFit ? "fit" : String(zoomMode)}
            onValueChange={(value) => {
              if (value === "fit") setZoomMode("fit")
              else setZoomMode(Number(value))
            }}
          >
            <SelectTrigger
              className="h-7 w-[5.5rem] text-xs tabular-nums"
              aria-label="Zoom level"
            >
              <SelectValue>{isFit ? "Fit" : `${zoomPercent}%`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit">Fit</SelectItem>
              <SelectSeparator />
              {ZOOM_PRESETS.map((preset) => (
                <SelectItem key={preset} value={String(preset)}>
                  {preset}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-4" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fit to screen"
                onClick={() => setZoomMode("fit")}
                disabled={isFit}
              >
                <ArrowsOut size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to viewport</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function PreviewStage({
  project,
  sceneWidth,
  sceneHeight,
  visible,
}: {
  project: NonNullable<ReturnType<typeof useEditorStore.getState>["project"]>
  sceneWidth: number
  sceneHeight: number
  visible: boolean
}) {
  const bgColor =
    project.settings.background.type === "color"
      ? project.settings.background.color
      : "#000000"

  if (!visible || sceneWidth <= 0 || sceneHeight <= 0) return null

  return (
    <div
      role="img"
      aria-label="Project preview"
      className="relative overflow-hidden border border-white/10 shadow-2xl"
      style={{
        width: sceneWidth,
        height: sceneHeight,
        background: bgColor,
      }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs text-white/40">
            {project.settings.canvasSize.width} ×{" "}
            {project.settings.canvasSize.height} · {project.settings.fps} fps
          </span>
          <p className="text-sm font-medium text-white/70">
            Add media to see it here
          </p>
        </div>
      </div>
    </div>
  )
}

function computeFitScale(
  canvas: { width: number; height: number },
  viewport: { width: number; height: number }
): number {
  if (
    canvas.width <= 0 ||
    canvas.height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return 1
  }
  // Leave a clear margin around the canvas so it doesn't crowd the side
  // panels and toolbar.
  const FIT_MARGIN = 0.78
  return (
    Math.min(viewport.width / canvas.width, viewport.height / canvas.height) *
    FIT_MARGIN
  )
}
