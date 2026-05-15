// Projects store — UI state + thin wrapper over the repo.
//
// We deliberately keep persistence in IndexedDB (the repo) and only mirror
// state needed by the dashboard here.

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import * as repo from "@/lib/projects/repo"
import type {
  ProjectRecord,
  ProjectSortKey,
  SortOrder,
} from "@/lib/db/types"
import type { CreateProjectInput } from "@/lib/projects/repo"

export type ProjectsViewMode = "grid" | "list"

interface ProjectsState {
  // Data
  projects: ProjectRecord[]
  isLoaded: boolean
  isLoading: boolean
  error: string | null

  // View prefs (persisted)
  viewMode: ProjectsViewMode
  sortKey: ProjectSortKey
  sortOrder: SortOrder
  searchQuery: string

  // Selection (ephemeral)
  selectedIds: Set<string>

  // Actions
  load: () => Promise<void>
  reload: () => Promise<void>
  create: (input?: CreateProjectInput) => Promise<ProjectRecord>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  removeMany: (ids: string[]) => Promise<void>
  duplicate: (id: string) => Promise<ProjectRecord>

  setViewMode: (mode: ProjectsViewMode) => void
  setSortKey: (key: ProjectSortKey) => void
  setSortOrder: (order: SortOrder) => void
  toggleSortOrder: () => void
  setSearchQuery: (q: string) => void

  toggleSelected: (id: string) => void
  setSelected: (ids: Iterable<string>) => void
  clearSelection: () => void
}

const PERSIST_KEY = "peprin:projects-view"

interface PersistedState {
  viewMode: ProjectsViewMode
  sortKey: ProjectSortKey
  sortOrder: SortOrder
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      isLoaded: false,
      isLoading: false,
      error: null,

      viewMode: "grid",
      sortKey: "updatedAt",
      sortOrder: "desc",
      searchQuery: "",

      selectedIds: new Set(),

      load: async () => {
        if (get().isLoading) return
        set({ isLoading: true, error: null })
        try {
          const projects = await repo.listProjects()
          set({ projects, isLoaded: true, isLoading: false })
        } catch (e) {
          set({
            error: (e as Error).message,
            isLoading: false,
          })
        }
      },

      reload: async () => {
        try {
          const projects = await repo.listProjects()
          set({ projects })
        } catch (e) {
          set({ error: (e as Error).message })
        }
      },

      create: async (input) => {
        const project = await repo.createProject(input)
        set((state) => ({ projects: [project, ...state.projects] }))
        return project
      },

      rename: async (id, name) => {
        await repo.renameProject(id, name)
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, name: name.trim(), updatedAt: Date.now() } : p
          ),
        }))
      },

      remove: async (id) => {
        await repo.deleteProject(id)
        set((state) => {
          const next = new Set(state.selectedIds)
          next.delete(id)
          return {
            projects: state.projects.filter((p) => p.id !== id),
            selectedIds: next,
          }
        })
      },

      removeMany: async (ids) => {
        await repo.deleteProjects(ids)
        const set_ = new Set(ids)
        set((state) => ({
          projects: state.projects.filter((p) => !set_.has(p.id)),
          selectedIds: new Set(),
        }))
      },

      duplicate: async (id) => {
        const clone = await repo.duplicateProject(id)
        set((state) => ({ projects: [clone, ...state.projects] }))
        return clone
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setSortKey: (key) => set({ sortKey: key }),
      setSortOrder: (order) => set({ sortOrder: order }),
      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
        })),
      setSearchQuery: (q) => set({ searchQuery: q }),

      toggleSelected: (id) =>
        set((state) => {
          const next = new Set(state.selectedIds)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return { selectedIds: next }
        }),
      setSelected: (ids) => set({ selectedIds: new Set(ids) }),
      clearSelection: () => set({ selectedIds: new Set() }),
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        viewMode: state.viewMode,
        sortKey: state.sortKey,
        sortOrder: state.sortOrder,
      }),
    }
  )
)
