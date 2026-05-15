"use client"

import { Play } from "@phosphor-icons/react/dist/ssr"
import type { AvatarLook } from "@/lib/heygen/types"
import { cn } from "@/lib/utils"

interface AvatarCardProps {
  look: AvatarLook
  onSelect: () => void
}

export function AvatarCard({ look, onSelect }: AvatarCardProps) {
  const hasPreview = !!look.preview_image_url || !!look.preview_video_url

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-background text-left transition-colors hover:border-foreground/20"
    >
      {/* Preview */}
      <div className="bg-foreground/5 relative aspect-[9/16] w-full overflow-hidden">
        {hasPreview ? (
          <>
            {look.preview_image_url ? (
              <img
                src={look.preview_image_url}
                alt={look.name}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={look.preview_video_url ?? ""}
                className="size-full object-cover"
                muted
                preload="metadata"
              />
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="bg-foreground inline-flex size-8 items-center justify-center rounded-full">
                <Play size={14} weight="fill" className="text-background" />
              </span>
            </div>
          </>
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="text-muted-foreground text-xs">No preview</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2">
        <p className="text-foreground truncate text-xs font-medium">
          {look.name}
        </p>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wide",
              look.avatar_type === "studio_avatar" && "text-blue-500",
              look.avatar_type === "digital_twin" && "text-purple-500",
              look.avatar_type === "photo_avatar" && "text-green-500"
            )}
          >
            {look.avatar_type === "studio_avatar"
              ? "Studio"
              : look.avatar_type === "digital_twin"
                ? "Twin"
                : "Photo"}
          </span>
          {look.supported_api_engines.includes("avatar_v") && (
            <span className="bg-foreground/10 text-foreground/70 rounded px-1 text-[9px] font-medium">
              V
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
