"use client"

import * as React from "react"
import { toast } from "sonner"
import { FilmStrip, FolderOpen, Plus } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { useEditorStore } from "@/lib/editor/editor-store"
import { useMediaStore } from "@/lib/media/store"
import { cn } from "@/lib/utils"

import { MediaAssetCard } from "./media-asset-card"
import { MediaImportProgress } from "./media-import-progress"
import { MediaDropOverlay } from "./media-drop-overlay"

const ACCEPT = "video/*,audio/*,image/*"

export function MediaTab() {
  const project = useEditorStore((s) => s.project)
  const projectId = project?.id ?? null

  const isLoading = useMediaStore((s) => s.isLoading)
  const assets = useMediaStore((s) => s.assets)
  const load = useMediaStore((s) => s.load)
  const reset = useMediaStore((s) => s.reset)
  const importFiles = useMediaStore((s) => s.importFiles)

  const [search, setSearch] = React.useState("")
  const [isDraggingOver, setDraggingOver] = React.useState(false)
  const dragCounter = React.useRef(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!projectId) {
      reset()
      return
    }
    load(projectId)
  }, [projectId, load, reset])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assets
    return assets.filter((a) => a.name.toLowerCase().includes(q))
  }, [assets, search])

  const onChooseFiles = () => inputRef.current?.click()

  const handlePickedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!projectId) {
      toast.error("Open a project first")
      return
    }
    try {
      await importFiles(files)
    } catch (error) {
      toast.error("Couldn't import", {
        description: (error as Error).message,
      })
    }
  }

  // Drag-and-drop handlers
  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragCounter.current += 1
    setDraggingOver(true)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragCounter.current = Math.max(0, dragCounter.current - 1)
    if (dragCounter.current === 0) setDraggingOver(false)
  }

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragCounter.current = 0
    setDraggingOver(false)
    await handlePickedFiles(event.dataTransfer.files)
  }

  return (
    <div
      className="relative flex h-full flex-col"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b p-3">
        <Button size="sm" onClick={onChooseFiles} className="h-8 w-full">
          <Plus size={14} weight="bold" />
          Add media
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            handlePickedFiles(e.currentTarget.files)
            e.currentTarget.value = ""
          }}
        />
        <Input
          placeholder="Search media"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <MediaImportProgress />

      <div className={cn("flex min-h-0 flex-1 flex-col overflow-auto p-3")}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="size-4" />
          </div>
        ) : filtered.length === 0 ? (
          assets.length === 0 ? (
            <EmptyMediaState onChooseFiles={onChooseFiles} />
          ) : (
            <p className="text-muted-foreground py-6 text-center text-xs">
              No media matches “{search}”.
            </p>
          )
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((asset) => (
              <MediaAssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>

      {isDraggingOver && projectId && <MediaDropOverlay />}
    </div>
  )
}

function EmptyMediaState({ onChooseFiles }: { onChooseFiles: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="bg-foreground/5 inline-flex size-12 items-center justify-center rounded-full">
        <FilmStrip size={20} weight="duotone" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">No media yet</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Drop video, audio, or image files here, or click below to browse.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onChooseFiles}>
        <FolderOpen size={14} weight="bold" />
        Browse
      </Button>
    </div>
  )
}
