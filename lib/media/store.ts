// Media store — lives alongside the editor store. Owns the media list for
// the currently-open project plus an import queue with progress/errors.

import { create } from "zustand"

import * as repo from "@/lib/media/repo"
import type { MediaAsset } from "@/lib/media/types"

export type ImportStatus = "queued" | "importing" | "done" | "error"

export interface ImportTask {
  id: string
  fileName: string
  byteSize: number
  status: ImportStatus
  error?: string
  /** Asset id once the import is complete. */
  assetId?: string
}

interface MediaState {
  projectId: string | null
  assets: MediaAsset[]
  isLoaded: boolean
  isLoading: boolean

  imports: ImportTask[]

  load: (projectId: string) => Promise<void>
  reset: () => void

  importFiles: (files: FileList | File[]) => Promise<void>
  removeAsset: (id: string) => Promise<void>
  renameAsset: (id: string, name: string) => Promise<void>
  clearImports: () => void
}

let importIdCounter = 0
const nextImportId = () => `import-${Date.now().toString(36)}-${importIdCounter++}`

export const useMediaStore = create<MediaState>((set, get) => ({
  projectId: null,
  assets: [],
  isLoaded: false,
  isLoading: false,
  imports: [],

  load: async (projectId) => {
    if (get().projectId === projectId && get().isLoaded) return
    set({ projectId, isLoaded: false, isLoading: true, assets: [] })
    try {
      const assets = await repo.listProjectMedia(projectId)
      set({ assets, isLoaded: true, isLoading: false })
    } catch (error) {
      console.error("Failed to load media", error)
      set({ isLoading: false })
    }
  },

  reset: () =>
    set({
      projectId: null,
      assets: [],
      isLoaded: false,
      isLoading: false,
      imports: [],
    }),

  importFiles: async (filesLike) => {
    const projectId = get().projectId
    if (!projectId) return
    const files = Array.from(filesLike)
    if (files.length === 0) return

    const tasks: ImportTask[] = files.map((file) => ({
      id: nextImportId(),
      fileName: file.name,
      byteSize: file.size,
      status: "queued",
    }))

    set((state) => ({ imports: [...tasks, ...state.imports] }))

    for (const [index, file] of files.entries()) {
      const task = tasks[index]
      patchTask(set, task.id, { status: "importing" })

      try {
        const asset = await repo.importFile({ projectId, file })
        patchTask(set, task.id, { status: "done", assetId: asset.id })
        set((state) => ({ assets: [asset, ...state.assets] }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Couldn't import file"
        patchTask(set, task.id, { status: "error", error: message })
      }
    }
  },

  removeAsset: async (id) => {
    await repo.deleteMediaAsset(id)
    set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }))
  },

  renameAsset: async (id, name) => {
    await repo.renameMediaAsset(id, name)
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === id ? { ...a, name: name.trim() } : a
      ),
    }))
  },

  clearImports: () =>
    set((state) => ({
      imports: state.imports.filter(
        (i) => i.status !== "done" && i.status !== "error"
      ),
    })),
}))

function patchTask(
  set: (
    fn: (state: { imports: ImportTask[] }) => { imports: ImportTask[] }
  ) => void,
  id: string,
  patch: Partial<ImportTask>
) {
  set((state) => ({
    imports: state.imports.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }))
}
