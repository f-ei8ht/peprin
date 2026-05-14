"use client"

import { useRouter } from "next/navigation"

import { ProjectActions } from "@/components/projects/project-actions"
import { ProjectThumbnail } from "@/components/projects/project-thumbnail"
import { formatRelative } from "@/lib/relative-time"
import { cn } from "@/lib/utils"
import type { ProjectRecord } from "@/lib/db/types"

interface ProjectCardProps {
  project: ProjectRecord
  layout: "grid" | "list"
}

export function ProjectCard({ project, layout }: ProjectCardProps) {
  const router = useRouter()
  const open = () => router.push(`/editor/${project.id}`)

  // We use a div with role=button instead of a real <button> so we can host
  // the actions dropdown (also a button) inside without nesting button
  // elements, which is invalid HTML.
  const interactiveProps = {
    role: "button" as const,
    tabIndex: 0,
    onClick: open,
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        open()
      }
    },
  }

  if (layout === "list") {
    return (
      <div
        {...interactiveProps}
        className={cn(
          "group bg-card flex w-full items-center gap-4 rounded-md border p-3 text-left transition-colors",
          "hover:border-foreground/30 hover:bg-foreground/[0.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        <div className="w-32 shrink-0">
          <ProjectThumbnail project={project} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{project.name}</h3>
          </div>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            Edited {formatRelative(project.updatedAt)} ·{" "}
            {project.settings.canvasSize.width}×
            {project.settings.canvasSize.height} · {project.settings.fps} fps
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ProjectActions project={project} />
        </div>
      </div>
    )
  }

  return (
    <div
      {...interactiveProps}
      className={cn(
        "group bg-card flex flex-col gap-3 rounded-xl border p-3 text-left transition-all",
        "hover:border-foreground/30 hover:bg-foreground/[0.02] hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      )}
    >
      <ProjectThumbnail project={project} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{project.name}</h3>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            Edited {formatRelative(project.updatedAt)}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ProjectActions project={project} />
        </div>
      </div>
    </div>
  )
}
