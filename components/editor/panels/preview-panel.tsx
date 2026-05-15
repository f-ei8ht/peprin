"use client"

import * as React from "react"
import {
  ArrowsOut,
  Pause,
  Play,
  SkipBack,
  SkipForward,
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
import { usePlayback } from "@/hooks/use-playback"
import { useEditorStore } from "@/lib/editor/editor-store"
import { usePlaybackStore } from "@/lib/editor/playback-store"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { useMediaStore } from "@/lib/media/store"
import { getMediaBlob } from "@/lib/media/repo"
import { formatTimecode } from "@/lib/time"
import type { CompositorLayer } from "@/lib/renderer/compositor"

const ZOOM_PRESETS = [25, 50, 75, 100, 150, 200] as const

type ZoomMode = "fit" | number

export function PreviewPanel() {
  const project = useEditorStore((s) => s.project)

  // Hooks — called unconditionally before any early return
  const [zoomMode, setZoomMode] = React.useState<ZoomMode>("fit")
  const { playback, compositor } = usePlayback(project?.settings)
  const playing = usePlaybackStore((s) => s.playing)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const duration = usePlaybackStore((s) => s.duration)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const canvasMountRef = React.useRef<HTMLDivElement>(null)
  const viewport = useElementSize(viewportRef)
  const rafRef = React.useRef<number | null>(null)
  const scrubRef = React.useRef<{
    active: boolean
    pointerId: number | null
  }>({ active: false, pointerId: null })

  // Collect timeline layers for compositor
  const tracks = useTimelineStore((s) => s.tracks)
  const mediaAssets = useMediaStore((s) => s.assets)
  const blobUrlsRef = React.useRef<Map<string, string>>(new Map())

  const resolveBlobUrl = React.useCallback(async (mediaId: string): Promise<string | null> => {
    const cached = blobUrlsRef.current.get(mediaId)
    if (cached) return cached

    try {
      const blob = await getMediaBlob(mediaId)
      if (!blob) return null
      const url = URL.createObjectURL(blob)
      blobUrlsRef.current.set(mediaId, url)
      return url
    } catch {
      return null
    }
  }, [])

  const [videoBlobUrls, setVideoBlobUrls] = React.useState<Map<string, string>>(new Map())

  // Pre-resolve blob URLs for video assets
  React.useEffect(() => {
    const videoIds = new Set<string>()
    for (const track of tracks) {
      for (const el of track.elements) {
        if (el.type === "video") {
          videoIds.add(el.mediaId)
        }
      }
    }

    let cancelled = false
    ;(async () => {
      const urls = new Map<string, string>()
      for (const id of videoIds) {
        const url = await resolveBlobUrl(id)
        if (url) urls.set(id, url)
      }
      if (!cancelled) setVideoBlobUrls(urls)
    })()

    return () => {
      cancelled = true
    }
  }, [tracks, resolveBlobUrl])

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current.values()) {
        URL.revokeObjectURL(url)
      }
      blobUrlsRef.current.clear()
    }
  }, [])

  const buildLayers = React.useCallback((): CompositorLayer[] => {
    const layers: CompositorLayer[] = []
    for (const track of tracks) {
      for (const el of track.elements) {
        const asset = mediaAssets.find((a) => a.id === el.mediaId)
        layers.push({
          id: el.id,
          type: el.type,
          startTime: el.startTime,
          duration: el.duration,
          trimStart: el.trimStart,
          positionX: el.positionX,
          positionY: el.positionY,
          scaleX: el.scaleX,
          scaleY: el.scaleY,
          rotation: el.rotation,
          opacity: el.opacity,
          sourceUrl: asset?.thumbnailDataUrl,
          videoBlobUrl: el.type === "video" ? videoBlobUrls.get(el.mediaId) : undefined,
          name: el.name,
        })
      }
    }
    return layers
  }, [tracks, mediaAssets, videoBlobUrls])

  // Render loop — self-referencing via ref
  const renderFrame = React.useRef<() => void>(() => {})

  React.useLayoutEffect(() => {
    const pm = playback
    renderFrame.current = () => {
      const f = project?.settings.fps ?? 30
      compositor.setLayers(buildLayers())
      compositor.render(pm.currentTime, f)
      const mount = canvasMountRef.current
      if (mount) {
        const canvas = mount.firstChild as HTMLCanvasElement | null
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx)
            compositor.drawToContext(ctx, 0, 0, canvas.width, canvas.height)
        }
      }
      rafRef.current = requestAnimationFrame(renderFrame.current)
    }
  })

  React.useEffect(() => {
    rafRef.current = requestAnimationFrame(renderFrame.current)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Mount the output canvas
  React.useEffect(() => {
    const mount = canvasMountRef.current
    if (!mount || !project) return
    const cw = project.settings.canvasSize.width
    const ch = project.settings.canvasSize.height
    const canvas = document.createElement("canvas")
    canvas.width = cw
    canvas.height = ch
    canvas.style.display = "block"
    mount.innerHTML = ""
    mount.appendChild(canvas)
    compositor.invalidate()
  }, [project, compositor])

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if (e.code === "Space") {
        e.preventDefault()
        playback.toggle()
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        playback.frameBackward()
      } else if (e.code === "ArrowRight") {
        e.preventDefault()
        playback.frameForward()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [playback])

  if (!project) return null

  const { canvasSize } = project.settings
  const fitScale = computeFitScale(canvasSize, viewport)
  const scale = zoomMode === "fit" ? fitScale : zoomMode / 100
  const sceneWidth = canvasSize.width * scale
  const sceneHeight = canvasSize.height * scale
  const zoomPercent = Math.round(scale * 100)
  const isFit = zoomMode === "fit"
  const isMounted = viewport.width > 0 && viewport.height > 0

  const scrubFromEvent = (clientX: number) => {
    const mount = canvasMountRef.current
    if (!mount || duration <= 0) return
    const rect = mount.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    playback.seek(Math.max(0, Math.min(duration, ratio * duration)))
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="bg-background flex h-9 shrink-0 items-center justify-between border-b px-3">
        <span className="text-foreground/80 text-[11px] font-semibold uppercase tracking-wider">
          Preview
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </span>
      </div>

      {/* Viewport */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-zinc-950 p-2">
        <div
          ref={viewportRef}
          className="relative flex size-full min-h-0 min-w-0 items-center justify-center"
        >
          {isMounted ? (
            <div
              ref={canvasMountRef}
              className="relative overflow-hidden border border-white/10 shadow-2xl"
              style={{
                width: sceneWidth,
                height: sceneHeight,
                cursor: duration > 0 ? "ew-resize" : "default",
              }}
              onPointerDown={(e) => {
                e.preventDefault()
                ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                scrubRef.current = { active: true, pointerId: e.pointerId }
                playback.setScrubbing(true)
                scrubFromEvent(e.clientX)
              }}
              onPointerMove={(e) => {
                if (
                  !scrubRef.current.active ||
                  e.pointerId !== scrubRef.current.pointerId
                )
                  return
                scrubFromEvent(e.clientX)
              }}
              onPointerUp={(e) => {
                if (e.pointerId !== scrubRef.current.pointerId) return
                scrubRef.current = { active: false, pointerId: null }
                playback.setScrubbing(false)
              }}
              onPointerCancel={() => {
                scrubRef.current = { active: false, pointerId: null }
                playback.setScrubbing(false)
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-background grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-t px-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-muted-foreground/60 px-1 text-xs">/</span>
          <span className="text-muted-foreground/60 font-mono text-xs tabular-nums">
            {formatTimecode(duration)}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Jump to start"
                onClick={() => playback.jumpToStart()}
              >
                <SkipBack size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Jump to start</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => playback.toggle()}
          >
            {playing ? (
              <Pause size={14} weight="fill" />
            ) : (
              <Play size={14} weight="fill" />
            )}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Jump to end"
                onClick={() => playback.jumpToEnd()}
              >
                <SkipForward size={14} weight="bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Jump to end</TooltipContent>
          </Tooltip>
        </div>

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
  const FIT_MARGIN = 0.9
  return (
    Math.min(viewport.width / canvas.width, viewport.height / canvas.height) *
    FIT_MARGIN
  )
}
