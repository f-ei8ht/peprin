"use client"

import * as React from "react"

import { useTimelineStore, TRACK_LABEL_W } from "@/lib/editor/timeline-store"
import { getPlaybackManager } from "@/lib/editor/playback"

interface TimelinePlayheadProps {
  scrollLeft: number
}

export function TimelinePlayhead({ scrollLeft }: TimelinePlayheadProps) {
  const zoom = useTimelineStore((s) => s.zoom)
  const playheadRef = React.useRef<HTMLDivElement>(null)
  const [time, setTime] = React.useState(0)

  // Subscribe to playback events imperatively (prevents React re-renders during playback)
  React.useEffect(() => {
    const pm = getPlaybackManager()

    const update = () => {
      const el = playheadRef.current
      if (!el) return
      const left = pm.currentTime * zoom + TRACK_LABEL_W - scrollLeft
      el.style.left = `${left}px`
      el.style.display = "block"
      setTime(pm.currentTime)
    }

    const unsubUpdate = pm.onUpdate(() => {
      const el = playheadRef.current
      if (!el) return
      el.style.left = `${pm.currentTime * zoom + TRACK_LABEL_W - scrollLeft}px`
    })

    const unsubSeek = pm.onSeek((t) => {
      const el = playheadRef.current
      if (!el) return
      el.style.left = `${t * zoom + TRACK_LABEL_W - scrollLeft}px`
      setTime(t)
    })

    const unsub = pm.subscribe(() => {
      update()
    })

    update()

    return () => {
      unsubUpdate()
      unsubSeek()
      unsub()
    }
  }, [zoom, scrollLeft])

  return (
    <div
      ref={playheadRef}
      className="bg-primary absolute top-0 z-30 hidden h-full w-px pointer-events-none"
      style={{ left: time * zoom + TRACK_LABEL_W - scrollLeft }}
    >
      <div className="bg-primary absolute -top-1 -left-[5px] size-[11px] rounded-full" />
    </div>
  )
}
