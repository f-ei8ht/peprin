import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import { notFound } from "next/navigation"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { listContent, getContentBySlug } from "@/lib/content"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = listContent("blog")
  return posts.map((p) => ({ slug: p.meta.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const entry = getContentBySlug("blog", slug)
  if (!entry) return { title: "Not Found" }
  return {
    title: entry.meta.title,
    description: entry.meta.description,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const entry = getContentBySlug("blog", slug)

  if (!entry) notFound()

  // Simple markdown-to-HTML rendering (works without any dependencies)
  const html = renderMarkdown(entry.body)

  return (
    <BasePage title={entry.meta.title} description={entry.meta.description}>
      <div className="flex items-center justify-between">
        <Link href="/blog">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} weight="bold" />
            All posts
          </Button>
        </Link>
        <p className="text-muted-foreground font-mono text-xs tabular-nums">
          {formatDate(entry.meta.date)}
          {entry.meta.author && ` · ${entry.meta.author}`}
        </p>
      </div>

      {entry.meta.tags && entry.meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.meta.tags.map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-[11px]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Separator />

      <div
        className="prose-custom flex flex-col gap-4 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-6 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-semibold mt-8 mb-3'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='bg-muted text-foreground rounded px-1 py-0.5 text-xs font-mono'>$1</code>")
    .replace(/\n\n/g, "</p><p class='text-foreground/85 leading-relaxed'>")
    .replace(/^- (.+)$/gm, "<li class='text-foreground/85 ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='text-foreground/85 ml-4 list-decimal'>$2</li>")
    .replace(/^---$/gm, "<hr class='my-6 border-t' />")
    .replace(/^>(.+)$/gm, "<blockquote class='border-muted text-muted-foreground border-l-2 pl-4 italic'>$1</blockquote>")
    .replace(/^\s*$/gm, "")
    .replace(/<\/p><p/g, "</p>\n<p")
}
