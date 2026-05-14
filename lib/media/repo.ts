// Media repository — typed wrappers around the media tables in IndexedDB.
//
// Two tables are involved:
//   - mediaAssets: lightweight metadata (queryable, fast list)
//   - mediaBlobs:  raw bytes (one row per asset, lazily loaded)

import { nanoid } from "nanoid"

import { getDB } from "@/lib/db"
import { probeFile } from "@/lib/media/probe"
import { MEDIA_VERSION, type MediaAsset } from "@/lib/media/types"

export interface ImportFileOptions {
  projectId: string
  file: File
}

export async function importFile({
  projectId,
  file,
}: ImportFileOptions): Promise<MediaAsset> {
  const db = getDB()
  const id = nanoid(14)
  const probe = await probeFile(file)
  const asset: MediaAsset = {
    id,
    projectId,
    name: file.name,
    kind: probe.kind,
    mimeType: file.type || guessMime(file.name, probe.kind),
    byteSize: file.size,
    durationSec: probe.durationSec,
    width: probe.width,
    height: probe.height,
    fps: probe.fps,
    sampleRate: probe.sampleRate,
    channelCount: probe.channelCount,
    thumbnailDataUrl: probe.thumbnailDataUrl,
    createdAt: Date.now(),
    version: MEDIA_VERSION,
  }

  await db.transaction(
    "rw",
    db.mediaAssets,
    db.mediaBlobs,
    async () => {
      await db.mediaAssets.add(asset)
      await db.mediaBlobs.add({ id, blob: file })
    }
  )
  return asset
}

export async function listProjectMedia(projectId: string): Promise<MediaAsset[]> {
  const db = getDB()
  return db.mediaAssets
    .where("[projectId+createdAt]")
    .between([projectId, 0], [projectId, Number.MAX_SAFE_INTEGER])
    .reverse()
    .toArray()
}

export async function getMediaAsset(id: string): Promise<MediaAsset | undefined> {
  const db = getDB()
  return db.mediaAssets.get(id)
}

export async function getMediaBlob(id: string): Promise<Blob | undefined> {
  const db = getDB()
  const row = await db.mediaBlobs.get(id)
  return row?.blob
}

export async function renameMediaAsset(id: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Name cannot be empty")
  const db = getDB()
  await db.mediaAssets.update(id, { name: trimmed })
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const db = getDB()
  await db.transaction("rw", db.mediaAssets, db.mediaBlobs, async () => {
    await db.mediaAssets.delete(id)
    await db.mediaBlobs.delete(id)
  })
}

export async function deleteProjectMedia(projectId: string): Promise<void> {
  const db = getDB()
  const ids = await db.mediaAssets
    .where("projectId")
    .equals(projectId)
    .primaryKeys()
  if (ids.length === 0) return
  await db.transaction("rw", db.mediaAssets, db.mediaBlobs, async () => {
    await db.mediaAssets.bulkDelete(ids)
    await db.mediaBlobs.bulkDelete(ids)
  })
}

function guessMime(name: string, kind: MediaAsset["kind"]): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (kind === "video") {
    if (ext === "webm") return "video/webm"
    if (ext === "mov") return "video/quicktime"
    if (ext === "mkv") return "video/x-matroska"
    return "video/mp4"
  }
  if (kind === "audio") {
    if (ext === "mp3") return "audio/mpeg"
    if (ext === "wav") return "audio/wav"
    if (ext === "flac") return "audio/flac"
    if (ext === "ogg") return "audio/ogg"
    return "audio/mp4"
  }
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  if (ext === "gif") return "image/gif"
  if (ext === "avif") return "image/avif"
  return "image/jpeg"
}
