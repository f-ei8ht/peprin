// Inspect imported media (duration, dimensions, fps, audio specs) and
// generate a small poster thumbnail when there's a video frame to grab.
//
// All work happens in the browser via mediabunny; nothing is uploaded.

import {
  ALL_FORMATS,
  BlobSource,
  CanvasSink,
  Input,
  type WrappedCanvas,
} from "mediabunny"

import { detectKind, type MediaKind } from "./types"

const THUMB_MAX_DIMENSION = 320

export interface ProbeResult {
  kind: MediaKind
  durationSec: number
  width?: number
  height?: number
  fps?: number
  sampleRate?: number
  channelCount?: number
  /** PNG data URL, around 320px on the long edge. Optional. */
  thumbnailDataUrl?: string
}

/**
 * Inspect a file and return a metadata snapshot. Falls back gracefully if
 * mediabunny can't decode the file (e.g. unknown image type) — still emits
 * a thumbnail for images by drawing the bitmap onto a canvas.
 */
export async function probeFile(file: File): Promise<ProbeResult> {
  const kind = detectKind(file.type) ?? guessKindFromName(file.name)
  if (!kind) throw new Error("Unsupported file type")

  if (kind === "image") {
    return probeImage(file)
  }

  return probeMedia(file, kind)
}

function guessKindFromName(name: string): MediaKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (
    ["mp4", "mov", "webm", "mkv", "m4v", "avi", "ts"].includes(ext)
  )
    return "video"
  if (
    ["mp3", "wav", "m4a", "ogg", "flac", "aac", "opus"].includes(ext)
  )
    return "audio"
  if (
    ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"].includes(ext)
  )
    return "image"
  return null
}

async function probeImage(file: File): Promise<ProbeResult> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    return { kind: "image", durationSec: 0 }
  }
  try {
    const thumbnail = await drawThumbnail(bitmap, bitmap.width, bitmap.height)
    return {
      kind: "image",
      durationSec: 0,
      width: bitmap.width,
      height: bitmap.height,
      thumbnailDataUrl: thumbnail,
    }
  } finally {
    bitmap.close?.()
  }
}

async function probeMedia(file: File, kind: MediaKind): Promise<ProbeResult> {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  })

  try {
    const canRead = await input.canRead().catch(() => false)
    if (!canRead) {
      return { kind, durationSec: 0 }
    }

    const durationSec =
      (await input.getDurationFromMetadata().catch(() => null)) ??
      (await input.computeDuration().catch(() => 0))

    let width: number | undefined
    let height: number | undefined
    let fps: number | undefined
    let thumbnailDataUrl: string | undefined

    const videoTrack = await input.getPrimaryVideoTrack().catch(() => null)
    if (videoTrack) {
      width = await videoTrack.getDisplayWidth().catch(() => undefined)
      height = await videoTrack.getDisplayHeight().catch(() => undefined)
      fps = await safeComputeFps(videoTrack)
      thumbnailDataUrl = await captureThumbnail(videoTrack)
    }

    let sampleRate: number | undefined
    let channelCount: number | undefined
    const audioTrack = await input.getPrimaryAudioTrack().catch(() => null)
    if (audioTrack) {
      sampleRate = await audioTrack.getSampleRate().catch(() => undefined)
      channelCount = await audioTrack
        .getNumberOfChannels()
        .catch(() => undefined)
    }

    return {
      kind,
      durationSec,
      width,
      height,
      fps,
      sampleRate,
      channelCount,
      thumbnailDataUrl,
    }
  } finally {
    input.dispose()
  }
}

async function safeComputeFps(
  track: Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>
): Promise<number | undefined> {
  if (!track) return undefined
  try {
    const stats = await track.computePacketStats(60)
    const rate = stats?.averagePacketRate
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      return Math.round(rate * 100) / 100
    }
  } catch {}
  return undefined
}

async function captureThumbnail(
  track: Awaited<ReturnType<Input["getPrimaryVideoTrack"]>>
): Promise<string | undefined> {
  if (!track) return undefined
  try {
    const sink = new CanvasSink(track, {
      width: THUMB_MAX_DIMENSION,
      fit: "contain",
    })
    // Try a few timestamps in case the very first frame is black.
    const candidates = [1.0, 0.5, 0.25, 0]
    for (const ts of candidates) {
      const wrapped = (await sink.getCanvas(ts).catch(() => null)) as
        | WrappedCanvas
        | null
      if (!wrapped) continue
      const url = canvasToDataUrl(wrapped.canvas)
      if (url) return url
    }
  } catch {}
  return undefined
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement | OffscreenCanvas
): string | undefined {
  if (canvas instanceof HTMLCanvasElement) {
    try {
      return canvas.toDataURL("image/jpeg", 0.78)
    } catch {
      return undefined
    }
  }
  // OffscreenCanvas can't directly produce a data URL. Re-draw onto a
  // regular canvas. We accept the small re-paint cost since this only runs
  // once per imported asset.
  const target = document.createElement("canvas")
  target.width = canvas.width
  target.height = canvas.height
  const ctx = target.getContext("2d")
  if (!ctx) return undefined
  // OffscreenCanvas isn't directly drawable on 2D context in older browsers,
  // but modern Chrome/Firefox/Safari accept it.
  ctx.drawImage(canvas as unknown as CanvasImageSource, 0, 0)
  try {
    return target.toDataURL("image/jpeg", 0.78)
  } catch {
    return undefined
  }
}

async function drawThumbnail(
  source: CanvasImageSource,
  width: number,
  height: number
): Promise<string | undefined> {
  const scale = Math.min(THUMB_MAX_DIMENSION / Math.max(width, height), 1)
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return undefined
  ctx.drawImage(source, 0, 0, w, h)
  try {
    return canvas.toDataURL("image/jpeg", 0.78)
  } catch {
    return undefined
  }
}
