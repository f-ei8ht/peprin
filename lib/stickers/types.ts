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
]
