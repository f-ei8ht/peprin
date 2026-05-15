// Canvas2D compositor — renders the project state to an OffscreenCanvas.
//
// Renders at the project's native resolution (e.g. 1920×1080). The host
// preview panel scales the output canvas via CSS for display.

import type { ProjectSettings } from "@/lib/db/types"
import type { ClipEffect } from "@/lib/effects/types"
import type { ClipMask } from "@/lib/masks/types"
import { buildCanvasFilter } from "@/lib/effects/renderer"
import { applyMaskToContext } from "@/lib/masks/renderer"

export interface CompositorLayer {
  id: string
  type: "video" | "image" | "audio" | "text" | "sticker" | "subtitle"
  startTime: number
  duration: number
  trimStart: number
  positionX: number
  positionY: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  /** URL or data URL to render. For images: the source. For video: a frame or thumbnail. */
  sourceUrl?: string
  /** Blob URL for video playback (seeks to correct frame during render). */
  videoBlobUrl?: string
  name: string
  /** Text-specific params */
  textContent?: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  fontWeight?: string
  textAlign?: CanvasTextAlign
  textStrokeColor?: string
  textStrokeWidth?: number
  textShadowColor?: string
  textShadowBlur?: number
  textBackgroundColor?: string
  /** Native dimensions of the source media (for proper scaling) */
  nativeWidth?: number
  nativeHeight?: number
  /** Effects applied to this layer */
  effects?: ClipEffect[]
  /** Masks applied to this layer */
  masks?: ClipMask[]
}

export class Compositor {
  private _canvas: OffscreenCanvas | null = null
  private _ctx: OffscreenCanvasRenderingContext2D | null = null
  private _width = 0
  private _height = 0
  private _bgColor = "#000000"
  private _lastFrame = -1
  private _layers: CompositorLayer[] = []
  private _imageCache = new Map<string, ImageBitmap | HTMLImageElement>()
  private _videoCache = new Map<string, HTMLVideoElement>()
  private _videoMetadataCache = new Map<string, { width: number; height: number }>()

  get width() {
    return this._width
  }
  get height() {
    return this._height
  }

  /** Resize the compositor to match project canvas size. */
  resize(settings: ProjectSettings) {
    const { width, height } = settings.canvasSize
    this._bgColor =
      settings.background.type === "color"
        ? settings.background.color
        : "#000000"

    if (width === this._width && height === this._height && this._canvas) return

    this._width = width
    this._height = height
    this._canvas = new OffscreenCanvas(width, height)
    this._ctx = this._canvas.getContext("2d")
    this._lastFrame = -1
    this._imageCache.clear()
    this._disposeVideos()
  }

  /** Set the layers to composite for the current frame. */
  setLayers(layers: CompositorLayer[]) {
    this._layers = layers
  }

  /** Render a frame at the given time (seconds). Returns true if the frame was drawn. */
  render(timeSec: number, fps: number): boolean {
    if (!this._ctx || !this._canvas) return false

    const frameNum = Math.round(timeSec * fps)
    if (frameNum === this._lastFrame) return false
    this._lastFrame = frameNum

    const ctx = this._ctx
    const w = this._width
    const h = this._height

    // 1. Clear with background color
    ctx.fillStyle = this._bgColor
    ctx.fillRect(0, 0, w, h)

    // 2. Draw subtle grid (editor-only visual aid)
    if (this._layers.length === 0) {
      this._drawGrid(ctx, w, h)
    }

    // 3. Draw layers (clips visible at current time)
    for (const layer of this._layers) {
      const layerEnd = layer.startTime + layer.duration
      if (timeSec < layer.startTime || timeSec > layerEnd) continue
      this._drawLayer(ctx, layer, w, h, timeSec)
    }

    // 4. Timecode watermark
    this._drawTimecode(ctx, timeSec, w)

    return true
  }

  /** Get the output canvas for mounting in the DOM. */
  getOutputCanvas(): HTMLCanvasElement | null {
    if (!this._canvas) return null
    const out = document.createElement("canvas")
    out.width = this._width
    out.height = this._height
    const outCtx = out.getContext("2d")
    if (outCtx) {
      outCtx.drawImage(this._canvas, 0, 0)
    }
    return out
  }

  /** Draw the current frame directly onto an existing canvas context. */
  drawToContext(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) {
    if (!this._canvas) return
    ctx.drawImage(this._canvas, 0, 0, this._width, this._height, dx, dy, dw, dh)
  }

  /** Force a redraw on the next render() call. */
  invalidate() {
    this._lastFrame = -1
  }

  // --- Internal helpers ---

  private _drawLayer(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: CompositorLayer,
    _w: number,
    _h: number,
    timeSec: number
  ) {
    ctx.save()
    ctx.globalAlpha = layer.opacity

    // Apply masks first
    if (layer.masks && layer.masks.length > 0) {
      for (const mask of layer.masks) {
        if (mask.enabled) {
          applyMaskToContext(ctx, mask, _w, _h)
        }
      }
    }

    // Apply effects via CSS filter
    if (layer.effects && layer.effects.length > 0) {
      const filter = buildCanvasFilter(layer.effects)
      if (filter) {
        ctx.filter = filter
      }
    }

    // Position and transform
    const cx = _w / 2 + layer.positionX
    const cy = _h / 2 + layer.positionY

    ctx.translate(cx, cy)
    if (layer.rotation !== 0) {
      ctx.rotate((layer.rotation * Math.PI) / 180)
    }
    ctx.scale(layer.scaleX, layer.scaleY)

    // Video playback: seek and draw frame
    if (layer.type === "video" && layer.videoBlobUrl) {
      const { rw, rh } = this._computeRenderSize(layer, _w, _h)
      this._drawVideoFrame(ctx, layer, layer.videoBlobUrl, rw, rh, timeSec)
      ctx.restore()
      return
    }

    // Image layer
    if (layer.type === "image" && layer.sourceUrl) {
      const { rw, rh } = this._computeRenderSize(layer, _w, _h)
      const cached = this._imageCache.get(layer.sourceUrl)
      if (cached) {
        ctx.drawImage(cached, -rw / 2, -rh / 2, rw, rh)
      } else {
        this._loadImage(layer.sourceUrl)
        this._drawPlaceholder(ctx, layer, rw, rh)
      }
      ctx.restore()
      return
    }

    // Text layer
    if (layer.type === "text") {
      this._drawText(ctx, layer, _w, _h)
      ctx.restore()
      return
    }

    // Sticker layer
    if (layer.type === "sticker" && layer.sourceUrl) {
      const { rw, rh } = this._computeRenderSize(layer, _w, _h)
      const cached = this._imageCache.get(layer.sourceUrl)
      if (cached) {
        ctx.drawImage(cached, -rw / 2, -rh / 2, rw, rh)
      } else {
        this._loadImage(layer.sourceUrl)
        this._drawPlaceholder(ctx, layer, rw, rh)
      }
      ctx.restore()
      return
    }

    // Subtitle layer
    if (layer.type === "subtitle") {
      this._drawSubtitle(ctx, layer, _w, _h)
      ctx.restore()
      return
    }

    // Fallback placeholder for audio or unknown types
    const { rw, rh } = this._computeRenderSize(layer, _w, _h)
    this._drawPlaceholder(ctx, layer, rw, rh)
    ctx.restore()
  }

  private _computeRenderSize(
    layer: CompositorLayer,
    canvasW: number,
    canvasH: number
  ): { rw: number; rh: number } {
    const nativeW = layer.nativeWidth ?? 0
    const nativeH = layer.nativeHeight ?? 0

    if (nativeW > 0 && nativeH > 0) {
      // Scale to fit canvas while preserving aspect ratio
      const scale = Math.min(canvasW / nativeW, canvasH / nativeH, 1)
      return {
        rw: Math.round(nativeW * scale),
        rh: Math.round(nativeH * scale),
      }
    }

    // Default fallback
    return { rw: 200, rh: 150 }
  }

  private _drawVideoFrame(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: CompositorLayer,
    videoUrl: string,
    rw: number,
    rh: number,
    timeSec: number
  ) {
    let video = this._videoCache.get(videoUrl)

    if (!video) {
      video = document.createElement("video")
      video.src = videoUrl
      video.muted = true
      video.preload = "auto"
      video.playsInline = true
      video.setAttribute("playsinline", "")
      video.crossOrigin = "anonymous"
      video.style.display = "none"
      // Must be in DOM for some browsers to load
      document.body.appendChild(video)
      this._videoCache.set(videoUrl, video)

      video.onloadedmetadata = () => {
        this._videoMetadataCache.set(videoUrl, {
          width: video.videoWidth,
          height: video.videoHeight,
        })
        this.invalidate()
      }
      video.onloadeddata = () => this.invalidate()
      video.onseeked = () => this.invalidate()
      video.onerror = () => this.invalidate()

      video.load()
    }

    // Calculate the correct seek time within the clip
    const timeInClip = Math.max(0, timeSec - layer.startTime)
    const seekTime = layer.trimStart + timeInClip

    if (video.readyState >= 2) {
      const timeDiff = Math.abs(video.currentTime - seekTime)
      if (timeDiff > 0.05) {
        video.currentTime = seekTime
        this._drawPlaceholder(ctx, layer, rw, rh)
        this.invalidate()
      } else {
        ctx.drawImage(video, -rw / 2, -rh / 2, rw, rh)
      }
    } else {
      this._drawPlaceholder(ctx, layer, rw, rh)
    }
  }

  private _drawText(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: CompositorLayer,
    _w: number,
    _h: number
  ) {
    const content = layer.textContent || layer.name || "Text"
    const fontSize = layer.fontSize ?? 48
    const fontFamily = layer.fontFamily ?? "sans-serif"
    const fontColor = layer.fontColor ?? "#ffffff"
    const fontWeight = layer.fontWeight ?? "normal"
    const align = layer.textAlign ?? "center"

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.textAlign = align
    ctx.textBaseline = "middle"

    // Background
    if (layer.textBackgroundColor) {
      const metrics = ctx.measureText(content)
      const padding = 12
      let bgX = -metrics.width / 2 - padding
      if (align === "left") bgX = -_w / 2 + layer.positionX
      if (align === "right") bgX = _w / 2 + layer.positionX - metrics.width - padding

      ctx.fillStyle = layer.textBackgroundColor
      ctx.fillRect(bgX, -fontSize / 2 - padding / 2, metrics.width + padding * 2, fontSize + padding)
    }

    // Shadow
    if (layer.textShadowColor) {
      ctx.shadowColor = layer.textShadowColor
      ctx.shadowBlur = layer.textShadowBlur ?? 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
    }

    // Stroke
    if (layer.textStrokeColor && (layer.textStrokeWidth ?? 0) > 0) {
      ctx.strokeStyle = layer.textStrokeColor
      ctx.lineWidth = layer.textStrokeWidth ?? 2
      ctx.lineJoin = "round"
      ctx.strokeText(content, 0, 0)
    }

    // Fill
    ctx.fillStyle = fontColor
    ctx.fillText(content, 0, 0)

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  private _drawSubtitle(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: CompositorLayer,
    _w: number,
    _h: number
  ) {
    const content = layer.textContent || layer.name || ""
    if (!content) return

    const fontSize = Math.max(28, _h * 0.04)
    const fontFamily = "sans-serif"
    const fontColor = "#ffffff"
    const bgColor = "rgba(0, 0, 0, 0.75)"

    ctx.font = `bold ${fontSize}px ${fontFamily}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Position at bottom center
    const subtitleY = _h / 2 + layer.positionY + _h * 0.35

    ctx.save()
    ctx.translate(0, subtitleY - _h / 2)

    // Background pill
    const metrics = ctx.measureText(content)
    const paddingX = 16
    const paddingY = 8
    const bgW = metrics.width + paddingX * 2
    const bgH = fontSize + paddingY * 2

    ctx.fillStyle = bgColor
    ctx.beginPath()
    const radius = 6
    ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, radius)
    ctx.fill()

    // Text
    ctx.fillStyle = fontColor
    ctx.fillText(content, 0, 0)

    ctx.restore()
  }

  private _drawPlaceholder(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: CompositorLayer,
    rw: number,
    rh: number
  ) {
    const halfW = rw / 2
    const halfH = rh / 2

    const color =
      layer.type === "video"
        ? "rgba(93,147,186,0.5)"
        : layer.type === "image"
          ? "rgba(93,186,160,0.5)"
          : layer.type === "text"
            ? "rgba(186,93,147,0.5)"
            : layer.type === "sticker"
              ? "rgba(186,160,93,0.5)"
              : layer.type === "subtitle"
                ? "rgba(147,93,186,0.5)"
                : "rgba(143,93,186,0.5)"

    ctx.fillStyle = color
    ctx.fillRect(-halfW, -halfH, rw, rh)

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.2)"
    ctx.lineWidth = 2
    ctx.strokeRect(-halfW, -halfH, rw, rh)

    // Name label
    ctx.fillStyle = "rgba(255,255,255,0.8)"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(layer.name || layer.type, 0, 0)
  }

  private async _loadImage(url: string) {
    if (this._imageCache.has(url)) return
    try {
      if (url.startsWith("data:") || url.startsWith("blob:")) {
        const img = new Image()
        img.src = url
        img.crossOrigin = "anonymous"
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Failed to load image"))
        })
        this._imageCache.set(url, img)
      } else {
        // For other URLs, try fetching as blob
        const resp = await fetch(url)
        const blob = await resp.blob()
        const bitmap = await createImageBitmap(blob)
        this._imageCache.set(url, bitmap)
      }
      this.invalidate()
    } catch {
      // silently fail — placeholder will continue to show
    }
  }

  private _disposeVideos() {
    for (const video of this._videoCache.values()) {
      video.pause()
      video.src = ""
      video.load()
      if (video.parentNode) {
        video.parentNode.removeChild(video)
      }
    }
    this._videoCache.clear()
    this._videoMetadataCache.clear()
  }

  private _drawGrid(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number) {
    const step = 80
    ctx.strokeStyle = "rgba(255,255,255,0.04)"
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }
    ctx.stroke()
  }

  private _drawTimecode(
    ctx: OffscreenCanvasRenderingContext2D,
    timeSec: number,
    w: number
  ) {
    const total = Math.floor(timeSec)
    const m = Math.floor(total / 60)
    const s = total % 60
    const text = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`

    const fontSize = Math.max(14, w * 0.018)
    ctx.font = `${fontSize}px monospace`
    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.textAlign = "right"
    ctx.fillText(text, w - 24, fontSize + 12)
  }
}
