// Playback store — reactive Zustand slice that mirrors the PlaybackManager
// for React components that need to subscribe to playback state.

import { create } from "zustand"

export interface PlaybackState {
  playing: boolean
  currentTime: number // seconds
  duration: number // seconds
  isScrubbing: boolean
}

interface PlaybackActions {
  setPlaying: (v: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setScrubbing: (v: boolean) => void
  sync: (state: Partial<PlaybackState>) => void
}

export const usePlaybackStore = create<PlaybackState & PlaybackActions>((set) => ({
  playing: false,
  currentTime: 0,
  duration: 0,
  isScrubbing: false,

  setPlaying: (playing) => set({ playing }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setScrubbing: (isScrubbing) => set({ isScrubbing }),
  sync: (state) => set(state),
}))
