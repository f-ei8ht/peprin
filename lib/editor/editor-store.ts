// Editor runtime state — what's open, save status, and current selection.
// The actual project document lives in IndexedDB; this tracks the in-memory
// view so the editor surface can react instantly while writes happen async.

import { create } from "zustand"

import type { ProjectRecord } from "@/lib/db/types"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

export type LeftTab = "media" | "audio" | "text" | "stickers" | "effects" | "masks" | "subtitles" | "avatars"
export type RightTab = "inspector" | "settings" | "heygen"

interface EditorState {
  project: ProjectRecord | null
  saveStatus: SaveStatus
  saveError: string | null
  lastSavedAt: number | null

  selectedClipIds: Set<string>
  leftTab: LeftTab
  rightTab: RightTab
  shortcutsDialogOpen: boolean

  // Actions
  setProject: (project: ProjectRecord | null) => void
  patchProject: (patch: Partial<ProjectRecord>) => void
  setSaveStatus: (status: SaveStatus, error?: string | null) => void
  markSaved: (timestamp?: number) => void

  setLeftTab: (tab: LeftTab) => void
  setRightTab: (tab: RightTab) => void
  setSelectedClips: (ids: Iterable<string>) => void
  clearSelection: () => void
  setShortcutsDialogOpen: (open: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  project: null,
  saveStatus: "idle",
  saveError: null,
  lastSavedAt: null,

  selectedClipIds: new Set(),
  leftTab: "media",
  rightTab: "inspector",
  shortcutsDialogOpen: false,

  setProject: (project) =>
    set({
      project,
      saveStatus: "idle",
      saveError: null,
      lastSavedAt: project?.updatedAt ?? null,
      selectedClipIds: new Set(),
    }),
  patchProject: (patch) =>
    set((state) =>
      state.project
        ? {
            project: { ...state.project, ...patch, updatedAt: Date.now() },
            saveStatus: "saving",
          }
        : state
    ),
  setSaveStatus: (status, error = null) => set({ saveStatus: status, saveError: error }),
  markSaved: (timestamp = Date.now()) =>
    set({ saveStatus: "saved", saveError: null, lastSavedAt: timestamp }),

  setLeftTab: (tab) => set({ leftTab: tab }),
  setRightTab: (tab) => set({ rightTab: tab }),
  setSelectedClips: (ids) => set({ selectedClipIds: new Set(ids) }),
  clearSelection: () => set({ selectedClipIds: new Set() }),
  setShortcutsDialogOpen: (open) => set({ shortcutsDialogOpen: open }),
}))
