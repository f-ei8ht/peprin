"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Sparkle } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CANVAS_PRESETS, type CanvasPreset } from "@/lib/db/types"
import { useProjectsStore } from "@/lib/projects/store"
import { cn } from "@/lib/utils"

interface CreateProjectDialogProps {
  trigger?: React.ReactNode
  variant?: "primary" | "outline"
}

export function CreateProjectDialog({
  trigger,
  variant = "primary",
}: CreateProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [preset, setPreset] = React.useState<CanvasPreset>("16:9-1080p")
  const [submitting, setSubmitting] = React.useState(false)

  const reset = () => {
    setName("")
    setPreset("16:9-1080p")
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const config =
        CANVAS_PRESETS.find((c) => c.id === preset) ?? CANVAS_PRESETS[0]
      const project = await useProjectsStore.getState().create({
        name: name.trim() || undefined,
        settings: {
          canvasSize: config.size,
          canvasPreset: config.id,
        },
      })
      toast.success("Project created", {
        description: project.name,
      })
      setOpen(false)
      reset()
      router.push(`/editor/${project.id}`)
    } catch (e) {
      toast.error("Couldn't create project", {
        description: (e as Error).message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="lg"
            variant={variant === "outline" ? "outline" : "default"}
            className="h-10 px-4"
          >
            <Plus size={16} weight="bold" />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-amber-500" />
            New project
          </DialogTitle>
          <DialogDescription>
            Pick a canvas size to start. You can change it any time from the
            editor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-project-name">Name</Label>
            <Input
              id="new-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={128}
              placeholder="Untitled project"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Canvas</Label>
            <div className="grid grid-cols-2 gap-2">
              {CANVAS_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setPreset(c.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                    preset === c.id
                      ? "border-foreground bg-foreground/5"
                      : "hover:border-foreground/40"
                  )}
                >
                  <PresetGlyph aspect={c.size.width / c.size.height} />
                  <span className="mt-2 text-sm font-medium">{c.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {c.size.width}×{c.size.height}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PresetGlyph({ aspect }: { aspect: number }) {
  // Render a small representative box scaled to a 32px box.
  const max = 32
  const w = aspect >= 1 ? max : Math.round(max * aspect)
  const h = aspect >= 1 ? Math.round(max / aspect) : max
  return (
    <span
      aria-hidden="true"
      className="bg-foreground/15 inline-block rounded-sm"
      style={{ width: w, height: h }}
    />
  )
}
