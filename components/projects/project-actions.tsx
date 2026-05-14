"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Copy,
  DotsThreeVertical,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProjectsStore } from "@/lib/projects/store"
import type { ProjectRecord } from "@/lib/db/types"

interface ProjectActionsProps {
  project: ProjectRecord
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Project actions"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DotsThreeVertical size={18} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <PencilSimple size={14} weight="bold" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              try {
                await useProjectsStore.getState().duplicate(project.id)
                toast.success("Duplicated project")
              } catch (e) {
                toast.error("Couldn't duplicate", {
                  description: (e as Error).message,
                })
              }
            }}
          >
            <Copy size={14} weight="bold" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <TrashSimple size={14} weight="bold" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        project={project}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}

function RenameDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectRecord
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  const [name, setName] = React.useState(project.name)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) setName(project.name)
  }, [open, project.name])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = name.trim()
    if (!next || next === project.name) {
      onOpenChange(false)
      return
    }
    setSubmitting(true)
    try {
      await useProjectsStore.getState().rename(project.id, next)
      toast.success("Renamed project")
      onOpenChange(false)
    } catch (e) {
      toast.error("Couldn't rename", {
        description: (e as Error).message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Give this project a new name. Only you will see it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-rename">Name</Label>
            <Input
              id="project-rename"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={128}
              placeholder="Project name"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || submitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectRecord
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            <span className="text-foreground font-medium">{project.name}</span>{" "}
            will be removed from your browser. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true)
              try {
                await useProjectsStore.getState().remove(project.id)
                toast.success("Project deleted")
                onOpenChange(false)
                router.refresh()
              } catch (e) {
                toast.error("Couldn't delete", {
                  description: (e as Error).message,
                })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <TrashSimple size={14} weight="bold" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
