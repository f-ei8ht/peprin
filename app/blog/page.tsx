import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { BasePage } from "@/components/site/base-page"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { listContent } from "@/lib/content"
import { BRAND_NAME } from "@/site/brand"

export const metadata: Metadata = {
  title: "Blog",
  description: `Updates, engineering notes, and product announcements from the ${BRAND_NAME} team.`,
}

export default function BlogPage() {
  const posts = listContent("blog").filter((p) => !p.meta.draft)

  return (
    <BasePage
      title="Blog"
      description={`Updates, engineering notes, and product announcements from the ${BRAND_NAME} team.`}
      maxWidth="4xl"
    >
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet. Check back soon.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post, i) => (
            <div key={post.meta.slug} className="flex flex-col gap-2">
              <p className="text-muted-foreground font-mono text-xs tabular-nums">
                {formatDate(post.meta.date)}
              </p>
              <h2 className="text-xl font-semibold tracking-tight">
                <Link
                  href={`/blog/${post.meta.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {post.meta.title}
                </Link>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {post.meta.description}
              </p>
              <div className="flex items-center gap-3">
                {post.meta.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
                <Link href={`/blog/${post.meta.slug}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    Read more
                    <ArrowRight size={12} weight="bold" />
                  </Button>
                </Link>
              </div>
              {i < posts.length - 1 && <Separator className="mt-4" />}
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
