"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  GridFour,
  List as ListIcon,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useProjectsStore } from "@/lib/projects/store"
import type { ProjectSortKey } from "@/lib/db/types"
import { cn } from "@/lib/utils"

const SORT_LABELS: Record<ProjectSortKey, string> = {
  updatedAt: "Last edited",
  createdAt: "Date created",
  name: "Name",
  durationMs: "Duration",
}

export function ProjectsToolbar() {
  const searchQuery = useProjectsStore((s) => s.searchQuery)
  const setSearchQuery = useProjectsStore((s) => s.setSearchQuery)
  const sortKey = useProjectsStore((s) => s.sortKey)
  const sortOrder = useProjectsStore((s) => s.sortOrder)
  const setSortKey = useProjectsStore((s) => s.setSortKey)
  const toggleSortOrder = useProjectsStore((s) => s.toggleSortOrder)
  const viewMode = useProjectsStore((s) => s.viewMode)
  const setViewMode = useProjectsStore((s) => s.setViewMode)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-sm flex-1">
        <MagnifyingGlass
          size={14}
          weight="bold"
          className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
        />
        <Input
          placeholder="Search projects"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 pr-8"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {SORT_LABELS[sortKey]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sortKey}
              onValueChange={(value) => setSortKey(value as ProjectSortKey)}
            >
              {(Object.keys(SORT_LABELS) as ProjectSortKey[]).map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              aria-label="Toggle sort order"
              onClick={toggleSortOrder}
            >
              {sortOrder === "asc" ? (
                <ArrowUp size={14} weight="bold" />
              ) : (
                <ArrowDown size={14} weight="bold" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </TooltipContent>
        </Tooltip>

        <div
          role="group"
          aria-label="View mode"
          className="flex h-9 items-center rounded-md border p-0.5"
        >
          <button
            type="button"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={cn(
              "inline-flex h-full items-center justify-center rounded px-2 text-sm",
              viewMode === "grid"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Grid view"
          >
            <GridFour size={16} weight="bold" />
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex h-full items-center justify-center rounded px-2 text-sm",
              viewMode === "list"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="List view"
          >
            <ListIcon size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
