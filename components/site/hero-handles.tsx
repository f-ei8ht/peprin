"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface HeroHandlesProps {
  children: React.ReactNode
  className?: string
}

const MIN_GAP = 64
const PADDING = 12

/**
 * A draggable in/out range that masks the highlighted text. Inspired by
 * timeline trim handles — drag either pill to scrub the visible window.
 */
export function HeroHandles({ children, className }: HeroHandlesProps) {
  const containerRef = React.useRef<HTMLSpanElement>(null)
  const [width, setWidth] = React.useState(0)
  const [left, setLeft] = React.useState(0)
  const [right, setRight] = React.useState(0)
  const widthRef = React.useRef(0)
  const leftRef = React.useRef(0)
  const rightRef = React.useRef(0)

  const dragRef = React.useRef<{
    side: "left" | "right" | null
    startX: number
    initial: number
    pointerId: number | null
  }>({ side: null, startX: 0, initial: 0, pointerId: null })

  React.useLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return
    const update = () => {
      const w = node.offsetWidth
      setWidth(w)
      setRight(w)
    }
    const observer = new ResizeObserver(update)
    observer.observe(node)
    update()
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    widthRef.current = width
    leftRef.current = left
    rightRef.current = right
  }, [width, left, right])

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag.side) return
      if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return

      const dx = e.clientX - drag.startX
      const w = widthRef.current
      if (drag.side === "left") {
        const next = Math.max(
          0,
          Math.min(rightRef.current - MIN_GAP, drag.initial + dx)
        )
        setLeft(next)
      } else {
        const next = Math.max(
          leftRef.current + MIN_GAP,
          Math.min(w, drag.initial + dx)
        )
        setRight(next)
      }
    }
    const onEnd = (e: PointerEvent) => {
      const drag = dragRef.current
      if (drag.pointerId !== null && e.pointerId !== drag.pointerId) return
      drag.side = null
      drag.pointerId = null
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onEnd)
    window.addEventListener("pointercancel", onEnd)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onEnd)
      window.removeEventListener("pointercancel", onEnd)
    }
  }, [])

  const measured = width > 0
  const leftPct = measured ? (left / width) * 100 : 0
  const rightPct = measured ? (right / width) * 100 : 100

  const mask = measured
    ? `linear-gradient(90deg,
        transparent 0%,
        transparent ${leftPct}%,
        #000 ${leftPct}%,
        #000 ${rightPct}%,
        transparent ${rightPct}%,
        transparent 100%)`
    : undefined

  return (
    <span
      ref={containerRef}
      className={cn(
        "relative inline-flex select-none items-center px-3",
        className
      )}
    >
      {/* Frame */}
      <span
        aria-hidden="true"
        className="border-primary/60 pointer-events-none absolute inset-y-1 left-0 right-0 rounded-2xl border-2 border-dashed"
      />

      {/* Left handle */}
      <button
        type="button"
        aria-label="Drag start handle"
        className={cn(
          "bg-background border-primary/80 absolute z-10 flex h-[80%] w-7 cursor-ew-resize items-center justify-center rounded-full border-2 shadow",
          "touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
        style={{ transform: `translateX(${left - PADDING}px)` }}
        onPointerDown={(e) => {
          e.preventDefault()
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          dragRef.current = {
            side: "left",
            startX: e.clientX,
            initial: leftRef.current,
            pointerId: e.pointerId,
          }
        }}
      >
        <span className="bg-primary h-6 w-1 rounded-full" />
      </button>

      {/* Right handle */}
      <button
        type="button"
        aria-label="Drag end handle"
        className={cn(
          "bg-background border-primary/80 absolute z-10 flex h-[80%] w-7 cursor-ew-resize items-center justify-center rounded-full border-2 shadow",
          "touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
        style={
          measured
            ? { left: 0, transform: `translateX(${right - PADDING}px)` }
            : { right: 0 }
        }
        onPointerDown={(e) => {
          e.preventDefault()
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          dragRef.current = {
            side: "right",
            startX: e.clientX,
            initial: rightRef.current,
            pointerId: e.pointerId,
          }
        }}
      >
        <span className="bg-primary h-6 w-1 rounded-full" />
      </button>

      {/* Masked label */}
      <span
        className="relative inline-block px-3 will-change-auto"
        style={{ WebkitMask: mask, mask }}
      >
        {children}
      </span>
    </span>
  )
}
