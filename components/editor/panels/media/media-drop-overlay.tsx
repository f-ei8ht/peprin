"use client"

import { CloudArrowUp } from "@phosphor-icons/react/dist/ssr"

export function MediaDropOverlay() {
  return (
    <div
      aria-hidden="true"
      className="bg-foreground/[0.06] border-foreground/40 pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center backdrop-blur-sm"
    >
      <CloudArrowUp size={28} weight="duotone" />
      <p className="text-foreground text-sm font-medium">Drop to import</p>
      <p className="text-muted-foreground text-xs">
        Video, audio, or images
      </p>
    </div>
  )
}
