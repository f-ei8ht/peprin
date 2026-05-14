"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
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
import { SaveIndicator } from "@/components/editor/save-indicator"
import { useEditorStore } from "@/lib/editor/editor-store"
import { renameProject } from "@/lib/projects/repo"
import { cn } from "@/lib/utils"

export function EditorHeader() {
  return (
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
        <ProjectMenu />
        <ProjectNameInput />
        <SaveIndicator className="ml-2 hidden sm:inline-flex" />
      </div>

      <div className="flex items-center gap-2">
        <LayoutPicker />
        <Button variant="outline" size="sm" disabled>
          <Sparkle size={14} weight="fill" className="text-amber-500" />
          HeyGen
        </Button>
        <Button size="sm" disabled>
          <Export size={14} weight="bold" />
          Export
        </Button>
        <ThemeToggle className="hidden sm:inline-flex" />
      </div>
    </header>
  )
}

function ProjectMenu() {
  const router = useRouter()
  const project = useEditorStore((s) => s.project)
  if (!project) return <Logo href={null} showWordmark={false} />

  return (
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
        <DropdownMenuItem disabled>Keyboard shortcuts</DropdownMenuItem>
        <DropdownMenuItem disabled>Export…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        "h-7 min-w-[6rem] max-w-[20rem] rounded-md bg-transparent px-2 text-sm font-medium outline-none",
        editing
          ? "ring-ring/40 cursor-text ring-2"
          : "hover:bg-foreground/[0.04] cursor-pointer"
      )}
    />
  )
}
