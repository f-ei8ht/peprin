import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { cn } from "@/lib/utils"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Roadmap",
  description: `What's coming next for ${BRAND_NAME}.`,
}

type Status = "complete" | "active" | "next" | "later"

const ITEMS: { title: string; description: string; status: Status }[] = [
  {
    title: "Foundations",
    description:
      "Design tokens, primitives, providers, and the marketing shell. Done.",
    status: "complete",
  },
  {
    title: "Projects and storage",
    description:
      "A projects dashboard with create, rename, duplicate, and delete. Backed by IndexedDB so everything stays local.",
    status: "active",
  },
  {
    title: "Editor shell and timeline",
    description:
      "Resizable panels, transport, scrubbing, multi-track timeline with drag, snap, ripple, split, and keyboard shortcuts.",
    status: "next",
  },
  {
    title: "Media, preview, and audio",
    description:
      "Drag-and-drop import, browser-native preview, audio waveforms, and basic mixing.",
    status: "next",
  },
  {
    title: "HeyGen avatars and voices",
    description:
      "AI-generated presenters, voiceover, and one-click translation, all routed through HeyGen and dropped on the timeline.",
    status: "later",
  },
  {
    title: "Export to MP4 and WebM",
    description:
      "Render directly from the browser. No queue, no upload, no watermark.",
    status: "later",
  },
]

const STATUS_LABEL: Record<Status, string> = {
  complete: "Done",
  active: "In progress",
  next: "Up next",
  later: "Planned",
}

const STATUS_STYLES: Record<Status, string> = {
  complete: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  active: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  next: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  later: "bg-foreground/10 text-foreground/70",
}

export default function RoadmapPage() {
  return (
    <BasePage
      title="Roadmap"
      description={`Where ${BRAND_NAME} is headed, and what's already shipped.`}
      maxWidth="4xl"
    >
      <ol className="flex flex-col gap-4">
        {ITEMS.map((item, i) => (
          <li key={item.title} className="bg-card flex flex-col gap-2 rounded-xl border p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground select-none text-sm font-medium">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUS_STYLES[item.status]
                )}
              >
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </BasePage>
  )
}
