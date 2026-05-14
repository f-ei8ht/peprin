// Editor layout: persisted panel sizes for the resizable layout.
//
// Layout (rough proportions, percentages):
//
//   ┌─────────────────────────────────────────┐
//   │  EditorHeader                           │  fixed
//   ├──────┬───────────────────────────┬──────┤
//   │      │                           │      │
//   │ Left │      Preview (top)        │ Right│
//   │      ├───────────────────────────┤      │
//   │      │      Timeline (bottom)    │      │
//   └──────┴───────────────────────────┴──────┘
//
// `outer.left/center/right` describes the horizontal split.
// `inner.preview/timeline` describes the vertical split inside the center.

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export interface PanelSizes {
  outer: {
    left: number
    center: number
    right: number
  }
  inner: {
    preview: number
    timeline: number
  }
}

export const DEFAULT_PANEL_SIZES: PanelSizes = {
  outer: { left: 18, center: 60, right: 22 },
  inner: { preview: 60, timeline: 40 },
}

interface PanelState {
  sizes: PanelSizes
  /** UI flags (not persisted). */
  leftCollapsed: boolean
  rightCollapsed: boolean

  setOuter: (next: PanelSizes["outer"]) => void
  setInner: (next: PanelSizes["inner"]) => void
  toggleLeft: () => void
  toggleRight: () => void
  reset: () => void
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      sizes: DEFAULT_PANEL_SIZES,
      leftCollapsed: false,
      rightCollapsed: false,

      setOuter: (next) =>
        set((state) => ({ sizes: { ...state.sizes, outer: next } })),
      setInner: (next) =>
        set((state) => ({ sizes: { ...state.sizes, inner: next } })),
      toggleLeft: () =>
        set((state) => ({ leftCollapsed: !state.leftCollapsed })),
      toggleRight: () =>
        set((state) => ({ rightCollapsed: !state.rightCollapsed })),
      reset: () =>
        set({
          sizes: DEFAULT_PANEL_SIZES,
          leftCollapsed: false,
          rightCollapsed: false,
        }),
    }),
    {
      name: "peprin:editor-panels",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sizes: state.sizes }),
      version: 1,
    }
  )
)
