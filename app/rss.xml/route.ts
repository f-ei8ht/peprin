import { listContent } from "@/lib/content"
import { SITE_URL, BRAND_NAME, SITE_INFO } from "@/site/brand"

interface FeedItem {
  title: string
  description: string
  url: string
  date: Date
  author?: string
}

export async function GET() {
  const blogPosts = listContent("blog").filter((p) => !p.meta.draft)
  const changelogEntries = listContent("changelog").filter((e) => !e.meta.draft)

  const allItems: FeedItem[] = [
    ...blogPosts.map((p): FeedItem => ({
      title: p.meta.title,
      description: p.meta.description,
      url: `${SITE_URL}/blog/${p.meta.slug}`,
      date: new Date(p.meta.date),
      author: p.meta.author,
    })),
    ...changelogEntries.map((e): FeedItem => ({
      title: e.meta.title,
      description: e.meta.description,
      url: `${SITE_URL}/changelog#${e.meta.slug}`,
      date: new Date(e.meta.date),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  const items = allItems
    .map(
      (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.url}</link>
      <guid>${item.url}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      ${item.author ? `<author>${item.author}</author>` : ""}
    </item>`
    )
    .join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${BRAND_NAME}</title>
    <description>${SITE_INFO.description}</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
