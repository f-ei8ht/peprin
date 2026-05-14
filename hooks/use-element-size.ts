"use client"

import * as React from "react"

export interface ElementSize {
  width: number
  height: number
}

/**
 * Tracks the content-box size of a DOM element via ResizeObserver.
 * Returns 0/0 until the element measures.
 */
export function useElementSize<T extends HTMLElement>(
  ref: React.RefObject<T | null>
): ElementSize {
  const [size, setSize] = React.useState<ElementSize>({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const update = () => {
      const rect = node.getBoundingClientRect()
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height }
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return size
}
