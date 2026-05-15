export type MaskType = "rectangle" | "ellipse" | "polygon" | "freeform"

export interface MaskPoint {
  x: number
  y: number
}

export interface ClipMask {
  id: string
  type: MaskType
  name: string
  enabled: boolean
  inverted: boolean
  feather: number
  opacity: number
  positionX: number
  positionY: number
  scaleX: number
  scaleY: number
  rotation: number
  points: MaskPoint[]
  radius?: number
}

export interface MaskDefinition {
  type: MaskType
  name: string
  description: string
  defaultMask: Omit<ClipMask, "id">
}
