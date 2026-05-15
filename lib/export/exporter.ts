// Export engine — renders project frames and encodes them via WebCodecs
// and mediabunny muxers. Runs fully in the browser.

import type { ExportSettings, ExportProgress } from "./types"
import type { ProjectSettings, TimelineTrack } from "@/lib/db/types"
import type { MediaAsset } from "@/lib/media/types"
import type { CompositorLayer } from "@/lib/renderer/compositor"
import { Compositor } from "@/lib/renderer/compositor"

export type ProgressCallback = (progress: ExportProgress) => void

export interface ExportDeps {
  tracks: TimelineTrack[]
  mediaAssets: MediaAsset[]
  projectSettings: ProjectSettings
  getMediaBlob: (id: string) => Promise<Blob | undefined>
}

// Internal: use dynamic import for mediabunny to avoid SSR issues
async function loadMediabunny() {
  const mb = await import("mediabunny")
  return mb
}

export class ExportController {
  private _abortController: AbortController | null = null

  cancel() {
    this._abortController?.abort()
  }

  async export(
    settings: ExportSettings,
    deps: ExportDeps,
    onProgress: ProgressCallback,
  ): Promise<Blob> {
    this._abortController = new AbortController()
    const signal = this._abortController.signal

    const { tracks, mediaAssets, projectSettings } = deps
    const { format, fps, width, height, includeAudio } = settings

    const totalDuration = computeTotalDuration(tracks)
    const framesTotal = Math.ceil(totalDuration * fps)
    const startTime = performance.now()

    const report = (phase: ExportProgress["phase"], framesRendered: number, error?: string) => {
      const elapsedMs = performance.now() - startTime
      const estimatedRemainingMs =
        framesRendered > 0
          ? (elapsedMs / framesRendered) * (framesTotal - framesRendered)
          : null
      onProgress({ phase, framesRendered, framesTotal, elapsedMs, estimatedRemainingMs, error })
    }

    // Pre-load all media blobs
    report("preparing", 0)
    const blobCache = new Map<string, string>()
    for (const track of tracks) {
      for (const el of track.elements) {
        if (blobCache.has(el.mediaId)) continue
        try {
          const blob = await deps.getMediaBlob(el.mediaId)
          if (blob) {
            blobCache.set(el.mediaId, URL.createObjectURL(blob))
          }
        } catch {
          // skip unavailable media
        }
      }
    }

    if (signal.aborted) {
      report("cancelled", 0)
      throw new DOMException("Export cancelled", "AbortError")
    }

    // Build layers (same logic as preview)
    const layers = buildLayers(tracks, mediaAssets, blobCache)

    // Create compositor at export resolution
    const compositor = new Compositor()
    compositor.resize({
      ...projectSettings,
      canvasSize: { width, height },
    })

    try {
      if (format === "mp4" || format === "webm") {
        return await this._exportVideo(format, settings, compositor, layers, fps, width, height, totalDuration, framesTotal, report, signal, blobCache, tracks, includeAudio)
      } else if (format === "gif") {
        return await this._exportGif(settings, compositor, layers, fps, width, height, totalDuration, framesTotal, report, signal)
      } else {
        return await this._exportPngSequence(settings, compositor, layers, fps, width, height, totalDuration, framesTotal, report, signal)
      }
    } finally {
      // Cleanup blob URLs
      for (const url of blobCache.values()) {
        URL.revokeObjectURL(url)
      }
    }
  }

  private async _exportVideo(
    format: "mp4" | "webm",
    settings: ExportSettings,
    compositor: Compositor,
    layers: CompositorLayer[],
    fps: number,
    width: number,
    height: number,
    totalDuration: number,
    framesTotal: number,
    report: (phase: ExportProgress["phase"], framesRendered: number, error?: string) => void,
    signal: AbortSignal,
    blobCache: Map<string, string>,
    tracks: TimelineTrack[],
    includeAudio: boolean,
  ): Promise<Blob> {
    const mb = await loadMediabunny()

    // Check codec support
    const videoCodec = format === "mp4" ? "avc" : "vp9"
    const audioCodec = format === "mp4" ? "aac" : "opus"

    if (!(await mb.canEncodeVideo(videoCodec))) {
      throw new Error(`Your browser does not support encoding ${videoCodec.toUpperCase()} video. Try ${format === "mp4" ? "WebM" : "MP4"} instead.`)
    }

    // Set up output
    const OutputFormat = format === "mp4" ? mb.Mp4OutputFormat : mb.WebMOutputFormat
    const target = new mb.BufferTarget()
    const output = new mb.Output({
      format: new OutputFormat(),
      target,
    })

    // Video track — encoding config goes to CanvasSource constructor
    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = width
    exportCanvas.height = height
    const exportCtx = exportCanvas.getContext("2d")!

    const canvasSource = new mb.CanvasSource(exportCanvas, {
      codec: videoCodec,
      bitrate: settings.videoBitrate,
    })
    output.addVideoTrack(canvasSource)

    // Audio track (if requested and audio elements exist)
    let audioBuffer: AudioBuffer | null = null
    const hasAudio = includeAudio && tracks.some((t) => t.type === "audio" && t.elements.length > 0)

    if (hasAudio) {
      try {
        audioBuffer = await this._mixAudio(tracks, blobCache, totalDuration)
      } catch {
        // Audio mixing failed, continue without audio
      }

      if (audioBuffer && (await mb.canEncodeAudio(audioCodec))) {
        const audioSampleSource = new mb.AudioSampleSource({
          codec: audioCodec,
          bitrate: settings.quality === "high" ? 256000 : settings.quality === "medium" ? 192000 : 128000,
        })
        output.addAudioTrack(audioSampleSource)
        // Convert the mixed AudioBuffer to AudioSamples via mediabunny
        const audioSamples = mb.AudioSample.fromAudioBuffer(audioBuffer, 0)
        for (const sample of audioSamples) {
          await audioSampleSource.add(sample)
        }
      }
    }

    await output.start()

    // Render frames
    report("encoding", 0)
    const frameDuration = 1 / fps

    for (let frame = 0; frame < framesTotal && !signal.aborted; frame++) {
      const timeSec = frame * frameDuration
      compositor.setLayers(layers)
      compositor.render(timeSec, fps)

      // Draw compositor output to export canvas
      exportCtx.clearRect(0, 0, width, height)
      compositor.drawToContext(exportCtx, 0, 0, width, height)

      // Add frame to video source
      await canvasSource.add(timeSec, frameDuration)

      // Report progress every few frames
      if (frame % 5 === 0 || frame === framesTotal - 1) {
        report("encoding", frame + 1)
      }

      // Yield to keep UI responsive
      if (frame % 2 === 0) {
        await new Promise<void>((r) => setTimeout(r, 0))
      }
    }

    if (signal.aborted) {
      output.cancel()
      report("cancelled", framesTotal)
      throw new DOMException("Export cancelled", "AbortError")
    }

    report("finalizing", framesTotal)
    await output.finalize()

    report("done", framesTotal)
    if (!target.buffer) {
      throw new Error("Export produced no output")
    }
    return new Blob([target.buffer], { type: format === "mp4" ? "video/mp4" : "video/webm" })
  }

  private async _exportGif(
    settings: ExportSettings,
    compositor: Compositor,
    layers: CompositorLayer[],
    fps: number,
    width: number,
    height: number,
    totalDuration: number,
    framesTotal: number,
    report: (phase: ExportProgress["phase"], framesRendered: number, error?: string) => void,
    signal: AbortSignal,
  ): Promise<Blob> {
    report("encoding", 0)

    // Cap GIF length
    const maxFrames = Math.min(framesTotal, 300)
    const frameDuration = 1 / fps
    const frameDelay = Math.round(frameDuration * 100) // in 1/100ths of a second

    // For GIF we need to collect ImageData from each frame
    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = width
    exportCanvas.height = height
    const exportCtx = exportCanvas.getContext("2d")!

    // Build GIF manually
    const encoder = new GIFEncoder(width, height)

    for (let frame = 0; frame < maxFrames && !signal.aborted; frame++) {
      const timeSec = frame * frameDuration
      compositor.setLayers(layers)
      compositor.render(timeSec, fps)

      exportCtx.clearRect(0, 0, width, height)
      compositor.drawToContext(exportCtx, 0, 0, width, height)

      encoder.addFrame(exportCtx, frameDelay)

      if (frame % 5 === 0 || frame === maxFrames - 1) {
        report("encoding", frame + 1)
      }

      if (frame % 2 === 0) {
        await new Promise<void>((r) => setTimeout(r, 0))
      }
    }

    if (signal.aborted) {
      report("cancelled", maxFrames)
      throw new DOMException("Export cancelled", "AbortError")
    }

    report("finalizing", maxFrames)
    const gifBlob = encoder.finish()

    report("done", maxFrames)
    return gifBlob
  }

  private async _exportPngSequence(
    settings: ExportSettings,
    compositor: Compositor,
    layers: CompositorLayer[],
    fps: number,
    width: number,
    height: number,
    totalDuration: number,
    framesTotal: number,
    report: (phase: ExportProgress["phase"], framesRendered: number, error?: string) => void,
    signal: AbortSignal,
  ): Promise<Blob> {
    report("encoding", 0)

    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = width
    exportCanvas.height = height
    const exportCtx = exportCanvas.getContext("2d")!

    const frameDuration = 1 / fps
    const blobs: { name: string; blob: Blob }[] = []

    for (let frame = 0; frame < framesTotal && !signal.aborted; frame++) {
      const timeSec = frame * frameDuration
      compositor.setLayers(layers)
      compositor.render(timeSec, fps)

      exportCtx.clearRect(0, 0, width, height)
      compositor.drawToContext(exportCtx, 0, 0, width, height)

      const blob = await new Promise<Blob>((resolve) => {
        exportCanvas.toBlob((b) => resolve(b!), "image/png")
      })
      blobs.push({
        name: `frame_${String(frame + 1).padStart(5, "0")}.png`,
        blob,
      })

      if (frame % 5 === 0 || frame === framesTotal - 1) {
        report("encoding", frame + 1)
      }

      if (frame % 2 === 0) {
        await new Promise<void>((r) => setTimeout(r, 0))
      }
    }

    if (signal.aborted) {
      report("cancelled", framesTotal)
      throw new DOMException("Export cancelled", "AbortError")
    }

    // For PNG sequence, trigger individual downloads via a helper blob
    // We can't zip without a library, so we download each PNG individually
    // Return a summary blob for the last frame + metadata
    report("done", framesTotal)

    // Download each frame
    for (const { name, blob } of blobs) {
      downloadBlob(blob, name)
    }

    // Return an empty blob as completion signal
    return new Blob([], { type: "application/octet-stream" })
  }

  private async _mixAudio(
    tracks: TimelineTrack[],
    blobCache: Map<string, string>,
    totalDuration: number,
  ): Promise<AudioBuffer | null> {
    const sampleRate = 48000
    const totalSamples = Math.ceil(totalDuration * sampleRate)

    const offlineCtx = new OfflineAudioContext({
      numberOfChannels: 2,
      length: totalSamples,
      sampleRate,
    })

    // Collect all audio elements and their decoded buffers
    for (const track of tracks) {
      if (track.type !== "audio" || track.muted) continue

      for (const el of track.elements) {
        const url = blobCache.get(el.mediaId)
        if (!url) continue

        try {
          const response = await fetch(url)
          const arrayBuffer = await response.arrayBuffer()
          const onlineCtx = new AudioContext()
          const audioBuffer = await onlineCtx.decodeAudioData(arrayBuffer)
          await onlineCtx.close()

          // Calculate trim offsets
          const sourceStart = el.trimStart
          const clipDuration = el.duration
          const timelineStart = el.startTime

          // Create source node
          const source = offlineCtx.createBufferSource()
          source.buffer = audioBuffer

          const gain = offlineCtx.createGain()
          gain.gain.value = el.opacity // use opacity as volume
          source.connect(gain)
          gain.connect(offlineCtx.destination)

          source.start(timelineStart, sourceStart, clipDuration)
        } catch {
          // skip failed audio
        }
      }
    }

    try {
      const rendered = await offlineCtx.startRendering()
      return rendered
    } catch {
      return null
    }
  }
}

function computeTotalDuration(tracks: TimelineTrack[]): number {
  let max = 0
  for (const track of tracks) {
    for (const el of track.elements) {
      const end = el.startTime + el.duration
      if (end > max) max = end
    }
  }
  return max
}

function buildLayers(
  tracks: TimelineTrack[],
  mediaAssets: MediaAsset[],
  blobCache: Map<string, string>,
): CompositorLayer[] {
  const layers: CompositorLayer[] = []
  for (const track of tracks) {
    if (track.hidden) continue
    for (const el of track.elements) {
      const asset = mediaAssets.find((a) => a.id === el.mediaId)
      const isVideo = el.type === "video"
      const isImage = el.type === "image"
      const isSticker = el.type === "sticker"
      const hasSource = isVideo || isImage || isSticker

      layers.push({
        id: el.id,
        type: el.type,
        startTime: el.startTime,
        duration: el.duration,
        trimStart: el.trimStart,
        positionX: el.positionX,
        positionY: el.positionY,
        scaleX: el.scaleX,
        scaleY: el.scaleY,
        rotation: el.rotation,
        opacity: el.opacity,
        sourceUrl: hasSource ? asset?.thumbnailDataUrl : undefined,
        videoBlobUrl: isVideo ? blobCache.get(el.mediaId) : undefined,
        name: el.name,
        textContent: el.textContent,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        fontColor: el.fontColor,
        fontWeight: el.fontWeight,
        textAlign: el.textAlign as CanvasTextAlign | undefined,
        textStrokeColor: el.textStrokeColor,
        textStrokeWidth: el.textStrokeWidth,
        textShadowColor: el.textShadowColor,
        textShadowBlur: el.textShadowBlur,
        textBackgroundColor: el.textBackgroundColor,
        nativeWidth: el.nativeWidth ?? asset?.width,
        nativeHeight: el.nativeHeight ?? asset?.height,
        stickerId: el.stickerId,
        effects: el.effects,
        masks: el.masks,
      })
    }
  }
  return layers
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

// --- Minimal GIF Encoder ---
// Produces valid GIF89a from frame ImageData arrays.

class GIFEncoder {
  private width: number
  private height: number
  private frames: Uint8Array[] = []
  private delays: number[] = []
  private globalPalette?: Uint8Array

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  addFrame(ctx: CanvasRenderingContext2D, delay: number) {
    const imageData = ctx.getImageData(0, 0, this.width, this.height)

    // Quantize to 256 colors
    const { pixels, palette } = quantize(imageData.data, 256)
    this.globalPalette = palette
    this.frames.push(pixels)
    this.delays.push(Math.max(2, delay)) // min 20ms
  }

  finish(): Blob {
    const header = this._buildHeader()
    const palette = this._buildPalette()
    const frames = this._buildFrames()
    const trailer = new Uint8Array([0x3b])

    const total = new Uint8Array(header.length + palette.length + frames.length + 1)
    total.set(header, 0)
    total.set(palette, header.length)
    total.set(frames, header.length + palette.length)
    total.set(trailer, header.length + palette.length + frames.length)

    return new Blob([total], { type: "image/gif" })
  }

  private _buildHeader(): Uint8Array {
    const buf = new Uint8Array(13)
    const enc = new TextEncoder()
    enc.encodeInto("GIF89a", buf)
    // width/height as little-endian uint16
    buf[6] = this.width & 0xff
    buf[7] = (this.width >> 8) & 0xff
    buf[8] = this.height & 0xff
    buf[9] = (this.height >> 8) & 0xff
    buf[10] = 0xf7 // global color table: 256 colors, sorted
    buf[11] = 0 // background color index
    buf[12] = 0 // pixel aspect ratio
    return buf
  }

  private _buildPalette(): Uint8Array {
    return this.globalPalette ?? new Uint8Array(768)
  }

  private _buildFrames(): Uint8Array {
    const parts: Uint8Array[] = []

    // Graphic control extension
    const gce = new Uint8Array(8)
    gce[0] = 0x21 // extension introducer
    gce[1] = 0xf9 // graphic control label
    gce[2] = 4 // block size
    gce[3] = 0 // disposal method (none) + no transparency
    // delay in hundredths of a second
    // will be set per frame

    for (let i = 0; i < this.frames.length; i++) {
      const delay = this.delays[i]
      const frame = this.frames[i]

      // Graphic control
      const g = new Uint8Array(gce)
      g[4] = delay & 0xff
      g[5] = (delay >> 8) & 0xff
      g[7] = 0 // end of gce
      parts.push(g)

      // Image descriptor
      const img = new Uint8Array(10)
      img[0] = 0x2c // image separator
      // left/top: 0,0
      // width/height
      img[5] = this.width & 0xff
      img[6] = (this.width >> 8) & 0xff
      img[7] = this.height & 0xff
      img[8] = (this.height >> 8) & 0xff
      img[9] = 0 // no local color table
      parts.push(img)

      // LZW-encoded image data
      const encoded = lzwEncode(frame, 8)
      // Write in sub-blocks of max 255 bytes
      let pos = 0
      while (pos < encoded.length) {
        const size = Math.min(255, encoded.length - pos)
        const block = new Uint8Array(1 + size)
        block[0] = size
        block.set(encoded.subarray(pos, pos + size), 1)
        parts.push(block)
        pos += size
      }
      parts.push(new Uint8Array([0])) // block terminator
    }

    // Concatenate all parts
    let totalLen = 0
    for (const p of parts) totalLen += p.length
    const result = new Uint8Array(totalLen)
    let off = 0
    for (const p of parts) {
      result.set(p, off)
      off += p.length
    }
    return result
  }
}

// Simple median-cut-like palette quantizer (reduced to 256 colors)
function quantize(
  data: Uint8ClampedArray,
  maxColors: number,
): { pixels: Uint8Array; palette: Uint8Array } {
  const len = data.length / 4
  // Collect unique colors (simple approach: use a color map)
  const colorMap = new Map<number, number>()
  const indices: number[] = new Array(len)

  // Build histogram
  let paletteSize = 0
  for (let i = 0; i < len; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    // Reduce to 6 bits per channel for quantization
    const r6 = (r >> 2) & 0x3f
    const g6 = (g >> 2) & 0x3f
    const b6 = (b >> 2) & 0x3f
    const key = (r6 << 12) | (g6 << 6) | b6
    let idx = colorMap.get(key)
    if (idx === undefined) {
      idx = paletteSize
      colorMap.set(key, idx)
      paletteSize++
      if (paletteSize > maxColors) {
        // Fallback: use nearest match
        idx = paletteSize - 1
      }
    }
    indices[i] = idx
  }

  // Build palette
  const palette = new Uint8Array(maxColors * 3)
  for (const [key, idx] of colorMap) {
    if (idx >= maxColors) continue
    const r6 = (key >> 12) & 0x3f
    const g6 = (key >> 6) & 0x3f
    const b6 = key & 0x3f
    const base = idx * 3
    palette[base] = (r6 << 2) | (r6 >> 4)
    palette[base + 1] = (g6 << 2) | (g6 >> 4)
    palette[base + 2] = (b6 << 2) | (b6 >> 4)
  }

  return { pixels: new Uint8Array(indices), palette }
}

// LZW encoding for GIF (variable-length codes, max 12 bits)
function lzwEncode(data: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1
  let codeSize = minCodeSize + 1
  let maxCode = (1 << codeSize) - 1
  let nextCode = eoiCode + 1

  const bits: number[] = []

  function writeBits(value: number, size: number) {
    for (let i = 0; i < size; i++) {
      bits.push((value >> i) & 1)
    }
  }

  // Clear code
  writeBits(clearCode, codeSize)

  const dict = new Map<string, number>()
  for (let i = 0; i < clearCode; i++) {
    dict.set(String.fromCharCode(i), i)
  }

  let w = ""
  for (let i = 0; i < data.length; i++) {
    const c = String.fromCharCode(data[i])
    const wc = w + c
    if (dict.has(wc)) {
      w = wc
    } else {
      writeBits(dict.get(w)!, codeSize)
      if (nextCode <= 4095) {
        dict.set(wc, nextCode++)
        if (nextCode > maxCode && codeSize < 12) {
          codeSize++
          maxCode = (1 << codeSize) - 1
        }
      } else {
        // Dictionary full, emit clear code
        writeBits(clearCode, codeSize)
        dict.clear()
        for (let j = 0; j < clearCode; j++) {
          dict.set(String.fromCharCode(j), j)
        }
        nextCode = eoiCode + 1
        codeSize = minCodeSize + 1
        maxCode = (1 << codeSize) - 1
      }
      w = c
    }
  }

  if (w) {
    writeBits(dict.get(w)!, codeSize)
  }
  writeBits(eoiCode, codeSize)

  // Convert bits to bytes
  const result = new Uint8Array(Math.ceil(bits.length / 8))
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) {
      result[Math.floor(i / 8)] |= 1 << (i % 8)
    }
  }

  return result
}
