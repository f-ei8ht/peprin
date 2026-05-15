"use client"

import * as React from "react"
import { Clock, CheckCircle, XCircle, Spinner, FilmStrip } from "@phosphor-icons/react/dist/ssr"
import { useHeyGenJobStore, type HeyGenJob } from "@/lib/heygen/job-store"
import { cn } from "@/lib/utils"

import { VideoHistoryPanel } from "./video-history-panel"

type HistoryTab = "jobs" | "history"

interface HeyGenJobsPanelProps {
  onLipsyncClick: (videoUrl: string, videoName: string) => void
  onTranslateClick: (videoUrl: string, videoName: string) => void
}

export function HeyGenJobsPanel({ onLipsyncClick, onTranslateClick }: HeyGenJobsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<HistoryTab>("jobs")
  const jobs = useHeyGenJobStore((s) => s.jobs)
  const completedVideos = useHeyGenJobStore((s) => s.completedVideos)
  const removeJob = useHeyGenJobStore((s) => s.removeJob)

  const sorted = React.useMemo(
    () => [...jobs].sort((a, b) => b.createdAt - a.createdAt),
    [jobs]
  )

  const activeJobs = sorted.filter((j) => j.status !== "completed" && j.status !== "failed")
  const terminalJobs = sorted.filter((j) => j.status === "completed" || j.status === "failed")

  return (
    <div className="flex h-full flex-col">
      {/* Tab switcher */}
      <div className="bg-background flex shrink-0 items-center gap-1 border-b px-3 py-2">
        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
            activeTab === "jobs"
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock size={12} weight="bold" />
          Jobs
          {activeJobs.length > 0 && (
            <span className="bg-amber-500/20 text-amber-500 ml-1 rounded-full px-1.5 text-[10px]">
              {activeJobs.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
            activeTab === "history"
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FilmStrip size={12} weight="bold" />
          History
          {completedVideos.length > 0 && (
            <span className="bg-blue-500/20 text-blue-500 ml-1 rounded-full px-1.5 text-[10px]">
              {completedVideos.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "jobs" ? (
          <div className="flex flex-col gap-2 p-3">
            {activeJobs.length === 0 && terminalJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <Clock size={20} weight="duotone" className="text-muted-foreground" />
                <p className="text-foreground text-sm font-medium">No jobs yet</p>
                <p className="text-muted-foreground max-w-[24ch] text-xs leading-relaxed">
                  Generated avatar, lipsync, or translation videos will appear here.
                </p>
              </div>
            ) : (
              <>
                {activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onRemove={() => removeJob(job.id)}
                    onLipsync={() => {
                      if (job.resultUrl) onLipsyncClick(job.resultUrl, job.title ?? "Video")
                    }}
                    onTranslate={() => {
                      if (job.resultUrl) onTranslateClick(job.resultUrl, job.title ?? "Video")
                    }}
                  />
                ))}
                {terminalJobs.length > 0 && activeJobs.length > 0 && (
                  <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                    Completed / Failed
                  </div>
                )}
                {terminalJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onRemove={() => removeJob(job.id)}
                    onLipsync={() => {
                      if (job.resultUrl) onLipsyncClick(job.resultUrl, job.title ?? "Video")
                    }}
                    onTranslate={() => {
                      if (job.resultUrl) onTranslateClick(job.resultUrl, job.title ?? "Video")
                    }}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <VideoHistoryPanel
            onLipsyncClick={onLipsyncClick}
            onTranslateClick={onTranslateClick}
          />
        )}
      </div>
    </div>
  )
}

function JobCard({
  job,
  onRemove,
  onLipsync,
  onTranslate,
}: {
  job: HeyGenJob
  onRemove: () => void
  onLipsync: () => void
  onTranslate: () => void
}) {
  const isComplete = job.status === "completed"
  const isFailed = job.status === "failed"
  const isActive = !isComplete && !isFailed

  return (
    <div className="border bg-background rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            {isActive && <Spinner size={14} weight="bold" className="text-amber-500" />}
            {isComplete && <CheckCircle size={14} weight="fill" className="text-green-500" />}
            {isFailed && <XCircle size={14} weight="fill" className="text-red-500" />}
            <p className="text-foreground truncate text-xs font-medium">
              {job.title ?? job.type}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
              {job.type}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium capitalize",
                isActive && "text-amber-500",
                isComplete && "text-green-500",
                isFailed && "text-red-500"
              )}
            >
              {job.status}
            </span>
            {job.duration && (
              <span className="text-muted-foreground text-[10px]">
                {job.duration.toFixed(1)}s
              </span>
            )}
          </div>
          {job.error && (
            <p className="text-red-500 truncate text-[10px]">{job.error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Remove"
        >
          <XCircle size={14} weight="bold" />
        </button>
      </div>

      {isComplete && job.resultUrl && (
        <div className="mt-2 flex gap-2">
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
      )}
    </div>
  )
}
