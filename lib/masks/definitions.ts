import type { MaskDefinition, ClipMask } from "./types"
import { nanoid } from "nanoid"
import type { MaskType } from "./types"

export const MASK_DEFINITIONS: MaskDefinition[] = [
  {
    type: "rectangle",
    name: "Rectangle",
    description: "Rectangular mask",
    defaultMask: {
      type: "rectangle",
      name: "Rectangle Mask",
      enabled: true,
      inverted: false,
      feather: 0,
      opacity: 1,
      positionX: 0,
      positionY: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      rotation: 0,
      points: [],
      radius: 0,
    },
  },
  {
    type: "ellipse",
    name: "Ellipse",
    description: "Elliptical mask",
    defaultMask: {
      type: "ellipse",
      name: "Ellipse Mask",
      enabled: true,
      inverted: false,
      feather: 0,
      opacity: 1,
      positionX: 0,
      positionY: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      rotation: 0,
      points: [],
    },
  },
  {
    type: "polygon",
    name: "Polygon",
    description: "Polygonal mask",
    defaultMask: {
      type: "polygon",
      name: "Polygon Mask",
      enabled: true,
      inverted: false,
      feather: 0,
      opacity: 1,
      positionX: 0,
      positionY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      points: [
        { x: 0, y: -0.3 },
        { x: 0.3, y: 0.2 },
        { x: -0.3, y: 0.2 },
      ],
    },
  },
  {
    type: "freeform",
    name: "Freeform",
    description: "Free-form path mask",
    defaultMask: {
      type: "freeform",
      name: "Freeform Mask",
      enabled: true,
      inverted: false,
      feather: 0,
      opacity: 1,
      positionX: 0,
      positionY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      points: [],
    },
  },
]

export function createMask(type: MaskType): ClipMask {
  const def = MASK_DEFINITIONS.find((d) => d.type === type)
  if (!def) throw new Error(`Unknown mask type: ${type}`)

  return {
    id: nanoid(10),
    ...def.defaultMask,
  }
}

export function getMaskDefinition(type: MaskType): MaskDefinition | undefined {
  return MASK_DEFINITIONS.find((d) => d.type === type)
}
