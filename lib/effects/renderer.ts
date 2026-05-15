import type { ClipEffect, EffectParam } from "./types"
import { nanoid } from "nanoid"
import type { EffectType } from "./types"
import { getEffectDefinition } from "./definitions"

export function createEffect(type: EffectType): ClipEffect {
  const def = getEffectDefinition(type)
  if (!def) throw new Error(`Unknown effect type: ${type}`)

  const params: EffectParam[] = def.defaultParams.map((p) => ({
    id: nanoid(8),
    type,
    name: p.name,
    value: p.value,
    min: p.min,
    max: p.max,
    step: p.step,
    unit: p.unit,
  }))

  return {
    id: nanoid(10),
    type,
    name: def.name,
    params,
    enabled: true,
  }
}

export function buildCanvasFilter(effects: ClipEffect[]): string | null {
  const enabled = effects.filter((e) => e.enabled)
  if (enabled.length === 0) return null

  const parts: string[] = []

  for (const effect of enabled) {
    switch (effect.type) {
      case "blur": {
        const radius = getParamValue(effect, "Radius") ?? 0
        if (radius > 0) parts.push(`blur(${radius}px)`)
        break
      }
      case "brightness": {
        const level = getParamValue(effect, "Level") ?? 0
        const value = 1 + level / 100
        if (value !== 1) parts.push(`brightness(${value})`)
        break
      }
      case "contrast": {
        const level = getParamValue(effect, "Level") ?? 0
        const value = 1 + level / 100
        if (value !== 1) parts.push(`contrast(${value})`)
        break
      }
      case "saturation": {
        const level = getParamValue(effect, "Level") ?? 0
        const value = 1 + level / 100
        if (value !== 1) parts.push(`saturate(${value})`)
        break
      }
      case "hue": {
        const angle = getParamValue(effect, "Angle") ?? 0
        if (angle !== 0) parts.push(`hue-rotate(${angle}deg)`)
        break
      }
      case "exposure": {
        const level = getParamValue(effect, "Level") ?? 0
        const value = Math.pow(2, level / 100)
        if (value !== 1) parts.push(`brightness(${value})`)
        break
      }
      case "sepia": {
        const amount = getParamValue(effect, "Amount") ?? 0
        if (amount > 0) parts.push(`sepia(${amount / 100})`)
        break
      }
      case "invert": {
        const amount = getParamValue(effect, "Amount") ?? 0
        if (amount > 0) parts.push(`invert(${amount / 100})`)
        break
      }
    }
  }

  return parts.length > 0 ? parts.join(" ") : null
}

function getParamValue(effect: ClipEffect, paramName: string): number | undefined {
  const param = effect.params.find((p) => p.name === paramName)
  return param?.value
}

export function updateEffectParam(
  effect: ClipEffect,
  paramId: string,
  value: number
): ClipEffect {
  return {
    ...effect,
    params: effect.params.map((p) =>
      p.id === paramId ? { ...p, value: Math.max(p.min, Math.min(p.max, value)) } : p
    ),
  }
}

export function toggleEffect(effect: ClipEffect): ClipEffect {
  return { ...effect, enabled: !effect.enabled }
}
