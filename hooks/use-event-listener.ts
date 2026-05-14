"use client"

import { useEffect, useRef } from "react"

type Target = Window | Document | HTMLElement | null

/** Adds an event listener that always uses the latest handler. */
export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: { target?: Target; capture?: boolean; passive?: boolean }
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const target = options?.target ?? (typeof window !== "undefined" ? window : null)
    if (!target) return

    const listener = (event: Event) =>
      handlerRef.current(event as WindowEventMap[K])

    target.addEventListener(type, listener, {
      capture: options?.capture,
      passive: options?.passive,
    })
    return () => target.removeEventListener(type, listener, options?.capture)
  }, [type, options?.target, options?.capture, options?.passive])
}
