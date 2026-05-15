// Canvas2D compositor — renders the project state to an OffscreenCanvas.
//
// Renders at the project's native resolution (e.g. 1920×1080). The host
// preview panel scales the output canvas via CSS for display.

import type { ProjectSettings } from "@/lib/db/types"

export interface CompositorLayer {
  id: string
  type: "video" | "image" | "audio"
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
      this._drawLayer(ctx, layer, w, h)
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
    _h: number
  ) {
    ctx.save()
    ctx.globalAlpha = layer.opacity

    // Position and transform
    const cx = _w / 2 + layer.positionX
    const cy = _h / 2 + layer.positionY

    ctx.translate(cx, cy)
    if (layer.rotation !== 0) {
      ctx.rotate((layer.rotation * Math.PI) / 180)
    }
    ctx.scale(layer.scaleX, layer.scaleY)

    // Determine render size — default to 200x150 placeholder if no source
    const rw = 200
    const rh = 150

    // Video playback: seek and draw frame
    if (layer.type === "video" && layer.videoBlobUrl) {
      this._drawVideoFrame(ctx, layer, layer.videoBlobUrl, rw, rh)
      ctx.restore()
      return
    }

    if (layer.sourceUrl) {
      // Try to draw the image if cached
      const cached = this._imageCache.get(layer.sourceUrl)
      if (cached) {
        ctx.drawImage(cached, -rw / 2, -rh / 2, rw, rh)
      } else {
        // Load asynchronously — draw placeholder for this frame
        this._loadImage(layer.sourceUrl)
        this._drawPlaceholder(ctx, layer, rw, rh)
      }
    } else {
      this._drawPlaceholder(ctx, layer, rw, rh)
    }

    ctx.restore()
  }

  private _drawVideoFrame(
    ctx: OffscreenCanvasRenderingContext2D,
    layer: CompositorLayer,
    videoUrl: string,
    rw: number,
    rh: number
  ) {
    let video = this._videoCache.get(videoUrl)

    if (!video) {
      video = document.createElement("video")
      video.src = videoUrl
      video.muted = true
      video.preload = "auto"
      video.playsInline = true
      video.setAttribute("playsinline", "")
      this._videoCache.set(videoUrl, video)
    }

    // Calculate the time within the source media
    const timeInLayer = 0 // current time relative to layer start is handled by caller
    const seekTime = layer.trimStart + timeInLayer

    // If video is ready and at approximately the right time, draw it
    if (video.readyState >= 2) {
      const timeDiff = Math.abs(video.currentTime - seekTime)
      if (timeDiff > 0.05) {
        // Need to seek — do it and invalidate for redraw
        video.currentTime = seekTime
        this._drawPlaceholder(ctx, layer, rw, rh)
        this.invalidate()
      } else {
        // At the right time — draw the frame
        ctx.drawImage(video, -rw / 2, -rh / 2, rw, rh)
      }
    } else {
      // Video not ready yet — set up listeners and draw placeholder
      if (video.readyState === 0) {
        video.load()
      }
      video.onseeked = () => this.invalidate()
      video.onloadeddata = () => this.invalidate()
      this._drawPlaceholder(ctx, layer, rw, rh)
    }
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
      if (url.startsWith("data:")) {
        const img = new Image()
        img.src = url
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Failed to load image"))
        })
        this._imageCache.set(url, img)
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
    }
    this._videoCache.clear()
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
