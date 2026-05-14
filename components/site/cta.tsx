import Link from "next/link"
import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <div className="bg-card relative overflow-hidden rounded-2xl border p-8 md:p-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-amber-400/10"
        />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Ship your next video in a single tab.
            </h3>
            <p className="text-muted-foreground mt-2 text-base">
              Open a fresh project, drop in your clips, and let HeyGen fill in
              the avatar, narration, and translations.
            </p>
          </div>
          <Link href="/projects">
            <Button size="lg" className="h-11 px-5 text-base">
              Start a project
              <ArrowRight size={16} weight="bold" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
