"use client"

import { useCallback, useState } from "react"

/** Copy a string to the clipboard with a brief "copied" flag. */
export function useClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), timeout)
        return true
      } catch {
        setCopied(false)
        return false
      }
    },
    [timeout]
  )

  return { copy, copied }
}
