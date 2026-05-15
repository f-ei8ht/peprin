import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Roadmap",
  description: `What's next for ${BRAND_NAME}.`,
}

const PHASES = [
  {
    label: "Phase 1 — Core Editor (current)",
    items: [
      "Multi-track timeline with trimming, splitting, and ripple editing",
      "Real-time preview with compositor at native resolution",
      "Media import and library with drag-and-drop",
      "Text overlays, stickers, and subtitle tracks",
      "Effects: blur, color grade, sharpen, vignette, chroma key",
      "Masks: rectangle, ellipse, polygon, freeform path",
      "Undo/redo, clipboard, keyboard shortcuts",
      "Export: MP4, WebM, GIF, PNG sequence",
    ],
  },
  {
    label: "Phase 2 — AI Integration",
    items: [
      "HeyGen avatar generation on the timeline",
      "Voice synthesis and AI narration",
      "Automated translation and dubbing",
      "AI-driven clip generation from text prompts",
    ],
  },
  {
    label: "Phase 3 — Polish and Launch",
    items: [
      "End-to-end testing matrix across browsers",
      "Accessibility audit and screen reader support",
      "Performance budget enforcement (60fps at 1000+ clips)",
      "Public launch with marketing site and documentation",
    ],
  },
]

export default function RoadmapPage() {
  return (
    <BasePage
      title="Roadmap"
      description={`What's coming next for ${BRAND_NAME}.`}
    >
      <p className="text-foreground/85 leading-relaxed">
        This roadmap reflects our current priorities. Things move fast — check
        the changelog for what shipped and the blog for deeper context.
      </p>

      <div className="flex flex-col gap-8">
        {PHASES.map((phase) => (
          <div key={phase.label} className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {phase.label}
            </h2>
            <ul className="flex flex-col gap-2">
              {phase.items.map((item) => (
                <li
                  key={item}
                  className="text-foreground/85 flex items-start gap-2 text-sm leading-relaxed"
                >
                  <span className="text-muted-foreground mt-0.5 shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <Separator />
          </div>
        ))}
      </div>
    </BasePage>
  )
}
