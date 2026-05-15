export interface StickerItem {
  id: string
  name: string
  category: string
  sourceUrl: string
  width: number
  height: number
  tags: string[]
}

export interface TimelineStickerElement {
  id: string
  stickerId: string
  name: string
  startTime: number
  duration: number
  positionX: number
  positionY: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  sourceUrl: string
  nativeWidth: number
  nativeHeight: number
}

export const STICKER_CATEGORIES = [
  "shapes",
  "arrows",
  "emoji",
  "badges",
  "decorations",
] as const

export const BUILTIN_STICKERS: StickerItem[] = [
  {
    id: "star",
    name: "Star",
    category: "shapes",
    sourceUrl: "",
    width: 100,
    height: 100,
    tags: ["star", "shape"],
  },
  {
    id: "heart",
    name: "Heart",
    category: "shapes",
    sourceUrl: "",
    width: 100,
    height: 100,
    tags: ["heart", "love", "shape"],
  },
  {
    id: "arrow-right",
    name: "Arrow Right",
    category: "arrows",
    sourceUrl: "",
    width: 120,
    height: 60,
    tags: ["arrow", "direction"],
  },
  {
    id: "check-badge",
    name: "Check Badge",
    category: "badges",
    sourceUrl: "",
    width: 80,
    height: 80,
    tags: ["check", "badge", "verified"],
  },
  {
    id: "circle",
    name: "Circle",
    category: "shapes",
    sourceUrl: "",
    width: 100,
    height: 100,
    tags: ["circle", "shape"],
  },
  {
    id: "triangle",
    name: "Triangle",
    category: "shapes",
    sourceUrl: "",
    width: 100,
    height: 100,
    tags: ["triangle", "shape"],
  },
  {
    id: "diamond",
    name: "Diamond",
    category: "shapes",
    sourceUrl: "",
    width: 80,
    height: 120,
    tags: ["diamond", "shape"],
  },
  {
    id: "arrow-left",
    name: "Arrow Left",
    category: "arrows",
    sourceUrl: "",
    width: 120,
    height: 60,
    tags: ["arrow", "direction"],
  },
  {
    id: "arrow-down",
    name: "Arrow Down",
    category: "arrows",
    sourceUrl: "",
    width: 60,
    height: 120,
    tags: ["arrow", "direction"],
  },
  {
    id: "x-mark",
    name: "X Mark",
    category: "badges",
    sourceUrl: "",
    width: 80,
    height: 80,
    tags: ["x", "close", "wrong"],
  },
  {
    id: "thumbs-up",
    name: "Thumbs Up",
    category: "decorations",
    sourceUrl: "",
    width: 100,
    height: 100,
    tags: ["like", "approve"],
  },
  {
    id: "fire",
    name: "Fire",
    category: "decorations",
    sourceUrl: "",
    width: 100,
    height: 100,
    tags: ["fire", "hot", "trending"],
  },
  {
    id: "lightning",
    name: "Lightning",
    category: "decorations",
    sourceUrl: "",
    width: 60,
    height: 120,
    tags: ["bolt", "electric", "energy"],
  },
  {
    id: "music-note",
    name: "Music Note",
    category: "decorations",
    sourceUrl: "",
    width: 80,
    height: 120,
    tags: ["music", "audio", "sound"],
  },
  {
    id: "chat-bubble",
    name: "Chat Bubble",
    category: "decorations",
    sourceUrl: "",
    width: 120,
    height: 100,
    tags: ["chat", "message", "speech"],
  },
]

/**
 * Draw a built-in sticker shape onto a canvas context.
 * Coordinates are relative to the sticker center, with size based on w/h.
 */
export function drawBuiltinSticker(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  stickerId: string,
  w: number,
  h: number,
  color = "#ffffff"
) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h)

  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.06
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  switch (stickerId) {
    case "star": {
      const r = s * 0.42
      const spikes = 5
      const outerR = r
      const innerR = r * 0.4
      const step = Math.PI / spikes
      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerR : innerR
        const angle = i * step - Math.PI / 2
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      break
    }
    case "heart": {
      const r = s * 0.15
      ctx.beginPath()
      const t = -r * 0.6
      ctx.moveTo(cx, cy + r * 1.2)
      ctx.bezierCurveTo(cx - r * 2.2, cy + r * 0.5, cx - r * 1.2, cy - r * 0.8, cx + t, cy - r * 0.6)
      ctx.bezierCurveTo(cx + r * 1.2 + t, cy - r * 0.8, cx + r * 2.2 + t, cy + r * 0.5, cx + t, cy + r * 1.2)
      ctx.fill()
      break
    }
    case "arrow-right": {
      const t = s * 0.08
      ctx.beginPath()
      ctx.moveTo(cx - s * 0.4, cy - t)
      ctx.lineTo(cx + s * 0.1, cy - t)
      ctx.lineTo(cx + s * 0.1, cy - s * 0.25)
      ctx.lineTo(cx + s * 0.45, cy)
      ctx.lineTo(cx + s * 0.1, cy + s * 0.25)
      ctx.lineTo(cx + s * 0.1, cy + t)
      ctx.lineTo(cx - s * 0.4, cy + t)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "arrow-left": {
      const t = s * 0.08
      ctx.beginPath()
      ctx.moveTo(cx + s * 0.4, cy - t)
      ctx.lineTo(cx - s * 0.1, cy - t)
      ctx.lineTo(cx - s * 0.1, cy - s * 0.25)
      ctx.lineTo(cx - s * 0.45, cy)
      ctx.lineTo(cx - s * 0.1, cy + s * 0.25)
      ctx.lineTo(cx - s * 0.1, cy + t)
      ctx.lineTo(cx + s * 0.4, cy + t)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "arrow-down": {
      const t = s * 0.08
      ctx.beginPath()
      ctx.moveTo(cx - t, cy - s * 0.4)
      ctx.lineTo(cx - t, cy + s * 0.1)
      ctx.lineTo(cx - s * 0.25, cy + s * 0.1)
      ctx.lineTo(cx, cy + s * 0.45)
      ctx.lineTo(cx + s * 0.25, cy + s * 0.1)
      ctx.lineTo(cx + t, cy + s * 0.1)
      ctx.lineTo(cx + t, cy - s * 0.4)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "check-badge": {
      const outerR = s * 0.42
      ctx.beginPath()
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "#000"
      ctx.arc(cx, cy, outerR * 0.85, 0, Math.PI * 2)
      ctx.fill()
      // checkmark
      ctx.strokeStyle = color
      ctx.lineWidth = s * 0.08
      ctx.beginPath()
      ctx.moveTo(cx - outerR * 0.35, cy + outerR * 0.05)
      ctx.lineTo(cx - outerR * 0.1, cy + outerR * 0.35)
      ctx.lineTo(cx + outerR * 0.4, cy - outerR * 0.3)
      ctx.stroke()
      break
    }
    case "x-mark": {
      const r = s * 0.42
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = "#000"
      ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = s * 0.08
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.25, cy - r * 0.25)
      ctx.lineTo(cx + r * 0.25, cy + r * 0.25)
      ctx.moveTo(cx + r * 0.25, cy - r * 0.25)
      ctx.lineTo(cx - r * 0.25, cy + r * 0.25)
      ctx.stroke()
      break
    }
    case "circle": {
      const r = s * 0.38
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case "triangle": {
      const r = s * 0.42
      ctx.beginPath()
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r * 0.87, cy + r * 0.5)
      ctx.lineTo(cx - r * 0.87, cy + r * 0.5)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "diamond": {
      const rw = w * 0.38
      const rh = h * 0.38
      ctx.beginPath()
      ctx.moveTo(cx, cy - rh)
      ctx.lineTo(cx + rw, cy)
      ctx.lineTo(cx, cy + rh)
      ctx.lineTo(cx - rw, cy)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "thumbs-up": {
      const r = s * 0.3
      ctx.beginPath()
      ctx.roundRect(cx - r * 0.35, cy - r * 0.5, r * 0.6, r * 0.8, r * 0.15)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(cx + r * 0.3, cy - r * 0.6, r * 0.7, r * 1.1, r * 0.15)
      ctx.fill()
      break
    }
    case "fire": {
      const r = s * 0.38
      ctx.beginPath()
      ctx.moveTo(cx, cy + r * 0.6)
      ctx.quadraticCurveTo(cx - r * 0.8, cy + r * 1.1, cx, cy + r)
      ctx.quadraticCurveTo(cx + r * 0.8, cy + r * 1.1, cx, cy + r * 0.6)
      ctx.quadraticCurveTo(cx + r * 0.9, cy + r * 0.1, cx + r * 0.3, cy - r * 0.6)
      ctx.quadraticCurveTo(cx + r * 0.05, cy - r * 0.15, cx, cy - r)
      ctx.quadraticCurveTo(cx - r * 0.05, cy - r * 0.15, cx - r * 0.3, cy - r * 0.6)
      ctx.quadraticCurveTo(cx - r * 0.9, cy + r * 0.1, cx, cy + r * 0.6)
      ctx.fill()
      break
    }
    case "lightning": {
      const r = s * 0.35
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.15, cy - r)
      ctx.lineTo(cx - r * 0.4, cy - r * 0.15)
      ctx.lineTo(cx - r * 0.05, cy + r * 0.05)
      ctx.lineTo(cx - r * 0.2, cy + r * 0.05)
      ctx.lineTo(cx + r * 0.3, cy + r * 0.95)
      ctx.lineTo(cx - r * 0.05, cy + r * 0.1)
      ctx.lineTo(cx + r * 0.1, cy - r * 0.05)
      ctx.closePath()
      ctx.fill()
      break
    }
    case "music-note": {
      const r = s * 0.28
      ctx.beginPath()
      ctx.ellipse(cx - r * 0.6, cy + r * 0.3, r * 0.4, r * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.2, cy + r * 0.3)
      ctx.lineTo(cx - r * 0.2, cy - r)
      ctx.lineTo(cx + r * 0.6, cy - r * 0.5)
      ctx.lineTo(cx + r * 0.6, cy + r * 0.1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.6, cy - r * 0.5)
      ctx.lineTo(cx - r * 0.2, cy - r)
      ctx.moveTo(cx + r * 0.6, cy + r * 0.1)
      ctx.lineTo(cx + r * 0.6, cy - r * 0.5)
      ctx.strokeStyle = color
      ctx.lineWidth = s * 0.05
      ctx.stroke()
      break
    }
    case "chat-bubble": {
      const r = s * 0.38
      ctx.beginPath()
      ctx.roundRect(cx - r, cy - r * 0.7, r * 2, r * 1.4, r * 0.3)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.6, cy - r * 0.15)
      ctx.lineTo(cx - r * 0.9, cy + r * 0.25)
      ctx.lineTo(cx - r * 0.1, cy - r * 0.15)
      ctx.closePath()
      ctx.fill()
      // Dots
      ctx.beginPath()
      ctx.fillStyle = "rgba(0,0,0,0.3)"
      ctx.arc(cx - r * 0.35, cy - r * 0.15, r * 0.09, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + r * 0.05, cy - r * 0.15, r * 0.09, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + r * 0.45, cy - r * 0.15, r * 0.09, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    default: {
      const r = s * 0.35
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
