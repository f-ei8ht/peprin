"use client"

import * as React from "react"

import { ProjectCard } from "@/components/projects/project-card"
import { EmptyState } from "@/components/projects/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { useProjectsStore } from "@/lib/projects/store"
import type { ProjectRecord, ProjectSortKey, SortOrder } from "@/lib/db/types"

interface ProjectsListProps {
  onCreate: () => void
}

export function ProjectsList({ onCreate }: ProjectsListProps) {
  const isLoaded = useProjectsStore((s) => s.isLoaded)
  const isLoading = useProjectsStore((s) => s.isLoading)
  const error = useProjectsStore((s) => s.error)
  const viewMode = useProjectsStore((s) => s.viewMode)
  const allProjects = useProjectsStore((s) => s.projects)
  const sortKey = useProjectsStore((s) => s.sortKey)
  const sortOrder = useProjectsStore((s) => s.sortOrder)
  const searchQuery = useProjectsStore((s) => s.searchQuery)
  const setSearchQuery = useProjectsStore((s) => s.setSearchQuery)
  const load = useProjectsStore((s) => s.load)

  const projects = React.useMemo(
    () => filterAndSort(allProjects, searchQuery, sortKey, sortOrder),
    [allProjects, searchQuery, sortKey, sortOrder]
  )

  React.useEffect(() => {
    if (!isLoaded) load()
  }, [isLoaded, load])

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
        Couldn&apos;t load projects: {error}
      </div>
    )
  }

  if (projects.length === 0) {
    const isFiltered = allProjects.length > 0 && searchQuery.trim().length > 0
    return (
      <EmptyState
        onCreate={onCreate}
        isFiltered={isFiltered}
        onClearSearch={() => setSearchQuery("")}
      />
    )
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} layout="list" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} layout="grid" />
      ))}
    </div>
  )
}

function filterAndSort(
  projects: ProjectRecord[],
  query: string,
  sortKey: ProjectSortKey,
  sortOrder: SortOrder
): ProjectRecord[] {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? projects.filter((p) => p.name.toLowerCase().includes(q))
    : projects.slice()

  const dir = sortOrder === "asc" ? 1 : -1
  filtered.sort((a, b) => {
    switch (sortKey) {
      case "name":
        return a.name.localeCompare(b.name) * dir
      case "createdAt":
        return (a.createdAt - b.createdAt) * dir
      case "durationMs":
        return (a.timeline.durationMs - b.timeline.durationMs) * dir
      case "updatedAt":
      default:
        return (a.updatedAt - b.updatedAt) * dir
    }
  })
  return filtered
}
