"use client"

import {
  FilmStrip,
  MusicNote,
  TextAa,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr"

import { PanelShell } from "@/components/editor/panel-shell"
import { useEditorStore, type LeftTab } from "@/lib/editor/editor-store"
import { cn } from "@/lib/utils"

const TABS: { id: LeftTab; label: string; icon: React.ComponentType<{ size?: number; weight?: "bold" | "duotone" | "fill" | "regular" }> }[] = [
  { id: "media", label: "Media", icon: FilmStrip },
  { id: "audio", label: "Audio", icon: MusicNote },
  { id: "text", label: "Text", icon: TextAa },
  { id: "avatars", label: "Avatars", icon: UsersThree },
]

export function LeftPanel() {
  const tab = useEditorStore((s) => s.leftTab)
  const setTab = useEditorStore((s) => s.setLeftTab)

  return (
    <PanelShell hideHeader>
      <div className="flex h-full">
        <nav
          aria-label="Left panel sections"
          className="bg-background flex w-12 shrink-0 flex-col items-center gap-1 border-r py-2"
        >
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                title={t.label}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-md text-sm transition-colors",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Icon size={16} weight="duotone" />
                <span className="sr-only">{t.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
            <span className="text-foreground/80 text-xs font-medium uppercase tracking-wide">
              {TABS.find((t) => t.id === tab)?.label}
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-foreground text-sm font-medium">
              {TABS.find((t) => t.id === tab)?.label} coming soon
            </p>
            <p className="text-muted-foreground max-w-[24ch] text-xs leading-relaxed">
              This panel fills in over the next iterations.
            </p>
          </div>
        </div>
      </div>
    </PanelShell>
  )
}
