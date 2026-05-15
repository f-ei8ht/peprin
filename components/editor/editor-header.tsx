"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowClockwise,
  CaretDown,
  Export,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { LayoutPicker } from "@/components/editor/layout-picker"
import { KeyboardShortcutsDialog } from "@/components/editor/panels/keyboard-shortcuts-dialog"
import { ExportDialog } from "@/components/editor/panels/export-dialog"
import { SaveIndicator } from "@/components/editor/save-indicator"
import { useEditorStore } from "@/lib/editor/editor-store"
import { useHeyGenJobStore } from "@/lib/heygen/job-store"
import { useTimelineStore } from "@/lib/editor/timeline-store"
import { canUndo, canRedo, undo, redo } from "@/lib/editor/history"
import { renameProject } from "@/lib/projects/repo"
import { cn } from "@/lib/utils"

export function EditorHeader() {
  const activeJobs = useHeyGenJobStore((s) => s.activeJobCount)
  const [exportOpen, setExportOpen] = React.useState(false)

  return (
    <>
      <header className="bg-background flex h-12 items-center justify-between border-b px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/projects"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} weight="bold" />
            <span className="hidden sm:inline">Projects</span>
          </Link>
          <Separator orientation="vertical" className="mx-2 h-5" />
          <ProjectMenu onExport={() => setExportOpen(true)} />
          <ProjectNameInput />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <UndoRedoButtons />
          <SaveIndicator className="ml-2 hidden sm:inline-flex" />
        </div>

        <div className="flex items-center gap-2">
          <LayoutPicker />
          <HeyGenButton activeCount={activeJobs} />
          <Button size="sm" onClick={() => setExportOpen(true)}>
            <Export size={14} weight="bold" />
            Export
          </Button>
          <ThemeToggle className="hidden sm:inline-flex" />
        </div>
      </header>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </>
  )
}

function HeyGenButton({ activeCount }: { activeCount: number }) {
  const setRightTab = useEditorStore((s) => s.setRightTab)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setRightTab("heygen")}
      className="relative"
    >
      <Sparkle size={14} weight="fill" className="text-amber-500" />
      HeyGen
      {activeCount > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
          {activeCount}
        </span>
      )}
    </Button>
  )
}

function ProjectMenu({ onExport }: { onExport: () => void }) {
  const router = useRouter()
  const project = useEditorStore((s) => s.project)
  const shortcutsOpen = useEditorStore((s) => s.shortcutsDialogOpen)
  const setShortcutsOpen = useEditorStore((s) => s.setShortcutsDialogOpen)

  if (!project) return <Logo href={null} showWordmark={false} />

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-1.5">
            <Logo href={null} showWordmark={false} />
            <CaretDown size={12} weight="bold" className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{project.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/projects")}>
            Back to projects
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              toast.message("Project info", {
                description: `${project.settings.canvasSize.width}×${project.settings.canvasSize.height} · ${project.settings.fps} fps`,
              })
            }
          >
            Project info
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
            Keyboard shortcuts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>Export…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  )
}

function ProjectNameInput() {
  const project = useEditorStore((s) => s.project)
  const setProject = useEditorStore((s) => s.setProject)
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus)
  const markSaved = useEditorStore((s) => s.markSaved)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [editing, setEditing] = React.useState(false)

  if (!project) return null

  const startEdit = () => {
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const submit = async () => {
    if (!inputRef.current) return
    const next = inputRef.current.value.trim()
    setEditing(false)
    if (!next || !project) {
      inputRef.current.value = project?.name ?? ""
      return
    }
    if (next === project.name) return
    try {
      setSaveStatus("saving")
      await renameProject(project.id, next)
      setProject({ ...project, name: next, updatedAt: Date.now() })
      markSaved()
    } catch (e) {
      setSaveStatus("error", (e as Error).message)
      toast.error("Couldn't rename", {
        description: (e as Error).message,
      })
      if (inputRef.current) inputRef.current.value = project.name
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={project.name}
      readOnly={!editing}
      onClick={startEdit}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          inputRef.current?.blur()
        }
        if (e.key === "Escape") {
          e.preventDefault()
          if (inputRef.current) inputRef.current.value = project.name
          inputRef.current?.blur()
        }
      }}
      style={{ fieldSizing: "content" } as React.CSSProperties}
      className={cn(
        "h-7 min-w-[6rem] max-w-[20rem] rounded-md bg-foreground/[0.04] px-2 text-sm font-medium outline-none",
        editing
          ? "ring-ring/40 cursor-text ring-2"
          : "hover:bg-foreground/[0.07] cursor-pointer"
      )}
    />
  )
}

function UndoRedoButtons() {
  const [u, setU] = React.useState(false)
  const [r, setR] = React.useState(false)
  const restoreTracks = useTimelineStore((s) => s.restoreTracks)
  const clearSelection = useTimelineStore((s) => s.clearSelection)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setU(canUndo())
      setR(canRedo())
    }, 200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Undo (Ctrl+Z)"
        disabled={!u}
        onClick={() => {
          const result = undo()
          if (result) {
            restoreTracks(result.tracks)
            clearSelection()
          }
        }}
      >
        <ArrowCounterClockwise size={14} weight="bold" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Redo (Ctrl+Shift+Z)"
        disabled={!r}
        onClick={() => {
          const result = redo()
          if (result) {
            restoreTracks(result.tracks)
            clearSelection()
          }
        }}
      >
        <ArrowClockwise size={14} weight="bold" />
      </Button>
    </div>
  )
}
