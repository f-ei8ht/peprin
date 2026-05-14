// Dexie wrapper. Single source of truth for IndexedDB persistence.
//
// Tables we ship now:
//   - projects: full project records, indexed by updatedAt for fast list queries.
//
// Future subphases will add:
//   - media: cached imported assets (1.5)
//   - thumbnails: blob cache (1.5)
//   - autosave: snapshots (1.9)

import Dexie, { type EntityTable } from "dexie"

import type { ProjectRecord } from "./types"

class PeprinDB extends Dexie {
  projects!: EntityTable<ProjectRecord, "id">

  constructor() {
    super("peprin")
    this.version(1).stores({
      // Primary key + secondary indexes for sorting/searching.
      projects: "id, name, createdAt, updatedAt",
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
