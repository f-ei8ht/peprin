"use client"

import * as React from "react"

import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectsList } from "@/components/projects/projects-list"
import { ProjectsToolbar } from "@/components/projects/projects-toolbar"
import { useProjectsStore } from "@/lib/projects/store"

export function ProjectsShell() {
  const totalProjects = useProjectsStore((s) => s.projects.length)
  const isLoaded = useProjectsStore((s) => s.isLoaded)
  const createDialogRef = React.useRef<{ open: () => void } | null>(null)

  // We open the create dialog from the empty-state CTA via a small trick:
  // the dialog handles its own open state, so we render it always and
  // forward an "open" by re-rendering the trigger as a hidden button we
  // click programmatically.
  // Simpler: the empty state can render its own CreateProjectDialog instance.
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {!isLoaded
              ? "Loading your projects…"
              : totalProjects === 0
                ? "Spin up your first project. Everything stays on your device."
                : `${totalProjects} project${totalProjects === 1 ? "" : "s"} on this device`}
          </p>
        </div>
        <CreateProjectDialog />
      </header>

      {totalProjects > 0 && <ProjectsToolbar />}

      <ProjectsList
        onCreate={() => {
          // We can't programmatically open the dialog above without lifting
          // its state; instead we render an inline trigger here so empty-
          // state taps still feel native.
          document
            .getElementById("create-project-trigger-fallback")
            ?.click()
        }}
      />

      {/* Hidden fallback trigger for empty-state opening */}
      <CreateProjectDialog
        trigger={
          <button
            id="create-project-trigger-fallback"
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
          />
        }
      />
    </div>
  )
}
