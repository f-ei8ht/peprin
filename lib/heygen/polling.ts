// Polling utility for HeyGen async jobs.

import type { HeyGenJobType } from "@/lib/heygen/job-store"

interface PollConfig {
  intervalMs: number
  maxAttempts: number
}

const DEFAULT_CONFIGS: Record<HeyGenJobType, PollConfig> = {
  video: { intervalMs: 10000, maxAttempts: 180 }, // 30 min max
  lipsync: { intervalMs: 10000, maxAttempts: 180 },
  translation: { intervalMs: 15000, maxAttempts: 240 }, // 60 min max
}

export async function pollHeyGenJob(
  jobId: string,
  type: HeyGenJobType,
  onStatus: (status: {
    status: string
    video_url?: string | null
    thumbnail_url?: string | null
    duration?: number | null
    failure_message?: string | null
  }) => void,
  config?: Partial<PollConfig>
): Promise<{
  status: string
  video_url?: string | null
  thumbnail_url?: string | null
  duration?: number | null
}> {
  const { intervalMs, maxAttempts } = { ...DEFAULT_CONFIGS[type], ...config }

  const endpoint =
    type === "video"
      ? `/api/heygen/videos/${jobId}`
      : type === "lipsync"
        ? `/api/heygen/lipsyncs/${jobId}`
        : `/api/heygen/translations/${jobId}`

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(endpoint)
    if (!res.ok) {
      throw new Error(`Failed to poll job: ${res.statusText}`)
    }

    const json = await res.json()
    const data = json.data

    onStatus({
      status: data.status,
      video_url: data.video_url,
      thumbnail_url: data.thumbnail_url,
      duration: data.duration,
      failure_message: data.failure_message,
    })

    if (data.status === "completed") {
      return {
        status: data.status,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        duration: data.duration,
      }
    }

    if (data.status === "failed") {
      throw new Error(data.failure_message ?? "Job failed")
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }

  throw new Error("Job polling timed out")
}
