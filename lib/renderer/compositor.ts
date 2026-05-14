// Canvas2D compositor — renders the project state to an OffscreenCanvas.
//
// Renders at the project's native resolution (e.g. 1920×1080). The host
// preview panel scales the output canvas via CSS for display.
//
// Phase 1.6: renders background + grid. Extended in 1.7 for clips.

import type { ProjectSettings } from "@/lib/db/types"

export class Compositor {
  private _canvas: OffscreenCanvas | null = null
  private _ctx: OffscreenCanvasRenderingContext2D | null = null
  private _width = 0
  private _height = 0
  private _bgColor = "#000000"
  private _lastFrame = -1

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
    this._lastFrame = -1 // force redraw
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

    // 2. Draw subtle grid (editor-only visual aid, not part of output)
    this._drawGrid(ctx, w, h)

    // 3. Timecode watermark
    this._drawTimecode(ctx, timeSec, w)

    // Phase 1.7+ will add clip rendering here via compositor layers
    return true
  }

  /** Get the output canvas for mounting in the DOM. */
  getOutputCanvas(): HTMLCanvasElement | null {
    if (!this._canvas) return null
    // OffscreenCanvas can be transferred, but for display we create a regular
    // canvas and draw the offscreen onto it. This keeps the compositor
    // ready for future Web Worker migration.
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
  drawToContext(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) {
    if (!this._canvas) return
    ctx.drawImage(this._canvas, 0, 0, this._width, this._height, dx, dy, dw, dh)
  }

  /** Force a redraw on the next render() call. */
  invalidate() {
    this._lastFrame = -1
  }

  // --- Internal helpers ---

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
