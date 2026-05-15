import type { EffectDefinition } from "./types"
import type { EffectType } from "./types"

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  {
    type: "blur",
    name: "Blur",
    description: "Gaussian blur effect",
    category: "blur",
    defaultParams: [
      { name: "Radius", value: 4, min: 0, max: 50, step: 0.5, unit: "px" },
    ],
  },
  {
    type: "brightness",
    name: "Brightness",
    description: "Adjust brightness",
    category: "color",
    defaultParams: [
      { name: "Level", value: 0, min: -100, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "contrast",
    name: "Contrast",
    description: "Adjust contrast",
    category: "color",
    defaultParams: [
      { name: "Level", value: 0, min: -100, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "saturation",
    name: "Saturation",
    description: "Adjust color saturation",
    category: "color",
    defaultParams: [
      { name: "Level", value: 0, min: -100, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "hue",
    name: "Hue Rotate",
    description: "Rotate hue",
    category: "color",
    defaultParams: [
      { name: "Angle", value: 0, min: 0, max: 360, step: 1, unit: "deg" },
    ],
  },
  {
    type: "exposure",
    name: "Exposure",
    description: "Adjust exposure",
    category: "color",
    defaultParams: [
      { name: "Level", value: 0, min: -100, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "sharpen",
    name: "Sharpen",
    description: "Enhance edge sharpness",
    category: "distortion",
    defaultParams: [
      { name: "Amount", value: 0, min: 0, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "vignette",
    name: "Vignette",
    description: "Darken edges",
    category: "stylize",
    defaultParams: [
      { name: "Intensity", value: 0, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Roundness", value: 50, min: 0, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "chroma-key",
    name: "Chroma Key",
    description: "Remove green/blue screen background",
    category: "distortion",
    defaultParams: [
      { name: "Hue", value: 120, min: 0, max: 360, step: 1, unit: "deg" },
      { name: "Similarity", value: 40, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Smoothness", value: 10, min: 0, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "grain",
    name: "Film Grain",
    description: "Add film grain texture",
    category: "stylize",
    defaultParams: [
      { name: "Intensity", value: 0, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Size", value: 1, min: 0.5, max: 5, step: 0.5, unit: "px" },
    ],
  },
  {
    type: "sepia",
    name: "Sepia",
    description: "Warm brown tone",
    category: "stylize",
    defaultParams: [
      { name: "Amount", value: 100, min: 0, max: 100, step: 1, unit: "%" },
    ],
  },
  {
    type: "invert",
    name: "Invert",
    description: "Invert colors",
    category: "stylize",
    defaultParams: [
      { name: "Amount", value: 100, min: 0, max: 100, step: 1, unit: "%" },
    ],
  },
]

export function getEffectDefinition(type: EffectType): EffectDefinition | undefined {
  return EFFECT_DEFINITIONS.find((d) => d.type === type)
}

export function getEffectsByCategory(category: EffectDefinition["category"]): EffectDefinition[] {
  return EFFECT_DEFINITIONS.filter((d) => d.category === category)
}
