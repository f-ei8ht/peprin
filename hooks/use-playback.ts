"use client"

import * as React from "react"

import { getPlaybackManager, resetPlaybackManager } from "@/lib/editor/playback"
import { usePlaybackStore } from "@/lib/editor/playback-store"
import { Compositor } from "@/lib/renderer/compositor"
import type { ProjectSettings } from "@/lib/db/types"

/**
 * Initializes and returns the playback manager and compositor for the
 * current editor session. Handles cleanup on unmount.
 */
export function usePlayback(settings: ProjectSettings | undefined) {
  const playback = React.useMemo(() => getPlaybackManager(), [])
  const compositor = React.useMemo(() => new Compositor(), [])
  const sync = usePlaybackStore((s) => s.sync)

  // Configure playback when project settings change
  React.useEffect(() => {
    if (!settings) return
    playback.setFps(settings.fps)
    compositor.resize(settings)
    compositor.invalidate()
  }, [settings, playback, compositor])

  // Subscribe to playback events → sync to Zustand for React components
  React.useEffect(() => {
    const unsub = playback.subscribe(() => {
      sync({
        playing: playback.playing,
        currentTime: playback.currentTime,
        duration: playback.duration,
        isScrubbing: playback.isScrubbing,
      })
    })
    return unsub
  }, [playback, sync])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      resetPlaybackManager()
    }
  }, [])

  return { playback, compositor }
}
