"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Camera,
  VideoCamera,
  Sparkle,
  Upload,
  LinkSimple,
  TextT,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import type { AvatarLook } from "@/lib/heygen/types"

type AvatarCreateType = "photo" | "digital_twin" | "prompt"

interface CreateAvatarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAvatarCreated: (look: AvatarLook) => void
}

export function CreateAvatarDialog({
  open,
  onOpenChange,
  onAvatarCreated,
}: CreateAvatarDialogProps) {
  const [activeTab, setActiveTab] = React.useState<AvatarCreateType>("photo")
  const [name, setName] = React.useState("")
  const [photoUrl, setPhotoUrl] = React.useState("")
  const [twinUrl, setTwinUrl] = React.useState("")
  const [prompt, setPrompt] = React.useState("")
  const [referenceUrls, setReferenceUrls] = React.useState("")
  const [photoFile, setPhotoFile] = React.useState<File | null>(null)
  const [twinFile, setTwinFile] = React.useState<File | null>(null)
  const [creating, setCreating] = React.useState(false)

  const reset = React.useCallback(() => {
    setName("")
    setPhotoUrl("")
    setTwinUrl("")
    setPrompt("")
    setReferenceUrls("")
    setPhotoFile(null)
    setTwinFile(null)
  }, [])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) reset()
      onOpenChange(open)
    },
    [onOpenChange, reset]
  )

  const handleFileSelect = React.useCallback(
    (type: "photo" | "twin") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      if (type === "photo") setPhotoFile(file)
      else setTwinFile(file)
    },
    []
  )

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Avatar name is required")
      return
    }

    setCreating(true)

    try {
      let fileId: string | null = null

      if (activeTab === "photo" && photoFile) {
        const formData = new FormData()
        formData.append("file", photoFile)
        const uploadRes = await fetch("/api/heygen/assets", {
          method: "POST",
          body: formData,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok || !uploadJson.data?.asset_id) {
          throw new Error(uploadJson.error ?? "Upload failed")
        }
        fileId = uploadJson.data.asset_id
      }

      if (activeTab === "digital_twin" && twinFile) {
        const formData = new FormData()
        formData.append("file", twinFile)
        const uploadRes = await fetch("/api/heygen/assets", {
          method: "POST",
          body: formData,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok || !uploadJson.data?.asset_id) {
          throw new Error(uploadJson.error ?? "Upload failed")
        }
        fileId = uploadJson.data.asset_id
      }

      const body: Record<string, unknown> = {
        name: name.trim(),
      }

      if (activeTab === "photo") {
        body.type = "photo"
        if (fileId) {
          body.file = { type: "asset_id", asset_id: fileId }
        } else if (photoUrl.trim()) {
          body.file = { type: "url", url: photoUrl.trim() }
        } else {
          throw new Error("Provide a photo URL or upload a photo")
        }
      } else if (activeTab === "digital_twin") {
        body.type = "digital_twin"
        if (fileId) {
          body.file = { type: "asset_id", asset_id: fileId }
        } else if (twinUrl.trim()) {
          body.file = { type: "url", url: twinUrl.trim() }
        } else {
          throw new Error("Provide a training video URL or upload a video")
        }
      } else {
        body.type = "prompt"
        if (!prompt.trim()) {
          throw new Error("Prompt is required for prompt-to-avatar")
        }
        body.prompt = prompt.trim()
        const refs = referenceUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
        if (refs.length > 0) {
          body.reference_images = refs.map((url) => ({ type: "url", url }))
        }
      }

      const res = await fetch("/api/heygen/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok || !json.data?.avatar_item) {
        throw new Error(json.error ?? "Failed to create avatar")
      }

      const avatarItem = json.data.avatar_item
      toast.success("Avatar created", {
        description: `${avatarItem.name} is being processed. It will appear in your avatars once ready.`,
      })

      onAvatarCreated({
        id: avatarItem.id,
        name: avatarItem.name,
        avatar_type: avatarItem.avatar_type,
        group_id: avatarItem.group_id,
        gender: avatarItem.gender,
        preview_image_url: avatarItem.preview_image_url,
        preview_video_url: avatarItem.preview_video_url,
        default_voice_id: avatarItem.default_voice_id,
        tags: avatarItem.tags,
        supported_api_engines: avatarItem.supported_api_engines,
        status: avatarItem.status,
        image_width: avatarItem.image_width,
        image_height: avatarItem.image_height,
        preferred_orientation: avatarItem.preferred_orientation,
      })

      handleOpenChange(false)
    } catch (err) {
      toast.error("Couldn't create avatar", {
        description: (err as Error).message,
      })
    } finally {
      setCreating(false)
    }
  }

  const canSubmit =
    name.trim() &&
    ((activeTab === "photo" && (photoUrl.trim() || photoFile)) ||
      (activeTab === "digital_twin" && (twinUrl.trim() || twinFile)) ||
      (activeTab === "prompt" && prompt.trim()))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={18} weight="duotone" />
            Create Avatar
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AvatarCreateType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo" className="text-xs">
              <Camera size={12} weight="bold" className="mr-1" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="digital_twin" className="text-xs">
              <VideoCamera size={12} weight="bold" className="mr-1" />
              Digital Twin
            </TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs">
              <Sparkle size={12} weight="bold" className="mr-1" />
              Prompt
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-col gap-4">
            {/* Name — shared */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Avatar Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah — Marketing"
                className="h-8 text-xs"
              />
            </div>

            {/* Photo Avatar */}
            <TabsContent value="photo" className="mt-0 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  <LinkSimple size={12} weight="bold" className="mr-1 inline" />
                  Photo URL
                </Label>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/portrait.jpg"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span>or</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  <Upload size={12} weight="bold" className="mr-1 inline" />
                  Upload Photo
                </Label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect("photo")}
                  className="text-xs"
                />
                {photoFile && (
                  <p className="text-muted-foreground text-[10px]">
                    Selected: {photoFile.name} ({(photoFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Use a clear, front-facing portrait with good lighting. Avoid sunglasses, hats, or extreme angles.
              </p>
            </TabsContent>

            {/* Digital Twin */}
            <TabsContent value="digital_twin" className="mt-0 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  <LinkSimple size={12} weight="bold" className="mr-1 inline" />
                  Training Video URL
                </Label>
                <Input
                  value={twinUrl}
                  onChange={(e) => setTwinUrl(e.target.value)}
                  placeholder="https://example.com/training.mp4"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span>or</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  <Upload size={12} weight="bold" className="mr-1 inline" />
                  Upload Training Video
                </Label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileSelect("twin")}
                  className="text-xs"
                />
                {twinFile && (
                  <p className="text-muted-foreground text-[10px]">
                    Selected: {twinFile.name} ({(twinFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Upload 2-5 minutes of clear video footage of the person speaking. Good lighting and audio quality improve results.
              </p>
            </TabsContent>

            {/* Prompt-to-Avatar */}
            <TabsContent value="prompt" className="mt-0 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  <TextT size={12} weight="bold" className="mr-1 inline" />
                  Character Description
                </Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Young woman, early 30s, confident expression, short silver hair, warm brown eyes, wearing a dark blue space suit..."
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  <LinkSimple size={12} weight="bold" className="mr-1 inline" />
                  Reference Image URLs (optional, one per line)
                </Label>
                <Textarea
                  value={referenceUrls}
                  onChange={(e) => setReferenceUrls(e.target.value)}
                  placeholder="https://example.com/style-ref.png&#10;https://example.com/setting-ref.jpg"
                  rows={2}
                  className="text-xs"
                />
              </div>

              <p className="text-muted-foreground text-[10px] leading-relaxed">
                Be specific about age, expression, clothing, and background. Reference images help with style consistency.
              </p>
            </TabsContent>
          </div>
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={creating || !canSubmit}
          className="mt-2 w-full"
        >
          {creating ? (
            <>
              <Spinner className="mr-2 size-3" />
              Creating…
            </>
          ) : (
            <>
              <Sparkle size={14} weight="fill" />
              Create Avatar
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
