export type EffectType =
  | "blur"
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue"
  | "exposure"
  | "sharpen"
  | "vignette"
  | "chroma-key"
  | "grain"
  | "sepia"
  | "invert"

export interface EffectParam {
  id: string
  type: EffectType
  name: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
}

export interface ClipEffect {
  id: string
  type: EffectType
  name: string
  params: EffectParam[]
  enabled: boolean
}

export interface EffectDefinition {
  type: EffectType
  name: string
  description: string
  category: "blur" | "color" | "distortion" | "stylize"
  defaultParams: Omit<EffectParam, "id" | "type">[]
  icon?: string
}
