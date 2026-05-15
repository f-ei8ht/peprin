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
