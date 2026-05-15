"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, GithubLogo, List, X } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { SOCIAL_LINKS } from "@/site/social"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Editor", href: "/editor" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        "bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex"
          >
            <Button variant="ghost" size="icon" aria-label="GitHub">
              <GithubLogo size={18} weight="bold" />
            </Button>
          </Link>
          <ThemeToggle className="hidden md:inline-flex" />
          <Link href="/projects" className="hidden md:inline-flex">
            <Button size="sm">
              Open editor
              <ArrowRight size={14} weight="bold" />
            </Button>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <List size={20} weight="bold" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Logo />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} weight="bold" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-foreground rounded-md px-2 py-3 text-2xl font-semibold tracking-tight"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-3 border-t p-4">
            <Link
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <GithubLogo size={16} weight="bold" />
                GitHub
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/projects" onClick={() => setMobileOpen(false)}>
                <Button size="sm">
                  Open editor
                  <ArrowRight size={14} weight="bold" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
