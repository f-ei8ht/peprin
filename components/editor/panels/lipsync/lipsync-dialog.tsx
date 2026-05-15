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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { Voice, LipsyncMode } from "@/lib/heygen/types"
import { useHeyGenJobStore } from "@/lib/heygen/job-store"
import { pollHeyGenJob } from "@/lib/heygen/polling"
import { useMediaStore } from "@/lib/media/store"
import { useEditorStore } from "@/lib/editor/editor-store"

interface LipsyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceVideoUrl: string
  sourceVideoName: string
  sourceAssetId?: string
}

export function LipsyncDialog({
  open,
  onOpenChange,
  sourceVideoUrl,
  sourceVideoName,
  sourceAssetId,
}: LipsyncDialogProps) {
  const project = useEditorStore((s) => s.project)
  const importRemoteFile = useMediaStore((s) => s.importRemoteFile)
  const addJob = useHeyGenJobStore((s) => s.addJob)
  const updateJob = useHeyGenJobStore((s) => s.updateJob)

  const [mode, setMode] = React.useState<LipsyncMode>("speed")
  const [audioSource, setAudioSource] = React.useState<"url" | "script">("url")
  const [audioUrl, setAudioUrl] = React.useState("")
  const [script, setScript] = React.useState("")
  const [voiceId, setVoiceId] = React.useState("")
  const [voices, setVoices] = React.useState<Voice[]>([])
  const [loadingVoices, setLoadingVoices] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [generating, setGenerating] = React.useState(false)
  const [speechUrl, setSpeechUrl] = React.useState<string | null>(null)
  const [generatingSpeech, setGeneratingSpeech] = React.useState(false)
  const voicesLoadedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open || voicesLoadedRef.current) return
    voicesLoadedRef.current = true
    setTitle(`Lipsync: ${sourceVideoName}`)
    ;(async () => {
      setLoadingVoices(true)
      try {
        const res = await fetch("/api/heygen/voices?engine=starfish&limit=50")
        const json = await res.json()
        if (json.data) setVoices(json.data)
      } catch {
        // silently fail
      } finally {
        setLoadingVoices(false)
      }
    })()
  }, [open, sourceVideoName])

  const handleGenerateSpeech = async () => {
    if (!script.trim()) {
      toast.error("Script is required")
      return
    }
    if (!voiceId) {
      toast.error("Please select a voice")
      return
    }

    setGeneratingSpeech(true)
    try {
      const res = await fetch("/api/heygen/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script.trim(), voice_id: voiceId }),
      })
      const json = await res.json()
      if (!res.ok || !json.data?.audio_url) {
        throw new Error(json.error?.message ?? "Failed to generate speech")
      }
      setSpeechUrl(json.data.audio_url)
      toast.success("Speech generated", {
        description: "Audio is ready. Submit lipsync when ready.",
      })
    } catch (err) {
      toast.error("Speech generation failed", {
        description: (err as Error).message,
      })
    } finally {
      setGeneratingSpeech(false)
    }
  }

  const handleLipsync = async () => {
    if (!project) {
      toast.error("No project open")
      return
    }

    const finalAudioUrl = audioSource === "url" ? audioUrl : speechUrl
    if (!finalAudioUrl) {
      toast.error(audioSource === "url" ? "Audio URL is required" : "Generate speech first")
      return
    }

    setGenerating(true)

    const jobId = nanoid()
    addJob({
      id: jobId,
      type: "lipsync",
      heygenId: "",
      status: "pending",
      title: title || `Lipsync: ${sourceVideoName}`,
    })

    try {
      const res = await fetch("/api/heygen/lipsyncs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: { type: "url", url: sourceVideoUrl },
          audio: { type: "url", url: finalAudioUrl },
          mode,
          title: title || `Lipsync: ${sourceVideoName}`,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.data?.lipsync_id) {
        throw new Error(json.error?.message ?? "Failed to create lipsync")
      }

      const lipsyncId = json.data.lipsync_id
      updateJob(jobId, { heygenId: lipsyncId, status: "pending" })

      toast.success("Lipsync started", {
        description: "This may take a few minutes.",
      })

      pollHeyGenJob(
        lipsyncId,
        "lipsync",
        (status) => {
          updateJob(jobId, {
            status: status.status as never,
            resultUrl: status.video_url ?? undefined,
            duration: status.duration ?? undefined,
            error: status.failure_message ?? undefined,
          })
        },
        { intervalMs: 10000, maxAttempts: 180 }
      )
        .then(async (result) => {
          if (result.video_url) {
            await importRemoteFile({
              url: result.video_url,
              name: `Lipsync — ${sourceVideoName}`,
              kind: "video",
              mimeType: "video/mp4",
              durationSec: result.duration ?? 0,
            })
            updateJob(jobId, { status: "completed" })
            toast.success("Lipsync video imported", {
              description: "Find it in your media library.",
            })
          }
        })
        .catch((err) => {
          updateJob(jobId, { status: "failed", error: (err as Error).message })
          toast.error("Lipsync failed", { description: (err as Error).message })
        })

      onOpenChange(false)
    } catch (err) {
      updateJob(jobId, { status: "failed", error: (err as Error).message })
      toast.error("Couldn't start lipsync", {
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
          <DialogTitle>Lipsync</DialogTitle>
          <DialogDescription>
            Replace audio on "{sourceVideoName}" with new lip-synced audio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Mode */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as LipsyncMode)}>
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
              placeholder="Lipsync job title"
              className="h-8 text-xs"
            />
          </div>

          {/* Audio source toggle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Audio Source</Label>
            <Select value={audioSource} onValueChange={(v) => setAudioSource(v as "url" | "script")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">Audio URL</SelectItem>
                <SelectItem value="script">Text-to-Speech</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audioSource === "url" ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Audio URL</Label>
              <Input
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="h-8 text-xs"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Voice</Label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingVoices ? (
                      <SelectItem value="__loading" disabled>Loading…</SelectItem>
                    ) : (
                      voices.map((v) => (
                        <SelectItem key={v.voice_id} value={v.voice_id}>
                          {v.name} — {v.language} ({v.gender})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Script</Label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="What should be spoken?"
                  rows={3}
                  className="text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateSpeech}
                disabled={generatingSpeech || !script.trim() || !voiceId}
                className="h-8 text-xs"
              >
                {generatingSpeech ? (
                  <>
                    <Spinner className="mr-1 size-3" />
                    Generating…
                  </>
                ) : (
                  "Generate Speech"
                )}
              </Button>
              {speechUrl && (
                <audio src={speechUrl} controls className="w-full" />
              )}
            </>
          )}

          <Button
            onClick={handleLipsync}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Spinner className="mr-2 size-3" />
                Starting…
              </>
            ) : (
              "Start Lipsync"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
