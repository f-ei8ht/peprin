export interface TextPreset {
  id: string
  name: string
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: string
  textAlign: CanvasTextAlign
  textStrokeColor?: string
  textStrokeWidth?: number
  textShadowColor?: string
  textShadowBlur?: number
  textBackgroundColor?: string
  category: "title" | "subtitle" | "body" | "caption"
}

export interface TimelineTextElement {
  id: string
  name: string
  textContent: string
  startTime: number
  duration: number
  positionX: number
  positionY: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: string
  textAlign: CanvasTextAlign
  textStrokeColor?: string
  textStrokeWidth?: number
  textShadowColor?: string
  textShadowBlur?: number
  textBackgroundColor?: string
}

export interface FontDef {
  family: string
  label: string
  category: "sans" | "serif" | "mono" | "display"
  weights: string[]
}

export const FONT_CATALOG: FontDef[] = [
  { family: "sans-serif", label: "Sans Serif", category: "sans", weights: ["300", "400", "600", "700"] },
  { family: "serif", label: "Serif", category: "serif", weights: ["300", "400", "600", "700"] },
  { family: "monospace", label: "Monospace", category: "mono", weights: ["300", "400", "600", "700"] },
  { family: "system-ui, sans-serif", label: "System UI", category: "sans", weights: ["300", "400", "600", "700"] },
  { family: "Georgia, serif", label: "Georgia", category: "serif", weights: ["400", "700"] },
  { family: "Impact, sans-serif", label: "Impact", category: "display", weights: ["400"] },
  { family: "cursive", label: "Cursive", category: "display", weights: ["400", "700"] },
  { family: "fantasy", label: "Fantasy", category: "display", weights: ["400", "700"] },
]

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: "title-bold",
    name: "Bold Title",
    fontFamily: "sans-serif",
    fontSize: 64,
    fontColor: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowBlur: 8,
    category: "title",
  },
  {
    id: "subtitle-light",
    name: "Light Subtitle",
    fontFamily: "sans-serif",
    fontSize: 36,
    fontColor: "#ffffff",
    fontWeight: "300",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowBlur: 4,
    category: "subtitle",
  },
  {
    id: "body-normal",
    name: "Body Text",
    fontFamily: "sans-serif",
    fontSize: 28,
    fontColor: "#ffffff",
    fontWeight: "normal",
    textAlign: "center",
    category: "body",
  },
  {
    id: "caption-small",
    name: "Caption",
    fontFamily: "sans-serif",
    fontSize: 20,
    fontColor: "#e0e0e0",
    fontWeight: "normal",
    textAlign: "center",
    textBackgroundColor: "rgba(0,0,0,0.5)",
    category: "caption",
  },
  {
    id: "stroke-outline",
    name: "Outlined Text",
    fontFamily: "sans-serif",
    fontSize: 48,
    fontColor: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
    textStrokeColor: "#000000",
    textStrokeWidth: 3,
    category: "title",
  },
]
