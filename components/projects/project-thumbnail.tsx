"use client"

import Image from "next/image"
import { FilmSlate } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"
import type { ProjectRecord } from "@/lib/db/types"

interface ProjectThumbnailProps {
  project: ProjectRecord
  className?: string
}

const GRADIENTS = [
  "from-violet-500/40 via-fuchsia-500/30 to-amber-300/20",
  "from-sky-500/40 via-violet-500/30 to-rose-400/20",
  "from-emerald-500/40 via-cyan-500/30 to-sky-400/20",
  "from-amber-500/40 via-rose-500/30 to-fuchsia-400/20",
  "from-indigo-500/40 via-violet-500/30 to-fuchsia-400/20",
  "from-rose-500/40 via-amber-400/30 to-emerald-300/20",
]

function pickGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function ProjectThumbnail({ project, className }: ProjectThumbnailProps) {
  const aspect = aspectClass(project.settings.canvasSize)

  if (project.thumbnailDataUrl) {
    return (
      <div
        className={cn(
          "bg-muted relative w-full overflow-hidden rounded-md",
          aspect,
          className
        )}
      >
        <Image
          src={project.thumbnailDataUrl}
          alt={project.name}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover"
          unoptimized
        />
      </div>
    )
  }

  const gradient = pickGradient(project.id)
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-md",
        aspect,
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div className="absolute inset-0 flex items-center justify-center">
        <FilmSlate size={28} weight="duotone" className="text-white/70" />
      </div>
    </div>
  )
}

function aspectClass(size: { width: number; height: number }): string {
  const ratio = size.width / size.height
  if (ratio > 1.5) return "aspect-video"
  if (ratio < 0.7) return "aspect-[9/16]"
  if (Math.abs(ratio - 1) < 0.05) return "aspect-square"
  if (Math.abs(ratio - 0.8) < 0.05) return "aspect-[4/5]"
  return "aspect-video"
}
