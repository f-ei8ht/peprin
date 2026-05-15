"use client"

import * as React from "react"
import { toast } from "sonner"
import { FilmStrip, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr"

import { Spinner } from "@/components/ui/spinner"
import { useHeyGenJobStore, type CompletedVideo } from "@/lib/heygen/job-store"
import { useMediaStore } from "@/lib/media/store"
import { cn } from "@/lib/utils"

interface VideoHistoryPanelProps {
  onLipsyncClick: (videoUrl: string, videoName: string) => void
  onTranslateClick: (videoUrl: string, videoName: string) => void
}

export function VideoHistoryPanel({ onLipsyncClick, onTranslateClick }: VideoHistoryPanelProps) {
  const completedVideos = useHeyGenJobStore((s) => s.completedVideos)
  const removeCompletedVideo = useHeyGenJobStore((s) => s.removeCompletedVideo)

  if (completedVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <FilmStrip size={20} weight="duotone" className="text-muted-foreground" />
        <p className="text-foreground text-sm font-medium">No video history</p>
        <p className="text-muted-foreground max-w-[24ch] text-xs leading-relaxed">
          Completed avatar, lipsync, and translation videos will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {completedVideos.map((video) => (
        <VideoHistoryCard
          key={video.heygenId}
          video={video}
          onRemove={() => removeCompletedVideo(video.heygenId)}
          onLipsync={() => onLipsyncClick(video.resultUrl, video.title)}
          onTranslate={() => onTranslateClick(video.resultUrl, video.title)}
        />
      ))}
    </div>
  )
}

function VideoHistoryCard({
  video,
  onRemove,
  onLipsync,
  onTranslate,
}: {
  video: CompletedVideo
  onRemove: () => void
  onLipsync: () => void
  onTranslate: () => void
}) {
  const importRemoteFile = useMediaStore((s) => s.importRemoteFile)
  const [reimporting, setReimporting] = React.useState(false)

  const handleReimport = async () => {
    setReimporting(true)
    try {
      await importRemoteFile({
        url: video.resultUrl,
        name: `HeyGen — ${video.title}`,
        kind: "video",
        mimeType: "video/mp4",
        thumbnailUrl: video.thumbnailUrl,
        durationSec: video.duration ?? 0,
      })
      toast.success("Video re-imported", {
        description: "Find it in your media library.",
      })
    } catch (err) {
      toast.error("Re-import failed", {
        description: (err as Error).message,
      })
    } finally {
      setReimporting(false)
    }
  }

  const timeAgo = getTimeAgo(video.createdAt)

  return (
    <div className="border bg-background rounded-lg p-3">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="bg-foreground/5 aspect-video w-20 shrink-0 overflow-hidden rounded">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <FilmStrip size={16} weight="duotone" className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-foreground truncate text-xs font-medium">
            {video.title}
          </p>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-medium uppercase tracking-wide",
              video.jobType === "video" && "text-blue-500",
              video.jobType === "lipsync" && "text-purple-500",
              video.jobType === "translation" && "text-green-500",
            )}>
              {video.jobType}
            </span>
            {video.duration && (
              <span className="text-muted-foreground text-[10px]">
                {video.duration.toFixed(1)}s
              </span>
            )}
            <span className="text-muted-foreground text-[10px]">{timeAgo}</span>
          </div>

          {/* Actions */}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={handleReimport}
              disabled={reimporting}
              className="text-foreground/70 hover:text-foreground flex items-center gap-1 text-[10px] font-medium disabled:opacity-50"
            >
              {reimporting ? (
                <Spinner className="size-2.5" />
              ) : (
                <ArrowsClockwise size={10} weight="bold" />
              )}
              Re-import
            </button>
            <span className="text-muted-foreground text-[10px]">·</span>
            <button
              type="button"
              onClick={onLipsync}
              className="text-foreground/70 hover:text-foreground text-[10px] font-medium"
            >
              Lipsync
            </button>
            <span className="text-muted-foreground text-[10px]">·</span>
            <button
              type="button"
              onClick={onTranslate}
              className="text-foreground/70 hover:text-foreground text-[10px] font-medium"
            >
              Translate
            </button>
          </div>
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Remove from history"
        >
          <FilmStrip size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
