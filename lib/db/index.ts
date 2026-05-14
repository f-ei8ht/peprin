// Dexie wrapper. Single source of truth for IndexedDB persistence.
//
// Tables:
//   - projects: full project records, indexed by updatedAt for fast list queries.
//   - mediaAssets: metadata for imported media, scoped by project (1.5).
//   - mediaBlobs: raw bytes for media assets, keyed by asset id (1.5).
//
// Future subphases will add:
//   - thumbnails: blob cache (1.5 — currently inlined as data URLs)
//   - autosave: snapshots (1.9)

import Dexie, { type EntityTable } from "dexie"

import type { MediaAsset } from "@/lib/media/types"
import type { ProjectRecord } from "./types"

interface MediaBlobRow {
  /** Same id as the owning MediaAsset. */
  id: string
  blob: Blob
}

class PeprinDB extends Dexie {
  projects!: EntityTable<ProjectRecord, "id">
  mediaAssets!: EntityTable<MediaAsset, "id">
  mediaBlobs!: EntityTable<MediaBlobRow, "id">

  constructor() {
    super("peprin")

    // v1: projects only (1.3).
    this.version(1).stores({
      projects: "id, name, createdAt, updatedAt",
    })

    // v2: add media tables (1.5).
    this.version(2).stores({
      projects: "id, name, createdAt, updatedAt",
      mediaAssets: "id, projectId, createdAt, kind, [projectId+createdAt]",
      mediaBlobs: "id",
    })
  }
}

let dbInstance: PeprinDB | null = null

export function getDB(): PeprinDB {
  if (typeof window === "undefined") {
    throw new Error(
      "Peprin DB is browser-only. Use a 'use client' component or guard with typeof window."
    )
  }
  if (!dbInstance) {
    dbInstance = new PeprinDB()
  }
  return dbInstance
}

/** Test helper: reset the database. Not used in production code paths. */
export async function __resetDB() {
  if (typeof window === "undefined") return
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
  await Dexie.delete("peprin")
}

export type { MediaBlobRow }
