"use client"

import Link from "next/link"
import {
  ArrowRight,
  Lightning,
  PlayCircle,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { HeroHandles } from "@/components/site/hero-handles"
import { HERO_HEADLINE, HERO_PILL, HERO_SUBLINE } from "@/site/brand"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="bg-foreground/[0.03] absolute inset-0" />
        <div className="absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-amber-400/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 pb-16 pt-20 text-center sm:px-6 md:pt-28">
        <Link
          href="/editor"
          className="border-foreground/15 hover:border-foreground/30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        >
          <Sparkle size={12} weight="fill" className="text-amber-500" />
          {HERO_PILL}
          <ArrowRight size={12} weight="bold" />
        </Link>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
          <span className="block">{HERO_HEADLINE[0]}</span>
          <HeroHandles className="mt-2">{HERO_HEADLINE[1]}</HeroHandles>
        </h1>

        <p className="text-muted-foreground max-w-2xl text-pretty text-base leading-relaxed sm:text-lg">
          {HERO_SUBLINE}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/projects">
            <Button size="lg" className="h-11 px-5 text-base">
              <Lightning size={16} weight="fill" />
              Start a project
              <ArrowRight size={16} weight="bold" />
            </Button>
          </Link>
          <Link href="/editor">
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-5 text-base"
            >
              <PlayCircle size={18} weight="duotone" />
              Open the editor
            </Button>
          </Link>
        </div>

        {/* Mock preview frame */}
        <HeroPreview />
      </div>
    </section>
  )
}

function HeroPreview() {
  return (
    <div className="relative mt-8 w-full max-w-4xl">
      <div className="bg-card relative aspect-[16/9] overflow-hidden rounded-xl border shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute inset-x-0 top-0 flex h-9 items-center gap-2 border-b border-white/5 px-3">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs font-medium text-white/60">
            untitled-project.peprin
          </span>
        </div>

        {/* Faux preview canvas */}
        <div className="absolute inset-0 top-9 grid grid-cols-[1fr_240px]">
          <div className="relative">
            <div className="absolute inset-6 rounded-md border border-white/10 bg-gradient-to-br from-violet-600/40 via-fuchsia-500/30 to-amber-300/20" />
            <div className="absolute bottom-10 left-10 right-1/3 rounded-md border border-white/10 bg-black/30 p-3 backdrop-blur">
              <div className="text-xs text-white/70">AI narration · HeyGen</div>
              <div className="mt-1 h-2 w-3/4 rounded-full bg-white/30" />
              <div className="mt-1 h-2 w-1/2 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="border-l border-white/5 p-3 text-xs text-white/60">
            <div className="mb-2 font-medium text-white/70">Tracks</div>
            <PreviewTrack tone="from-violet-500/60 to-fuchsia-500/60" w="80%" />
            <PreviewTrack tone="from-amber-400/60 to-rose-400/60" w="55%" />
            <PreviewTrack tone="from-emerald-400/60 to-cyan-400/60" w="65%" />
            <PreviewTrack tone="from-sky-500/60 to-violet-500/60" w="40%" />
          </div>
        </div>

        {/* Faux timeline */}
        <div className="absolute inset-x-0 bottom-0 h-16 border-t border-white/5 bg-black/50 px-3 pt-2">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span>00:00</span>
            <span>00:08</span>
            <span>00:16</span>
            <span>00:24</span>
          </div>
          <div className="mt-2 grid gap-1">
            <PreviewTrack tone="from-violet-500/60 to-fuchsia-500/60" w="78%" />
            <PreviewTrack tone="from-amber-400/60 to-rose-400/60" w="45%" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewTrack({ tone, w }: { tone: string; w: string }) {
  return (
    <div className="mb-1.5 h-2 w-full rounded-full bg-white/5">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${tone}`}
        style={{ width: w }}
      />
    </div>
  )
}
