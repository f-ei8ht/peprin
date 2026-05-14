"use client"

import { Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { PanelShell } from "@/components/editor/panel-shell"

const TRACKS = ["Video 1", "Voice", "Audio"]

export function TimelinePanel() {
  return (
    <PanelShell
      title="Timeline"
      trailing={
        <Button variant="ghost" size="icon-sm" disabled aria-label="Add track">
          <Plus size={14} weight="bold" />
        </Button>
      }
    >
      <div className="flex h-full flex-col">
        {/* Ruler */}
        <div className="bg-background relative h-8 shrink-0 border-b">
          <div className="absolute inset-0 flex items-end gap-12 px-3 pb-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="text-muted-foreground font-mono text-[10px]"
              >
                {String(i * 4).padStart(2, "0")}s
              </span>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div className="bg-card flex min-h-0 flex-1 flex-col">
          {TRACKS.map((name) => (
            <div
              key={name}
              className="flex h-12 shrink-0 items-stretch border-b last:border-b-0"
            >
              <div className="bg-background flex w-32 shrink-0 items-center border-r px-3 text-xs font-medium">
                {name}
              </div>
              <div className="bg-foreground/[0.02] relative flex flex-1 items-center px-3">
                <span className="text-muted-foreground text-xs italic">
                  Drop clips here
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  )
}
