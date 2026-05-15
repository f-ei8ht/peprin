// HeyGen job tracking store — tracks async generation jobs in the editor.

import { create } from "zustand"
import type { HeyGenStatus } from "@/lib/heygen/types"

export type HeyGenJobType = "video" | "lipsync" | "translation"

export interface HeyGenJob {
  id: string
  type: HeyGenJobType
  heygenId: string
  status: HeyGenStatus
  title?: string
  createdAt: number
  updatedAt: number
  resultUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
  mediaAssetId?: string
}

export interface CompletedVideo {
  heygenId: string
  title: string
  resultUrl: string
  thumbnailUrl?: string
  duration?: number
  jobType: HeyGenJobType
  createdAt: number
  mediaAssetId?: string
}

interface HeyGenJobState {
  jobs: HeyGenJob[]
  completedVideos: CompletedVideo[]
  addJob: (job: Omit<HeyGenJob, "createdAt" | "updatedAt">) => void
  updateJob: (id: string, patch: Partial<HeyGenJob>) => void
  removeJob: (id: string) => void
  getJob: (id: string) => HeyGenJob | undefined
  addCompletedVideo: (video: CompletedVideo) => void
  removeCompletedVideo: (heygenId: string) => void
  activeJobCount: number
}

export const useHeyGenJobStore = create<HeyGenJobState>((set, get) => ({
  jobs: [],
  completedVideos: [],
  activeJobCount: 0,

  addJob: (job) =>
    set((state) => ({
      jobs: [
        ...state.jobs,
        {
          ...job,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeJobCount: state.activeJobCount + 1,
    })),

  updateJob: (id, patch) =>
    set((state) => {
      const existing = state.jobs.find((j) => j.id === id)
      const wasActive = existing && (existing.status === "pending" || existing.status === "processing" || existing.status === "running" || existing.status === "waiting")
      const newStatus = patch.status ?? existing?.status
      const isNowTerminal = newStatus === "completed" || newStatus === "failed"
      const newActiveCount = wasActive && isNowTerminal
        ? state.activeJobCount - 1
        : !wasActive && !isNowTerminal && newStatus
          ? state.activeJobCount + 1
          : state.activeJobCount

      return {
        jobs: state.jobs.map((j) =>
          j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j
        ),
        activeJobCount: newActiveCount,
      }
    }),

  removeJob: (id) =>
    set((state) => {
      const existing = state.jobs.find((j) => j.id === id)
      const wasActive = existing && (existing.status === "pending" || existing.status === "processing" || existing.status === "running" || existing.status === "waiting")
      return {
        jobs: state.jobs.filter((j) => j.id !== id),
        activeJobCount: wasActive ? state.activeJobCount - 1 : state.activeJobCount,
      }
    }),

  getJob: (id) => get().jobs.find((j) => j.id === id),

  addCompletedVideo: (video) =>
    set((state) => {
      const exists = state.completedVideos.find((v) => v.heygenId === video.heygenId)
      if (exists) return state
      return { completedVideos: [video, ...state.completedVideos] }
    }),

  removeCompletedVideo: (heygenId) =>
    set((state) => ({
      completedVideos: state.completedVideos.filter((v) => v.heygenId !== heygenId),
    })),
}))
