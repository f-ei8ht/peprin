import type { ClipMask } from "./types"

export function applyMaskToContext(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  mask: ClipMask,
  canvasW: number,
  canvasH: number
) {
  if (!mask.enabled) return

  ctx.save()

  const cx = canvasW / 2 + mask.positionX
  const cy = canvasH / 2 + mask.positionY

  ctx.translate(cx, cy)
  if (mask.rotation !== 0) {
    ctx.rotate((mask.rotation * Math.PI) / 180)
  }
  ctx.scale(mask.scaleX * canvasW, mask.scaleY * canvasH)

  ctx.beginPath()

  switch (mask.type) {
    case "rectangle":
      drawRectangleMask(ctx, mask)
      break
    case "ellipse":
      drawEllipseMask(ctx)
      break
    case "polygon":
      drawPolygonMask(ctx, mask)
      break
    case "freeform":
      drawFreeformMask(ctx, mask)
      break
  }

  ctx.closePath()

  if (mask.feather > 0) {
    ctx.filter = `blur(${mask.feather}px)`
  }

  ctx.clip()

  if (mask.inverted) {
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.rect(-1, -1, 2, 2)
    ctx.clip("evenodd")
  }
}

function drawRectangleMask(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  mask: ClipMask
) {
  const w = 1
  const h = 1
  const r = (mask.radius ?? 0) / 100
  const rx = r * Math.min(w, h)

  if (rx > 0) {
    ctx.moveTo(-w / 2 + rx, -h / 2)
    ctx.lineTo(w / 2 - rx, -h / 2)
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rx)
    ctx.lineTo(w / 2, h / 2 - rx)
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - rx, h / 2)
    ctx.lineTo(-w / 2 + rx, h / 2)
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rx)
    ctx.lineTo(-w / 2, -h / 2 + rx)
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rx, -h / 2)
  } else {
    ctx.rect(-w / 2, -h / 2, w, h)
  }
}

function drawEllipseMask(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
) {
  ctx.ellipse(0, 0, 0.5, 0.5, 0, 0, Math.PI * 2)
}

function drawPolygonMask(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  mask: ClipMask
) {
  if (mask.points.length < 3) {
    ctx.rect(-0.5, -0.5, 1, 1)
    return
  }

  const first = mask.points[0]
  ctx.moveTo(first.x, first.y)

  for (let i = 1; i < mask.points.length; i++) {
    ctx.lineTo(mask.points[i].x, mask.points[i].y)
  }
}

function drawFreeformMask(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  mask: ClipMask
) {
  if (mask.points.length < 2) {
    ctx.rect(-0.5, -0.5, 1, 1)
    return
  }

  ctx.moveTo(mask.points[0].x, mask.points[0].y)

  for (let i = 1; i < mask.points.length; i++) {
    const prev = mask.points[i - 1]
    const curr = mask.points[i]
    const cpx = (prev.x + curr.x) / 2
    const cpy = (prev.y + curr.y) / 2
    ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy)
  }

  const last = mask.points[mask.points.length - 1]
  const first = mask.points[0]
  ctx.quadraticCurveTo(last.x, last.y, first.x, first.y)
}
