"use client"

import * as React from "react"

import { useTimelineStore, TRACK_LABEL_W } from "@/lib/editor/timeline-store"

interface TimelineRulerProps {
  scrollLeft: number
  /** Fired when user clicks/drags the ruler to seek. */
  onSeek: (timeSec: number) => void
}

export function TimelineRuler({ scrollLeft, onSeek }: TimelineRulerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(800)
  const zoom = useTimelineStore((s) => s.zoom)
  const duration = useTimelineStore((s) => s.duration)

  const scrubRef = React.useRef<{ active: boolean; pointerId: number | null }>({
    active: false,
    pointerId: null,
  })

  // Track container width without reading ref during render
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clientXToTime = (clientX: number): number => {
    const el = containerRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left + scrollLeft - TRACK_LABEL_W
    return Math.max(0, x / zoom)
  }

  // Generate tick marks
  const ticks = React.useMemo(() => {
    const items: { position: number; label: string; major: boolean }[] = []
    const visibleStart = scrollLeft - TRACK_LABEL_W
    const visibleEnd = visibleStart + containerWidth

    // Choose tick interval based on zoom
    let interval = 1 // seconds
    const pps = zoom
    if (pps < 10) interval = 10
    else if (pps < 25) interval = 5
    else if (pps < 50) interval = 2
    else if (pps < 100) interval = 1
    else if (pps < 200) interval = 0.5

    const startT = Math.floor((visibleStart / pps) / interval) * interval
    const endT = Math.ceil((visibleEnd / pps) / interval) * interval

    for (let t = startT; t <= endT; t += interval) {
      const pos = t * pps + TRACK_LABEL_W
      const m = Math.floor(t / 60)
      const s = t % 60
      const frac = interval < 1
      const label = frac
        ? `${m}:${s.toFixed(1)}`
        : `${m}:${String(Math.round(s)).padStart(2, "0")}`
      const major = t % (interval * 5) < 0.001 || (interval >= 1 && Math.abs(t % 5) < 0.001)
      items.push({ position: pos, label, major })
    }
    return items
  }, [zoom, scrollLeft, containerWidth])

  return (
    <div
      ref={containerRef}
      className="bg-background relative h-7 shrink-0 select-none border-b overflow-hidden"
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        scrubRef.current = { active: true, pointerId: e.pointerId }
        onSeek(clientXToTime(e.clientX))
      }}
      onPointerMove={(e) => {
        if (!scrubRef.current.active || e.pointerId !== scrubRef.current.pointerId) return
        onSeek(clientXToTime(e.clientX))
      }}
      onPointerUp={(e) => {
        if (e.pointerId !== scrubRef.current.pointerId) return
        scrubRef.current = { active: false, pointerId: null }
      }}
      onPointerCancel={() => {
        scrubRef.current = { active: false, pointerId: null }
      }}
    >
      {/* Track label spacer */}
      <div
        className="bg-background absolute left-0 top-0 z-10 h-full border-r"
        style={{ width: TRACK_LABEL_W }}
      />

      {/* Ticks */}
      <div className="absolute inset-0" style={{ paddingLeft: TRACK_LABEL_W }}>
        {ticks.map((tick) => (
          <div
            key={tick.position}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: tick.position, transform: "translateX(-50%)" }}
          >
            <div
              className={
                tick.major ? "bg-foreground/30 w-px h-3" : "bg-foreground/15 w-px h-1.5"
              }
            />
            {tick.major && (
              <span className="text-muted-foreground mt-0.5 font-mono text-[10px] leading-none">
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Duration indicator — shows total length when contentWidth > 0 */}
      {duration > 0 && (
        <div
          className="bg-foreground/10 absolute bottom-0 h-full border-l"
          style={{ left: duration * zoom + TRACK_LABEL_W }}
        />
      )}
    </div>
  )
}
