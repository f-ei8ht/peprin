"use client"

import { useSyncExternalStore } from "react"

const noopSubscribe = () => () => {}

/** Returns `true` after hydration. False during SSR. */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}
