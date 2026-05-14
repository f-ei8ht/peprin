"use client"

import * as React from "react"

import { LeftPanel } from "@/components/editor/panels/left-panel"
import { PreviewPanel } from "@/components/editor/panels/preview-panel"
import { RightPanel } from "@/components/editor/panels/right-panel"
import { TimelinePanel } from "@/components/editor/panels/timeline-panel"
import { usePanelStore } from "@/lib/editor/panel-store"
import { cn } from "@/lib/utils"

export function EditorLayout() {
  const sizes = usePanelStore((s) => s.sizes)
  const setOuter = usePanelStore((s) => s.setOuter)
  const setInner = usePanelStore((s) => s.setInner)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const rectRef = React.useRef({ width: 0, height: 0 })
  const sizesRef = React.useRef(sizes)

  React.useEffect(() => {
    sizesRef.current = sizes
  }, [sizes])

  React.useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      rectRef.current = { width, height }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dragRef = React.useRef<{
    handle: "left" | "right" | "timeline" | null
    pointerId: number | null
    startX: number
    startY: number
    left: number
    center: number
    right: number
    middle: number
    timeline: number
  }>({
    handle: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    left: 0,
    center: 0,
    right: 0,
    middle: 0,
    timeline: 0,
  })

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d.handle || d.pointerId !== e.pointerId) return

      const { width, height } = rectRef.current
      if (width <= 0 || height <= 0) return

      if (d.handle === "left") {
        const nextPx = (d.left / 100) * width + (e.clientX - d.startX)
        const pct = Math.max(10, Math.min(35, (nextPx / width) * 100))
        setInner({ left: pct, center: 100 - pct - d.right, right: d.right })
      } else if (d.handle === "right") {
        const nextPx = (d.right / 100) * width + (d.startX - e.clientX)
        const pct = Math.max(10, Math.min(35, (nextPx / width) * 100))
        setInner({ left: d.left, center: 100 - d.left - pct, right: pct })
      } else if (d.handle === "timeline") {
        const nextPx = (d.timeline / 100) * height + (d.startY - e.clientY)
        const pct = Math.max(6, Math.min(70, (nextPx / height) * 100))
        setOuter({ middle: 100 - pct, timeline: pct })
      }
    }

    const onEnd = (e: PointerEvent) => {
      if (dragRef.current.pointerId === e.pointerId) {
        dragRef.current.handle = null
        dragRef.current.pointerId = null
      }
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onEnd)
    window.addEventListener("pointercancel", onEnd)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onEnd)
      window.removeEventListener("pointercancel", onEnd)
    }
  }, [setInner, setOuter])

  return (
    <div
      ref={containerRef}
      className="bg-background relative flex h-[calc(100svh-3rem)] min-h-0 w-full flex-col"
    >
      {/* Middle row */}
      <div
        className="flex min-h-0"
        style={{ flex: `${sizes.outer.middle} ${sizes.outer.middle} 0px` }}
      >
        {/* Left panel */}
        <div
          className="bg-foreground/[0.015] dark:bg-foreground/[0.02] min-w-0"
          style={{ flex: `${sizes.inner.left} ${sizes.inner.left} 0px` }}
        >
          <LeftPanel />
        </div>

        <Handle
          direction="v"
          onPointerDown={(e) => {
            e.preventDefault()
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            const s = sizesRef.current
            dragRef.current = {
              handle: "left",
              pointerId: e.pointerId,
              startX: e.clientX,
              startY: 0,
              left: s.inner.left,
              center: s.inner.center,
              right: s.inner.right,
              middle: s.outer.middle,
              timeline: s.outer.timeline,
            }
          }}
        />

        {/* Center (preview) */}
        <div
          className="bg-background min-w-0"
          style={{ flex: `${sizes.inner.center} ${sizes.inner.center} 0px` }}
        >
          <PreviewPanel />
        </div>

        <Handle
          direction="v"
          onPointerDown={(e) => {
            e.preventDefault()
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            const s = sizesRef.current
            dragRef.current = {
              handle: "right",
              pointerId: e.pointerId,
              startX: e.clientX,
              startY: 0,
              left: s.inner.left,
              center: s.inner.center,
              right: s.inner.right,
              middle: s.outer.middle,
              timeline: s.outer.timeline,
            }
          }}
        />

        {/* Right panel */}
        <div
          className="bg-foreground/[0.015] dark:bg-foreground/[0.02] min-w-0"
          style={{ flex: `${sizes.inner.right} ${sizes.inner.right} 0px` }}
        >
          <RightPanel />
        </div>
      </div>

      <Handle
        direction="h"
        onPointerDown={(e) => {
          e.preventDefault()
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          const s = sizesRef.current
          dragRef.current = {
            handle: "timeline",
            pointerId: e.pointerId,
            startX: 0,
            startY: e.clientY,
            left: s.inner.left,
            center: s.inner.center,
            right: s.inner.right,
            middle: s.outer.middle,
            timeline: s.outer.timeline,
          }
        }}
      />

      {/* Timeline */}
      <div
        className="bg-foreground/[0.015] dark:bg-foreground/[0.02] min-h-0"
        style={{ flex: `${sizes.outer.timeline} ${sizes.outer.timeline} 0px` }}
      >
        <TimelinePanel />
      </div>
    </div>
  )
}

function Handle({
  direction,
  onPointerDown,
}: {
  direction: "v" | "h"
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <div
      className={cn(
        "group/handle relative shrink-0 transition-colors",
        direction === "v"
          ? "w-2 cursor-col-resize hover:bg-foreground/10 active:bg-foreground/20"
          : "h-2 cursor-row-resize hover:bg-foreground/10 active:bg-foreground/20"
      )}
      onPointerDown={onPointerDown}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-foreground/25 absolute rounded-full opacity-0 transition-opacity",
          "group-hover/handle:opacity-100",
          direction === "v"
            ? "h-10 w-0.5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : "h-0.5 w-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
      />
    </div>
  )
}
