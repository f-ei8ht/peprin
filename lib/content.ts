// Content utilities — read and parse markdown files from the content/ directory.

import { readFileSync, readdirSync, existsSync } from "fs"
import { join } from "path"

export interface ContentMeta {
  slug: string
  title: string
  description: string
  date: string
  author?: string
  tags?: string[]
  draft?: boolean
}

export interface ContentEntry {
  meta: ContentMeta
  body: string
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const lines = raw.split("\n")
  const meta: Record<string, string> = {}
  let inFrontmatter = false
  let endLine = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (i === 0 && line === "---") {
      inFrontmatter = true
      continue
    }
    if (inFrontmatter && line === "---") {
      endLine = i
      break
    }
    if (inFrontmatter) {
      const colonIdx = line.indexOf(":")
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim()
        const value = line.substring(colonIdx + 1).trim()
        meta[key] = value
      }
    }
  }

  const body = endLine > 0 ? lines.slice(endLine + 1).join("\n").trim() : raw
  return { meta, body }
}

export function listContent(dir: string): ContentEntry[] {
  const fullPath = join(process.cwd(), "content", dir)

  if (!existsSync(fullPath)) return []

  const files = readdirSync(fullPath)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort()
    .reverse() // newest first

  const entries: ContentEntry[] = []

  for (const file of files) {
    const raw = readFileSync(join(fullPath, file), "utf-8")
    const { meta, body } = parseFrontmatter(raw)

    const slug = file.replace(/\.mdx?$/, "")
    entries.push({
      meta: {
        slug,
        title: meta.title || slug,
        description: meta.description || "",
        date: meta.date || "",
        author: meta.author,
        tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()) : undefined,
        draft: meta.draft === "true",
      },
      body,
    })
  }

  // Filter out draft posts in production
  return entries
}

export function getContentBySlug(dir: string, slug: string): ContentEntry | null {
  const fullPath = join(process.cwd(), "content", dir, `${slug}.md`)

  if (!existsSync(fullPath)) {
    // Try .mdx extension
    const mdxPath = join(process.cwd(), "content", dir, `${slug}.mdx`)
    if (!existsSync(mdxPath)) return null
    const raw = readFileSync(mdxPath, "utf-8")
    const { meta, body } = parseFrontmatter(raw)
    return {
      meta: { slug, title: meta.title || slug, description: meta.description || "", date: meta.date || "" },
      body,
    }
  }

  const raw = readFileSync(fullPath, "utf-8")
  const { meta, body } = parseFrontmatter(raw)

  return {
    meta: {
      slug,
      title: meta.title || slug,
      description: meta.description || "",
      date: meta.date || "",
      author: meta.author,
      tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()) : undefined,
    },
    body,
  }
}
