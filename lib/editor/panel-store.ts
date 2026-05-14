// Editor layout: persisted panel sizes for the resizable layout.
//
// Layout (rough proportions, percentages):
//
//   ┌─────────────────────────────────────────┐
//   │  EditorHeader                           │  fixed
//   ├──────┬───────────────────────────┬──────┤
//   │      │                           │      │
//   │ Left │     Preview (top)         │ Right│   <- middle row (horizontal split)
//   │      │                           │      │
//   ├──────┴───────────────────────────┴──────┤
//   │     Timeline (full-width, bottom)       │   <- timeline row (vertical split)
//   └─────────────────────────────────────────┘
//
// `outer.middle/timeline` describes the vertical split (preview row vs timeline).
// `inner.left/center/right` describes the horizontal split inside the middle row.

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export interface PanelSizes {
  outer: {
    middle: number
    timeline: number
  }
  inner: {
    left: number
    center: number
    right: number
  }
}

export const DEFAULT_PANEL_SIZES: PanelSizes = {
  outer: { middle: 65, timeline: 35 },
  inner: { left: 24, center: 48, right: 28 },
}

/** Quick layout presets surfaced in the editor header. */
export const LAYOUT_PRESETS = {
  balanced: {
    label: "Balanced",
    description: "Equal preview and timeline space.",
    sizes: {
      outer: { middle: 60, timeline: 40 },
      inner: { left: 24, center: 48, right: 28 },
    },
  },
  preview: {
    label: "Preview",
    description: "Big preview, slim timeline.",
    sizes: {
      outer: { middle: 78, timeline: 22 },
      inner: { left: 18, center: 60, right: 22 },
    },
  },
  timeline: {
    label: "Timeline",
    description: "Tall timeline for finer edits.",
    sizes: {
      outer: { middle: 48, timeline: 52 },
      inner: { left: 24, center: 48, right: 28 },
    },
  },
  cinema: {
    label: "Cinema",
    description: "Hide chrome — focus on the canvas.",
    sizes: {
      outer: { middle: 92, timeline: 8 },
      inner: { left: 14, center: 72, right: 14 },
    },
  },
} as const

export type LayoutPresetId = keyof typeof LAYOUT_PRESETS

interface PanelState {
  sizes: PanelSizes
  /** Bumped every time the layout is reset/applied via a preset, so the
   *  Group can be re-keyed and pick up the new defaultSizes. */
  revision: number
  /** UI flags (not persisted). */
  leftCollapsed: boolean
  rightCollapsed: boolean

  setOuter: (next: PanelSizes["outer"]) => void
  setInner: (next: PanelSizes["inner"]) => void
  toggleLeft: () => void
  toggleRight: () => void
  applyPreset: (id: LayoutPresetId) => void
  reset: () => void
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      sizes: DEFAULT_PANEL_SIZES,
      revision: 0,
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
      applyPreset: (id) =>
        set((state) => ({
          sizes: {
            outer: { ...LAYOUT_PRESETS[id].sizes.outer },
            inner: { ...LAYOUT_PRESETS[id].sizes.inner },
          },
          revision: state.revision + 1,
          leftCollapsed: false,
          rightCollapsed: false,
        })),
      reset: () =>
        set((state) => ({
          sizes: DEFAULT_PANEL_SIZES,
          revision: state.revision + 1,
          leftCollapsed: false,
          rightCollapsed: false,
        })),
    }),
    {
      name: "peprin:editor-panels",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sizes: state.sizes }),
      // Bump this whenever DEFAULT_PANEL_SIZES or LAYOUT_PRESETS change so
      // users see the new defaults instead of being stuck with old saved sizes.
      version: 4,
      migrate: () => ({ sizes: DEFAULT_PANEL_SIZES }),
    }
  )
)
