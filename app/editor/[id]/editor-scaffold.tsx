"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, FilmStrip, PencilSimple } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ProjectThumbnail } from "@/components/projects/project-thumbnail"
import { formatRelative } from "@/lib/relative-time"
import { getProject, renameProject, touchProject } from "@/lib/projects/repo"
import { useProjectsStore } from "@/lib/projects/store"
import type { ProjectRecord } from "@/lib/db/types"

interface EditorScaffoldProps {
  projectId: string
}

export function EditorScaffold({ projectId }: EditorScaffoldProps) {
  const router = useRouter()
  const [project, setProject] = React.useState<ProjectRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState(false)
  const [draftName, setDraftName] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getProject(projectId)
      .then(async (p) => {
        if (cancelled) return
        if (!p) {
          setError("Project not found")
        } else {
          setProject(p)
          setDraftName(p.name)
          // Bump updatedAt so the projects list reflects recent activity.
          touchProject(projectId).catch(() => {})
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as Error).message)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="bg-card flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <FilmStrip size={28} weight="duotone" className="text-muted-foreground" />
        <p className="text-foreground text-base font-medium">
          {error ?? "Project not found"}
        </p>
        <p className="text-muted-foreground max-w-md text-sm">
          The project you&apos;re looking for might have been deleted or never
          existed on this device.
        </p>
        <Link href="/projects">
          <Button variant="outline">
            <ArrowLeft size={14} weight="bold" />
            Back to projects
          </Button>
        </Link>
      </div>
    )
  }

  const saveName = async () => {
    const next = draftName.trim()
    if (!next || next === project.name) {
      setEditingName(false)
      setDraftName(project.name)
      return
    }
    try {
      await renameProject(project.id, next)
      setProject({ ...project, name: next, updatedAt: Date.now() })
      // Keep the projects store in sync if the user navigates back.
      try {
        await useProjectsStore.getState().reload()
      } catch {}
      toast.success("Renamed project")
    } catch (e) {
      toast.error("Couldn't rename", {
        description: (e as Error).message,
      })
    } finally {
      setEditingName(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          {editingName ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName()
                if (e.key === "Escape") {
                  setDraftName(project.name)
                  setEditingName(false)
                }
              }}
              className="border-b-2 border-foreground/30 bg-transparent text-3xl font-semibold tracking-tight outline-none md:text-4xl"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="group inline-flex items-center gap-2 text-left"
            >
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {project.name}
              </h1>
              <PencilSimple
                size={16}
                weight="bold"
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          )}
          <p className="text-muted-foreground text-sm">
            {project.settings.canvasSize.width}×
            {project.settings.canvasSize.height} · {project.settings.fps} fps ·
            edited {formatRelative(project.updatedAt)}
          </p>
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="bg-foreground/[0.02] aspect-video w-full">
          <ProjectThumbnail project={project} />
        </div>
        <div className="flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Editor surface coming soon
          </h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            The timeline, preview, and HeyGen actions land in the next
            iterations. Your project is saved locally — open it again any time
            from the projects page.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={() => router.push("/projects")} variant="outline">
              Back to projects
            </Button>
            <Button onClick={() => router.refresh()} variant="ghost">
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
