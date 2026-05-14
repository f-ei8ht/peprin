"use client"

import { useEffect, useState } from "react"

/** Subscribes to a CSS media query and returns the current match value. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)")
}
