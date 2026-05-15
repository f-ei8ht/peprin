"use client"

import * as React from "react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import {
  Play,
  SpeakerHigh,
  TextAa,
  Gear,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { AvatarLook, Voice, VideoResolution, VideoAspectRatio } from "@/lib/heygen/types"
import { useHeyGenJobStore } from "@/lib/heygen/job-store"
import { pollHeyGenJob } from "@/lib/heygen/polling"
import { useMediaStore } from "@/lib/media/store"
import { useEditorStore } from "@/lib/editor/editor-store"

interface AvatarGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  look: AvatarLook
}

export function AvatarGeneratorDialog({
  open,
  onOpenChange,
  look,
}: AvatarGeneratorDialogProps) {
  const project = useEditorStore((s) => s.project)
  const importRemoteFile = useMediaStore((s) => s.importRemoteFile)
  const addJob = useHeyGenJobStore((s) => s.addJob)
  const updateJob = useHeyGenJobStore((s) => s.updateJob)

  const [script, setScript] = React.useState("")
  const [voiceId, setVoiceId] = React.useState(look.default_voice_id ?? "")
  const [voices, setVoices] = React.useState<Voice[]>([])
  const [loadingVoices, setLoadingVoices] = React.useState(false)
  const [resolution, setResolution] = React.useState<VideoResolution>("1080p")
  const [aspectRatio, setAspectRatio] = React.useState<VideoAspectRatio>("16:9")
  const [engine, setEngine] = React.useState<"avatar_iv" | "avatar_v">(
    look.supported_api_engines.includes("avatar_v") ? "avatar_v" : "avatar_iv"
  )
  const [motionPrompt, setMotionPrompt] = React.useState("")
  const [expressiveness, setExpressiveness] = React.useState<"high" | "medium" | "low">("low")
  const [generating, setGenerating] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const voicesLoadedRef = React.useRef(false)

  // Load voices on open
  React.useEffect(() => {
    if (!open || voicesLoadedRef.current) return
    voicesLoadedRef.current = true
    ;(async () => {
      setLoadingVoices(true)
      try {
        const res = await fetch("/api/heygen/voices?limit=50")
        const json = await res.json()
        if (json.data) setVoices(json.data)
      } catch {
        // silently fail
      } finally {
        setLoadingVoices(false)
      }
    })()
  }, [open])

  const canUseAvatarV = look.supported_api_engines.includes("avatar_v")

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error("Script is required")
      return
    }
    if (!voiceId) {
      toast.error("Please select a voice")
      return
    }
    if (!project) {
      toast.error("No project open")
      return
    }

    setGenerating(true)

    const jobId = nanoid()
    addJob({
      id: jobId,
      type: "video",
      heygenId: "",
      status: "pending",
      title: `Avatar: ${look.name}`,
    })

    try {
      const body: Record<string, unknown> = {
        type: "avatar",
        avatar_id: look.id,
        script: script.trim(),
        voice_id: voiceId,
        title: `Peprin — ${look.name}`,
        resolution,
        aspect_ratio: aspectRatio,
      }

      if (canUseAvatarV && engine === "avatar_v") {
        body.engine = { type: "avatar_v" }
      }

      if (look.avatar_type === "photo_avatar" && engine !== "avatar_v") {
        if (motionPrompt) body.motion_prompt = motionPrompt
        if (expressiveness !== "low") body.expressiveness = expressiveness
      }

      const res = await fetch("/api/heygen/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok || !json.data?.video_id) {
        throw new Error(json.error?.message ?? "Failed to create video")
      }

      const videoId = json.data.video_id
      updateJob(jobId, { heygenId: videoId, status: "waiting" })

      toast.success("Video generation started", {
        description: "This may take a few minutes. We'll import it when ready.",
      })

      // Poll for completion
      pollHeyGenJob(
        videoId,
        "video",
        (status) => {
          updateJob(jobId, {
            status: status.status as never,
            resultUrl: status.video_url ?? undefined,
            thumbnailUrl: status.thumbnail_url ?? undefined,
            duration: status.duration ?? undefined,
            error: status.failure_message ?? undefined,
          })
        },
        { intervalMs: 10000, maxAttempts: 180 }
      )
        .then(async (result) => {
          if (result.video_url) {
            // Import the generated video into the media library
            await importRemoteFile({
              url: result.video_url,
              name: `HeyGen — ${look.name}`,
              kind: "video",
              mimeType: "video/mp4",
              thumbnailUrl: result.thumbnail_url ?? undefined,
              durationSec: result.duration ?? 0,
            })
            updateJob(jobId, { status: "completed" })
            toast.success("Avatar video imported", {
              description: "Find it in your media library.",
            })
          }
        })
        .catch((err) => {
          updateJob(jobId, {
            status: "failed",
            error: (err as Error).message,
          })
          toast.error("Generation failed", {
            description: (err as Error).message,
          })
        })

      onOpenChange(false)
    } catch (err) {
      updateJob(jobId, {
        status: "failed",
        error: (err as Error).message,
      })
      toast.error("Couldn't start generation", {
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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkle size={18} weight="duotone" />
              Generate Avatar Video
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Avatar preview */}
          <div className="flex gap-3">
            <div className="bg-foreground/5 aspect-[9/16] w-16 overflow-hidden rounded">
              {look.preview_image_url && (
                <img
                  src={look.preview_image_url}
                  alt={look.name}
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col justify-center gap-1">
              <p className="text-foreground text-sm font-medium">{look.name}</p>
              <p className="text-muted-foreground text-xs capitalize">
                {look.avatar_type.replace("_", " ")}
              </p>
              {canUseAvatarV && (
                <span className="text-foreground/60 text-[10px] font-medium uppercase tracking-wide">
                  Supports Avatar V
                </span>
              )}
            </div>
          </div>

          {/* Script */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              <TextAa size={12} weight="bold" className="mr-1 inline" />
              Script
            </Label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="What should the avatar say? (max 5,000 chars)"
              maxLength={5000}
              rows={4}
              className="text-xs"
            />
            <p className="text-muted-foreground text-[10px] text-right">
              {script.length}/5,000
            </p>
          </div>

          {/* Voice */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              <SpeakerHigh size={12} weight="bold" className="mr-1 inline" />
              Voice
            </Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {loadingVoices ? (
                  <SelectItem value="__loading" disabled>
                    Loading voices…
                  </SelectItem>
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

          {/* Resolution + Aspect */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Resolution</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as VideoResolution)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as VideoAspectRatio)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Engine (if Avatar V supported) */}
          {canUseAvatarV && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Engine</Label>
              <Select value={engine} onValueChange={(v) => setEngine(v as "avatar_iv" | "avatar_v")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avatar_iv">Avatar IV (default)</SelectItem>
                  <SelectItem value="avatar_v">Avatar V (higher quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            <Gear size={12} weight="bold" />
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-3 border-t pt-3">
              {/* Motion prompt (photo avatars, Avatar IV only) */}
              {look.avatar_type === "photo_avatar" && engine !== "avatar_v" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Motion Prompt (optional)</Label>
                  <Input
                    value={motionPrompt}
                    onChange={(e) => setMotionPrompt(e.target.value)}
                    placeholder='e.g. "nodding gently"'
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {/* Expressiveness (photo avatars, Avatar IV only) */}
              {look.avatar_type === "photo_avatar" && engine !== "avatar_v" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Expressiveness</Label>
                  <Select value={expressiveness} onValueChange={(v) => setExpressiveness(v as "high" | "medium" | "low")}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (default)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !script.trim() || !voiceId}
            className="w-full"
          >
            {generating ? (
              <>
                <span className="mr-2 inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Starting…
              </>
            ) : (
              <>
                <Play size={14} weight="fill" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
