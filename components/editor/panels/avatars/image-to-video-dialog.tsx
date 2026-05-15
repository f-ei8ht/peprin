"use client"

import * as React from "react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import {
  Play,
  SpeakerHigh,
  TextAa,
  Image,
  Upload,
  LinkSimple,
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
import { Spinner } from "@/components/ui/spinner"
import type { Voice, VideoResolution, VideoAspectRatio, Expressiveness } from "@/lib/heygen/types"
import { useHeyGenJobStore } from "@/lib/heygen/job-store"
import { pollHeyGenJob } from "@/lib/heygen/polling"
import { useMediaStore } from "@/lib/media/store"
import { useEditorStore } from "@/lib/editor/editor-store"

interface ImageToVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageToVideoDialog({
  open,
  onOpenChange,
}: ImageToVideoDialogProps) {
  const project = useEditorStore((s) => s.project)
  const importRemoteFile = useMediaStore((s) => s.importRemoteFile)
  const addJob = useHeyGenJobStore((s) => s.addJob)
  const updateJob = useHeyGenJobStore((s) => s.updateJob)
  const addCompletedVideo = useHeyGenJobStore((s) => s.addCompletedVideo)

  const [imageUrl, setImageUrl] = React.useState("")
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [script, setScript] = React.useState("")
  const [voiceId, setVoiceId] = React.useState("")
  const [voices, setVoices] = React.useState<Voice[]>([])
  const [loadingVoices, setLoadingVoices] = React.useState(false)
  const [resolution, setResolution] = React.useState<VideoResolution>("1080p")
  const [aspectRatio, setAspectRatio] = React.useState<VideoAspectRatio>("16:9")
  const [motionPrompt, setMotionPrompt] = React.useState("")
  const [expressiveness, setExpressiveness] = React.useState<Expressiveness>("low")
  const [generating, setGenerating] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const voicesLoadedRef = React.useRef(false)

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

  const reset = React.useCallback(() => {
    setImageUrl("")
    setImageFile(null)
    setScript("")
    setVoiceId("")
    setMotionPrompt("")
    setExpressiveness("low")
    setShowAdvanced(false)
    voicesLoadedRef.current = false
  }, [])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) reset()
      onOpenChange(open)
    },
    [onOpenChange, reset]
  )

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageFile(e.target.files?.[0] ?? null)
    },
    []
  )

  const handleGenerate = async () => {
    if (!imageUrl.trim() && !imageFile) {
      toast.error("Provide an image URL or upload an image")
      return
    }
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

    try {
      let imageAssetId: string | null = null

      if (imageFile) {
        const formData = new FormData()
        formData.append("file", imageFile)
        const uploadRes = await fetch("/api/heygen/assets", {
          method: "POST",
          body: formData,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok || !uploadJson.data?.asset_id) {
          throw new Error(uploadJson.error ?? "Image upload failed")
        }
        imageAssetId = uploadJson.data.asset_id
      }

      const jobId = nanoid()
      addJob({
        id: jobId,
        type: "video",
        heygenId: "",
        status: "pending",
        title: `Image-to-Video: ${imageFile?.name ?? imageUrl.split("/").pop() ?? "image"}`,
      })

      const body: Record<string, unknown> = {
        type: "image",
        image: imageAssetId
          ? { type: "asset_id", asset_id: imageAssetId }
          : { type: "url", url: imageUrl.trim() },
        script: script.trim(),
        voice_id: voiceId,
        title: `Peprin — Image to Video`,
        resolution,
        aspect_ratio: aspectRatio,
        motion_prompt: motionPrompt || undefined,
        expressiveness: expressiveness !== "low" ? expressiveness : undefined,
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
            await importRemoteFile({
              url: result.video_url,
              name: `HeyGen — Image to Video`,
              kind: "video",
              mimeType: "video/mp4",
              thumbnailUrl: result.thumbnail_url ?? undefined,
              durationSec: result.duration ?? 0,
            })
            updateJob(jobId, { status: "completed" })

            addCompletedVideo({
              heygenId: videoId,
              title: `Image-to-Video: ${imageFile?.name ?? imageUrl.split("/").pop() ?? "image"}`,
              resultUrl: result.video_url,
              thumbnailUrl: result.thumbnail_url ?? undefined,
              duration: result.duration ?? undefined,
              jobType: "video",
              createdAt: Date.now(),
            })

            toast.success("Video imported", {
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

      handleOpenChange(false)
    } catch (err) {
      toast.error("Couldn't start generation", {
        description: (err as Error).message,
      })
    } finally {
      setGenerating(false)
    }
  }

  const canSubmit =
    (imageUrl.trim() || imageFile) &&
    script.trim() &&
    voiceId

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image size={18} weight="duotone" />
            Image to Video
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Image source */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              <LinkSimple size={12} weight="bold" className="mr-1 inline" />
              Image URL
            </Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/person.jpg"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>or</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              <Upload size={12} weight="bold" className="mr-1 inline" />
              Upload Image
            </Label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              className="text-xs"
            />
            {imageFile && (
              <p className="text-muted-foreground text-[10px]">
                Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
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
              placeholder="What should the person say? (max 5,000 chars)"
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

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            <span className="i-ph-gear-bold size-3" />
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-3 border-t pt-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Motion Prompt (optional)</Label>
                <Input
                  value={motionPrompt}
                  onChange={(e) => setMotionPrompt(e.target.value)}
                  placeholder='e.g. "nodding gently"'
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Expressiveness</Label>
                <Select value={expressiveness} onValueChange={(v) => setExpressiveness(v as Expressiveness)}>
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
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !canSubmit}
            className="w-full"
          >
            {generating ? (
              <>
                <Spinner className="mr-2 size-3" />
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
