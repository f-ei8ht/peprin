"use client"

import * as React from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  DotsThreeVertical,
  FilmStrip,
  Image as ImageIcon,
  MusicNote,
  PencilSimple,
  TrashSimple,
  Globe,
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
import { useMediaStore } from "@/lib/media/store"
import { formatBytes } from "@/lib/string"
import { formatTimecode } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { MediaAsset } from "@/lib/media/types"
import { getMediaBlob } from "@/lib/media/repo"

interface MediaAssetCardProps {
  asset: MediaAsset
  onLipsync?: (url: string, name: string) => void
  onTranslate?: (url: string, name: string) => void
}

export function MediaAssetCard({ asset, onLipsync, onTranslate }: MediaAssetCardProps) {
  const removeAsset = useMediaStore((s) => s.removeAsset)
  const renameAsset = useMediaStore((s) => s.renameAsset)
  const [renameOpen, setRenameOpen] = React.useState(false)

  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("application/x-peprin-media", asset.id)
    event.dataTransfer.effectAllowed = "copy"
  }

  const handleHeyGenAction = async (action: "lipsync" | "translate") => {
    try {
      const blob = await getMediaBlob(asset.id)
      if (!blob) {
        // For remote assets (HeyGen-generated), use the asset metadata
        // The blob should exist since importRemoteFile stores it
        return
      }
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob)
      if (action === "lipsync" && onLipsync) {
        onLipsync(url, asset.name)
      } else if (action === "translate" && onTranslate) {
        onTranslate(url, asset.name)
      }
    } catch {
      // If blob access fails, skip
    }
  }

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        className={cn(
          "group bg-card relative flex cursor-grab flex-col overflow-hidden rounded-md border transition-colors",
          "hover:border-foreground/30 active:cursor-grabbing"
        )}
      >
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          {asset.thumbnailDataUrl ? (
            <Image
              src={asset.thumbnailDataUrl}
              alt={asset.name}
              fill
              sizes="200px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <KindGlyph kind={asset.kind} />
          )}
          <KindBadge kind={asset.kind} />
          {asset.durationSec > 0 && (
            <span className="absolute bottom-1 right-1 rounded-sm bg-black/60 px-1 font-mono text-[10px] text-white">
              {formatTimecode(asset.durationSec)}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-1 p-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{asset.name}</p>
            <p className="text-muted-foreground truncate text-[10px]">
              {asset.width && asset.height
                ? `${asset.width}×${asset.height} · `
                : ""}
              {formatBytes(asset.byteSize)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Asset actions"
                className="-mr-1"
              >
                <DotsThreeVertical size={14} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <PencilSimple size={12} weight="bold" />
                Rename
              </DropdownMenuItem>
              {asset.kind === "video" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleHeyGenAction("lipsync")}>
                    <FilmStrip size={12} weight="bold" />
                    Lipsync
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleHeyGenAction("translate")}>
                    <Globe size={12} weight="bold" />
                    Translate
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  try {
                    await removeAsset(asset.id)
                    toast.success("Removed media")
                  } catch (e) {
                    toast.error("Couldn't remove", {
                      description: (e as Error).message,
                    })
                  }
                }}
              >
                <TrashSimple size={12} weight="bold" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <RenameMediaDialog
        asset={asset}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onSubmit={async (name) => {
          await renameAsset(asset.id, name)
        }}
      />
    </>
  )
}

function KindGlyph({ kind }: { kind: MediaAsset["kind"] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {kind === "video" ? (
        <FilmStrip size={24} weight="duotone" className="text-white/60" />
      ) : kind === "audio" ? (
        <MusicNote size={24} weight="duotone" className="text-white/60" />
      ) : (
        <ImageIcon size={24} weight="duotone" className="text-white/60" />
      )}
    </div>
  )
}

function KindBadge({ kind }: { kind: MediaAsset["kind"] }) {
  return (
    <span className="absolute left-1 top-1 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
      {kind}
    </span>
  )
}

function RenameMediaDialog({
  asset,
  open,
  onOpenChange,
  onSubmit,
}: {
  asset: MediaAsset
  open: boolean
  onOpenChange: (next: boolean) => void
  onSubmit: (name: string) => Promise<void>
}) {
  const [dirtyName, setDirtyName] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const name = open ? (dirtyName ?? asset.name) : asset.name

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const next = name.trim()
    if (!next || next === asset.name) {
      onOpenChange(false)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(next)
      toast.success("Renamed media")
      onOpenChange(false)
    } catch (error) {
      toast.error("Couldn't rename", {
        description: (error as Error).message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setDirtyName(null); onOpenChange(next) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename media</DialogTitle>
          <DialogDescription>
            Give this asset a friendlier name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="media-rename">Name</Label>
            <Input
              id="media-rename"
              autoFocus
              value={name}
              onChange={(e) => setDirtyName(e.target.value)}
              maxLength={256}
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
            <Button type="submit" disabled={submitting || !name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
