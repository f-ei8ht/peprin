"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, FilmStrip } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { EditorHeader } from "@/components/editor/editor-header"
import { EditorLayout } from "@/components/editor/editor-layout"
import { MobileGate } from "@/components/editor/mobile-gate"
import { getProject, touchProject } from "@/lib/projects/repo"
import { useEditorStore } from "@/lib/editor/editor-store"

interface EditorLoaderProps {
  projectId: string
}

export function EditorLoader({ projectId }: EditorLoaderProps) {
  const project = useEditorStore((s) => s.project)
  const setProject = useEditorStore((s) => s.setProject)
  const [loadState, setLoadState] = React.useState<{
    status: "loading" | "ready" | "missing" | "error"
    loadedId: string | null
    errorMsg: string | null
  }>({ status: "loading", loadedId: null, errorMsg: null })

  const isLoading = loadState.loadedId !== projectId

  React.useEffect(() => {
    let cancelled = false

    getProject(projectId)
      .then((record) => {
        if (cancelled) return
        if (!record) {
          setLoadState({ status: "missing", loadedId: projectId, errorMsg: null })
          setProject(null)
          return
        }
        setProject(record)
        setLoadState({ status: "ready", loadedId: projectId, errorMsg: null })
        // Bump updatedAt so the project sorts to the top of the dashboard.
        touchProject(projectId).catch(() => {})
      })
      .catch((e) => {
        if (cancelled) return
        setLoadState({
          status: "error",
          loadedId: projectId,
          errorMsg: (e as Error).message,
        })
      })

    return () => {
      cancelled = true
    }
  }, [projectId, setProject])

  // Reset editor state on unmount so re-entering a project starts clean.
  React.useEffect(() => {
    return () => {
      useEditorStore.getState().setProject(null)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  const { status, errorMsg } = loadState

  if (status === "missing" || status === "error") {
    return (
      <div className="bg-background mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="bg-foreground/5 inline-flex size-12 items-center justify-center rounded-full">
          <FilmStrip size={20} weight="duotone" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {status === "missing" ? "Project not found" : "Couldn’t load project"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {status === "missing"
            ? "It might have been deleted, or it doesn’t exist on this device."
            : errorMsg}
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

  if (!project) return null

  return (
    <MobileGate>
      <div className="bg-background flex h-svh w-full flex-col overflow-hidden">
        <EditorHeader />
        <EditorLayout />
      </div>
    </MobileGate>
  )
}
