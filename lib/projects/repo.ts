// Project repository — typed wrappers over the Dexie store.
//
// The UI layer (Zustand store, React components) talks only to this module,
// never to Dexie directly. Lets us swap or migrate persistence later without
// touching consumers.

import { nanoid } from "nanoid"

import { getDB } from "@/lib/db"
import {
  DEFAULT_PROJECT_SETTINGS,
  DEFAULT_TIMELINE,
  PROJECT_VERSION,
  type ProjectRecord,
  type ProjectSettings,
} from "@/lib/db/types"

export interface CreateProjectInput {
  name?: string
  settings?: Partial<ProjectSettings>
}

function defaultName() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  return `Untitled · ${yyyy}-${mm}-${dd}`
}

function nextSettings(input?: Partial<ProjectSettings>): ProjectSettings {
  if (!input) return { ...DEFAULT_PROJECT_SETTINGS }
  return {
    ...DEFAULT_PROJECT_SETTINGS,
    ...input,
    canvasSize: input.canvasSize ?? DEFAULT_PROJECT_SETTINGS.canvasSize,
    background: input.background ?? DEFAULT_PROJECT_SETTINGS.background,
  }
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = getDB()
  return db.projects.orderBy("updatedAt").reverse().toArray()
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  const db = getDB()
  return db.projects.get(id)
}

export async function createProject(
  input: CreateProjectInput = {}
): Promise<ProjectRecord> {
  const db = getDB()
  const now = Date.now()
  const record: ProjectRecord = {
    id: nanoid(12),
    name: input.name?.trim() || defaultName(),
    createdAt: now,
    updatedAt: now,
    settings: nextSettings(input.settings),
    timeline: { ...DEFAULT_TIMELINE, tracks: [] },
    version: PROJECT_VERSION,
  }
  await db.projects.add(record)
  return record
}

export async function renameProject(id: string, name: string): Promise<void> {
  const db = getDB()
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Project name cannot be empty")
  await db.projects.update(id, { name: trimmed, updatedAt: Date.now() })
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDB()
  await db.projects.delete(id)
}

export async function deleteProjects(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = getDB()
  await db.projects.bulkDelete(ids)
}

export async function duplicateProject(id: string): Promise<ProjectRecord> {
  const db = getDB()
  const source = await db.projects.get(id)
  if (!source) throw new Error("Project not found")
  const now = Date.now()
  const clone: ProjectRecord = {
    ...source,
    id: nanoid(12),
    name: `${source.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  }
  await db.projects.add(clone)
  return clone
}

export async function touchProject(id: string): Promise<void> {
  const db = getDB()
  await db.projects.update(id, { updatedAt: Date.now() })
}

export async function updateProjectSettings(
  id: string,
  settings: Partial<ProjectSettings>
): Promise<void> {
  const db = getDB()
  const existing = await db.projects.get(id)
  if (!existing) throw new Error("Project not found")
  await db.projects.update(id, {
    settings: { ...existing.settings, ...settings },
    updatedAt: Date.now(),
  })
}
