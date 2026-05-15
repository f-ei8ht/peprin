"use client"

import * as React from "react"
import { Sliders, Wrench, Sparkle } from "@phosphor-icons/react/dist/ssr"

import { PanelShell } from "@/components/editor/panel-shell"
import { InspectorPanel } from "@/components/editor/panels/inspector-panel"
import { HeyGenJobsPanel } from "@/components/editor/panels/heygen-jobs/jobs-panel"
import { LipsyncDialog } from "@/components/editor/panels/lipsync/lipsync-dialog"
import { TranslationDialog } from "@/components/editor/panels/translate/translation-dialog"
import { useEditorStore, type RightTab } from "@/lib/editor/editor-store"
import { cn } from "@/lib/utils"

const TABS: { id: RightTab; label: string; icon: React.ComponentType<{ size?: number; weight?: "bold" | "duotone" | "fill" | "regular" }> }[] = [
  { id: "inspector", label: "Inspector", icon: Sliders },
  { id: "settings", label: "Project", icon: Wrench },
  { id: "heygen", label: "HeyGen", icon: Sparkle },
]

export function RightPanel() {
  const tab = useEditorStore((s) => s.rightTab)
  const setTab = useEditorStore((s) => s.setRightTab)
  const project = useEditorStore((s) => s.project)

  const [lipsyncVideo, setLipsyncVideo] = React.useState<{ url: string; name: string } | null>(null)
  const [translateVideo, setTranslateVideo] = React.useState<{ url: string; name: string } | null>(null)

  return (
    <PanelShell hideHeader>
      <div className="flex h-full flex-col">
        <div
          role="tablist"
          aria-label="Right panel sections"
          className="bg-background flex h-9 shrink-0 items-center gap-1 border-b px-2"
        >
          {TABS.map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Icon size={14} weight="duotone" />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4 text-sm">
          {tab === "inspector" ? (
            <InspectorPanel />
          ) : tab === "heygen" ? (
            <HeyGenJobsPanel
              onLipsyncClick={(url, name) => setLipsyncVideo({ url, name })}
              onTranslateClick={(url, name) => setTranslateVideo({ url, name })}
            />
          ) : (
            <ProjectInfo project={project} />
          )}
        </div>
      </div>

      {/* Lipsync dialog */}
      {lipsyncVideo && (
        <LipsyncDialog
          open={!!lipsyncVideo}
          onOpenChange={(open) => {
            if (!open) setLipsyncVideo(null)
          }}
          sourceVideoUrl={lipsyncVideo.url}
          sourceVideoName={lipsyncVideo.name}
        />
      )}

      {/* Translation dialog */}
      {translateVideo && (
        <TranslationDialog
          open={!!translateVideo}
          onOpenChange={(open) => {
            if (!open) setTranslateVideo(null)
          }}
          sourceVideoUrl={translateVideo.url}
          sourceVideoName={translateVideo.name}
        />
      )}
    </PanelShell>
  )
}

function ProjectInfo({
  project,
}: {
  project: ReturnType<typeof useEditorStore.getState>["project"]
}) {
  if (!project) return null
  const { canvasSize, canvasPreset, fps, background } = project.settings
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <Row label="Canvas" value={`${canvasSize.width}×${canvasSize.height}`} />
      <Row label="Preset" value={canvasPreset} />
      <Row label="Frame rate" value={`${fps} fps`} />
      <Row
        label="Background"
        value={background.type === "color" ? background.color : "Blur"}
      />
      <Row label="Project ID" value={project.id} mono />
    </dl>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className={cn("text-foreground text-xs", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  )
}
