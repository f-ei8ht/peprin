"use client"

import * as React from "react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { TranslationMode } from "@/lib/heygen/types"
import { useHeyGenJobStore } from "@/lib/heygen/job-store"
import { pollHeyGenJob } from "@/lib/heygen/polling"
import { useMediaStore } from "@/lib/media/store"
import { useEditorStore } from "@/lib/editor/editor-store"

interface TranslationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceVideoUrl: string
  sourceVideoName: string
}

export function TranslationDialog({
  open,
  onOpenChange,
  sourceVideoUrl,
  sourceVideoName,
}: TranslationDialogProps) {
  const project = useEditorStore((s) => s.project)
  const importRemoteFile = useMediaStore((s) => s.importRemoteFile)
  const addJob = useHeyGenJobStore((s) => s.addJob)
  const updateJob = useHeyGenJobStore((s) => s.updateJob)

  const [mode, setMode] = React.useState<TranslationMode>("speed")
  const [languages, setLanguages] = React.useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const languagesLoadedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open || languagesLoadedRef.current) return
    languagesLoadedRef.current = true
    setTitle(`Translate: ${sourceVideoName}`)
    ;(async () => {
      try {
        const res = await fetch("/api/heygen/translations")
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setLanguages(json.data.sort())
        }
      } catch {
        setLanguages(["Spanish", "French", "German", "Japanese", "Chinese", "Hindi", "Portuguese", "Arabic"])
      } finally {
        setLoading(false)
      }
    })()
  }, [open, sourceVideoName])

  const handleTranslate = async () => {
    if (!project) {
      toast.error("No project open")
      return
    }
    if (!selectedLanguage) {
      toast.error("Please select a target language")
      return
    }

    setGenerating(true)

    const jobId = nanoid()
    addJob({
      id: jobId,
      type: "translation",
      heygenId: "",
      status: "pending",
      title: title || `Translate: ${sourceVideoName}`,
    })

    try {
      const res = await fetch("/api/heygen/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: { type: "url", url: sourceVideoUrl },
          output_languages: [selectedLanguage],
          mode,
          title: title || `Translate: ${sourceVideoName}`,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.data?.video_translation_ids?.length) {
        throw new Error(json.error?.message ?? "Failed to create translation")
      }

      const translationId = json.data.video_translation_ids[0]
      updateJob(jobId, { heygenId: translationId, status: "pending" })

      toast.success("Translation started", {
        description: `Translating to ${selectedLanguage}. This may take a few minutes.`,
      })

      pollHeyGenJob(
        translationId,
        "translation",
        (status) => {
          updateJob(jobId, {
            status: status.status as never,
            resultUrl: status.video_url ?? undefined,
            duration: status.duration ?? undefined,
            error: status.failure_message ?? undefined,
          })
        },
        { intervalMs: 15000, maxAttempts: 240 }
      )
        .then(async (result) => {
          if (result.video_url) {
            await importRemoteFile({
              url: result.video_url,
              name: `${selectedLanguage} — ${sourceVideoName}`,
              kind: "video",
              mimeType: "video/mp4",
              durationSec: result.duration ?? 0,
            })
            updateJob(jobId, { status: "completed" })
            toast.success("Translation imported", {
              description: `Find "${selectedLanguage}" version in your media library.`,
            })
          }
        })
        .catch((err) => {
          updateJob(jobId, { status: "failed", error: (err as Error).message })
          toast.error("Translation failed", { description: (err as Error).message })
        })

      onOpenChange(false)
    } catch (err) {
      updateJob(jobId, { status: "failed", error: (err as Error).message })
      toast.error("Couldn't start translation", {
        description: (err as Error).message,
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Video Translation</DialogTitle>
          <DialogDescription>
            Translate "{sourceVideoName}" to another language with lip-sync.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Mode */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as TranslationMode)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speed">Speed (fast)</SelectItem>
                <SelectItem value="precision">Precision (high quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Translation job title"
              className="h-8 text-xs"
            />
          </div>

          {/* Language */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Target Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={loading ? "Loading…" : "Select language"} />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="__loading" disabled>Loading…</SelectItem>
                ) : (
                  languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTranslate}
            disabled={generating || !selectedLanguage}
            className="w-full"
          >
            {generating ? (
              <>
                <Spinner className="mr-2 size-3" />
                Starting…
              </>
            ) : (
              "Start Translation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
