"use client"

import * as React from "react"
import { Export as ExportIcon, X, Download, Warning } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useEditorStore } from "@/lib/editor/editor-store"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { useMediaStore } from "@/lib/media/store"
import { getMediaBlob } from "@/lib/media/repo"
import { ExportController } from "@/lib/export/exporter"
import type { ExportSettings, ExportFormat, ExportProgress } from "@/lib/export/types"
import { EXPORT_FORMAT_LABELS, EXPORT_FORMAT_EXTENSIONS } from "@/lib/export/types"
import { formatTimecode } from "@/lib/time"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RESOLUTION_PRESETS = [
  { label: "Match project", value: "project" },
  { label: "4K (3840×2160)", value: "2160p" },
  { label: "1080p (1920×1080)", value: "1080p" },
  { label: "720p (1280×720)", value: "720p" },
  { label: "480p (854×480)", value: "480p" },
  { label: "Custom", value: "custom" },
] as const

type ResolutionPreset = (typeof RESOLUTION_PRESETS)[number]["value"]

const FPS_OPTIONS = [24, 25, 30, 50, 60] as const

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const project = useEditorStore((s) => s.project)
  const tracks = useTimelineStore((s) => s.tracks)
  const mediaAssets = useMediaStore((s) => s.assets)

  const [format, setFormat] = React.useState<ExportFormat>("mp4")
  const [resolutionPreset, setResolutionPreset] = React.useState<ResolutionPreset>("project")
  const [customW, setCustomW] = React.useState(1920)
  const [customH, setCustomH] = React.useState(1080)
  const [fps, setFps] = React.useState(30)
  const [quality, setQuality] = React.useState<"low" | "medium" | "high">("high")
  const [includeAudio, setIncludeAudio] = React.useState(true)
  const [bitrate, setBitrate] = React.useState(12_000_000)

  const [exporting, setExporting] = React.useState(false)
  const [progress, setProgress] = React.useState<ExportProgress | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const controllerRef = React.useRef<ExportController | null>(null)

  const isVideoFormat = format === "mp4" || format === "webm"

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open && project) {
      setFormat("mp4")
      setResolutionPreset("project")
      setFps(project.settings.fps)
      setQuality("high")
      setIncludeAudio(true)
      setExporting(false)
      setProgress(null)
      setError(null)
    }
  }, [open, project])

  // Compute effective resolution
  const effectiveResolution = React.useMemo(() => {
    if (resolutionPreset === "project" && project) {
      return { width: project.settings.canvasSize.width, height: project.settings.canvasSize.height }
    }
    if (resolutionPreset === "custom") {
      return { width: customW, height: customH }
    }
    switch (resolutionPreset) {
      case "2160p": return { width: 3840, height: 2160 }
      case "1080p": return { width: 1920, height: 1080 }
      case "720p": return { width: 1280, height: 720 }
      case "480p": return { width: 854, height: 480 }
      default: return { width: 1920, height: 1080 }
    }
  }, [resolutionPreset, project, customW, customH])

  const hasAudioTracks = tracks.some((t) => t.type === "audio" && t.elements.length > 0)

  const startExport = async () => {
    if (!project) return
    setExporting(true)
    setProgress(null)
    setError(null)

    const settings: ExportSettings = {
      format,
      width: effectiveResolution.width,
      height: effectiveResolution.height,
      fps,
      videoBitrate: bitrate,
      includeAudio: includeAudio && hasAudioTracks,
      quality,
    }

    const controller = new ExportController()
    controllerRef.current = controller

    try {
      const blob = await controller.export(
        settings,
        {
          tracks,
          mediaAssets,
          projectSettings: project.settings,
          getMediaBlob,
        },
        (p) => setProgress(p),
      )

      // Trigger download
      const ext = EXPORT_FORMAT_EXTENSIONS[format]
      const filename = `${project.name.replace(/[^a-z0-9]/gi, "_")}${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setProgress((prev) => prev ? { ...prev, phase: "cancelled" } : null)
      } else {
        setError((e as Error).message)
        setProgress((prev) => prev ? { ...prev, phase: "error", error: (e as Error).message } : null)
      }
    } finally {
      setExporting(false)
    }
  }

  const cancelExport = () => {
    controllerRef.current?.cancel()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
          <div>
            <DialogTitle className="text-lg">Export</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-0.5 text-sm">
              Render your composition to a file
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-4">
          {!exporting && !progress?.phase.includes("done") ? (
            <>
              {/* Format */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPORT_FORMAT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Resolution</Label>
                <Select value={resolutionPreset} onValueChange={(v) => setResolutionPreset(v as ResolutionPreset)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {resolutionPreset === "custom" && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={customW}
                      onChange={(e) => setCustomW(Number(e.target.value))}
                      className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs tabular-nums"
                      placeholder="Width"
                    />
                    <span className="text-muted-foreground text-xs">×</span>
                    <input
                      type="number"
                      value={customH}
                      onChange={(e) => setCustomH(Number(e.target.value))}
                      className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs tabular-nums"
                      placeholder="Height"
                    />
                  </div>
                )}
                <p className="text-muted-foreground text-[11px]">
                  {effectiveResolution.width} × {effectiveResolution.height}
                </p>
              </div>

              {/* FPS */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Frame rate</Label>
                <Select value={String(fps)} onValueChange={(v) => setFps(Number(v) as typeof fps)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FPS_OPTIONS.map((f) => (
                      <SelectItem key={f} value={String(f)}>
                        {f} fps
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Quality</Label>
                  <span className="text-muted-foreground text-[11px] capitalize">{quality}</span>
                </div>
                <Slider
                  value={[quality === "low" ? 0 : quality === "medium" ? 50 : 100]}
                  onValueChange={([v]) => {
                    if (v <= 33) setQuality("low")
                    else if (v <= 66) setQuality("medium")
                    else setQuality("high")
                  }}
                  min={0}
                  max={100}
                  step={33.33}
                  className="w-full"
                />
                <p className="text-muted-foreground text-[11px]">
                  ~{(bitrate / 1_000_000).toFixed(1)} Mbps
                </p>
              </div>

              {/* Bitrate */}
              {isVideoFormat && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Video bitrate</Label>
                    <span className="text-muted-foreground text-[11px] tabular-nums">
                      {(bitrate / 1_000_000).toFixed(1)} Mbps
                    </span>
                  </div>
                  <Slider
                    value={[bitrate]}
                    onValueChange={([v]) => setBitrate(v)}
                    min={500_000}
                    max={50_000_000}
                    step={500_000}
                    className="w-full"
                  />
                </div>
              )}

              {/* Audio toggle */}
              {isVideoFormat && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium">Include audio</Label>
                    <p className="text-muted-foreground text-[11px]">
                      {hasAudioTracks ? "Audio tracks detected" : "No audio tracks in timeline"}
                    </p>
                  </div>
                  <Switch
                    checked={includeAudio && hasAudioTracks}
                    onCheckedChange={setIncludeAudio}
                    disabled={!hasAudioTracks}
                  />
                </div>
              )}
            </>
          ) : (
            /* Progress view */
            <div className="flex flex-col items-center gap-4 py-4">
              {progress && (
                <>
                  <div className="text-center">
                    <p className="text-foreground text-sm font-semibold">
                      {progress.phase === "preparing" && "Preparing…"}
                      {progress.phase === "encoding" && "Encoding…"}
                      {progress.phase === "finalizing" && "Finalizing…"}
                      {progress.phase === "done" && "Export complete!"}
                      {progress.phase === "cancelled" && "Export cancelled"}
                      {progress.phase === "error" && "Export failed"}
                    </p>
                    {progress.phase === "encoding" && (
                      <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                        {progress.framesRendered} / {progress.framesTotal} frames
                        {progress.estimatedRemainingMs != null &&
                          ` · ${formatTimecode(progress.estimatedRemainingMs / 1000)} remaining`}
                      </p>
                    )}
                  </div>

                  {/* Progress bar */}
                  {progress.phase !== "done" && progress.phase !== "error" && progress.phase !== "cancelled" && (
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${progress.framesTotal > 0 ? (progress.framesRendered / progress.framesTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  )}

                  {progress.phase === "error" && (
                    <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-md border p-3 text-sm">
                      <Warning size={16} className="text-destructive mt-0.5 shrink-0" />
                      <p className="text-destructive/90 text-xs">{progress.error || error}</p>
                    </div>
                  )}

                  {progress.phase === "done" && (
                    <Download size={32} weight="bold" className="text-primary" />
                  )}
                </>
              )}

              {!progress && (
                <p className="text-muted-foreground text-sm">Starting export…</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/30 flex items-center justify-between gap-2 rounded-b-[inherit] border-t px-6 py-3">
          {exporting && progress?.phase !== "done" && progress?.phase !== "error" && progress?.phase !== "cancelled" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={cancelExport}
              className="w-full"
            >
              <X size={14} weight="bold" />
              Cancel export
            </Button>
          ) : progress?.phase === "done" || progress?.phase === "cancelled" || progress?.phase === "error" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={startExport}
                disabled={!project}
              >
                <ExportIcon size={14} weight="bold" />
                Export {format === "mp4" ? "MP4" : format === "webm" ? "WebM" : format.toUpperCase()}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
