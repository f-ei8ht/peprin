"use client"

import * as React from "react"
import { Pause, Play } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { useEditorStore } from "@/lib/editor/editor-store"
import { cn } from "@/lib/utils"
import { formatTimecode } from "@/lib/time"

export function PreviewPanel() {
  const project = useEditorStore((s) => s.project)
  const [playing, setPlaying] = React.useState(false)

  if (!project) return null

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
        <span className="text-foreground/80 text-xs font-medium uppercase tracking-wide">
          Preview
        </span>
        <span className="text-muted-foreground font-mono text-xs">
          {formatTimecode(0)} / {formatTimecode(0)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-zinc-950 p-4">
        <PreviewStage project={project} />
      </div>

      <div className="flex h-12 shrink-0 items-center justify-center gap-2 border-t bg-card px-3">
        <Button
          variant="outline"
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
      </div>
    </div>
  )
}

function PreviewStage({
  project,
}: {
  project: ReturnType<typeof useEditorStore.getState>["project"]
}) {
  if (!project) return null
  const { canvasSize, background } = project.settings
  const aspect = canvasSize.width / canvasSize.height
  const bgColor = background.type === "color" ? background.color : "#0b0b0b"

  return (
    <div
      role="img"
      aria-label="Project preview"
      className={cn(
        "relative max-h-full w-auto max-w-full overflow-hidden rounded-md border border-white/5 shadow-2xl"
      )}
      style={{
        aspectRatio: `${aspect}`,
        height: "min(100%, 100%)",
        width: aspect >= 1 ? "min(100%, 100%)" : undefined,
        background: bgColor,
      }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs text-white/40">
            {canvasSize.width} × {canvasSize.height} · {project.settings.fps} fps
          </span>
          <p className="text-sm font-medium text-white/70">
            Add media to see it here
          </p>
        </div>
      </div>
    </div>
  )
}
