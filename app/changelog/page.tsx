import type { Metadata } from "next"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { listContent } from "@/lib/content"

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every notable change to Peprin, organized by release date.",
}

export default function ChangelogPage() {
  const entries = listContent("changelog").filter((e) => !e.meta.draft)

  return (
    <BasePage
      title="Changelog"
      description="Every notable change to Peprin, organized by release date."
      maxWidth="4xl"
    >
      {entries.length === 0 ? (
        <p className="text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {entries.map((entry, i) => (
            <div key={entry.meta.slug} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  {entry.meta.title}
                </h2>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {formatDate(entry.meta.date)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {entry.meta.description}
              </p>
              <div
                className="prose-custom flex flex-col gap-2 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.body) }}
              />
              {i < entries.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </BasePage>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3 class='text-base font-semibold mt-4 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-semibold mt-5 mb-2'>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='bg-muted text-foreground rounded px-1 py-0.5 text-xs font-mono'>$1</code>")
    .replace(/\n\n/g, "</p><p class='text-foreground/85'>")
    .replace(/^- (.+)$/gm, "<li class='text-foreground/85 ml-4 list-disc'>$1</li>")
    .replace(/^---$/gm, "<hr class='my-4 border-t' />")
    .replace(/^\s*$/gm, "")
    .replace(/<\/p><p/g, "</p>\n<p")
}
