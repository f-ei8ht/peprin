import Link from "next/link"
import { DiscordLogo, GithubLogo, XLogo } from "@phosphor-icons/react/dist/ssr"

import { Logo } from "@/components/site/logo"
import { BRAND_NAME } from "@/site/brand"
import { SOCIAL_LINKS } from "@/site/social"

type FooterColumn = {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Editor", href: "/editor" },
      { label: "Projects", href: "/projects" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      {
        label: "GitHub",
        href: SOCIAL_LINKS.github,
        external: true,
      },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="flex max-w-sm flex-col gap-4">
            <Logo />
            <p className="text-muted-foreground text-sm leading-relaxed">
              {BRAND_NAME} is a browser-native video editor supercharged by
              HeyGen. Edit your timeline, then drop in AI avatars, voices, and
              translations without leaving the page.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GithubLogo size={18} weight="bold" />
              </Link>
              <Link
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XLogo size={18} weight="bold" />
              </Link>
              <Link
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <DiscordLogo size={18} weight="bold" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <h3 className="text-foreground text-sm font-semibold">
                  {column.title}
                </h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="text-muted-foreground flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </span>
          <span>Built for editors who like to move fast.</span>
        </div>
      </div>
    </footer>
  )
}
