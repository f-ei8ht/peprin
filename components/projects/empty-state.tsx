"use client"

import { FilmStrip, Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onCreate: () => void
  isFiltered?: boolean
  onClearSearch?: () => void
}

export function EmptyState({ onCreate, isFiltered, onClearSearch }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="bg-card flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <p className="text-foreground text-base font-medium">No matches</p>
        <p className="text-muted-foreground max-w-md text-sm">
          Nothing matches your search. Try a different term or clear the
          filter.
        </p>
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-10 text-center">
      <span className="bg-foreground/5 inline-flex size-12 items-center justify-center rounded-full">
        <FilmStrip size={24} weight="duotone" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-base font-medium">
          No projects yet
        </p>
        <p className="text-muted-foreground max-w-md text-sm">
          Spin up your first project. It lives in your browser, ready for
          clips, voiceover, and HeyGen avatars.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus size={16} weight="bold" />
        Create your first project
      </Button>
    </div>
  )
}
