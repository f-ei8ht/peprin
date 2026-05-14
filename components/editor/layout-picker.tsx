"use client"

import * as React from "react"
import { Layout as LayoutIcon } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LAYOUT_PRESETS,
  type LayoutPresetId,
  usePanelStore,
} from "@/lib/editor/panel-store"

const PRESET_IDS = Object.keys(LAYOUT_PRESETS) as LayoutPresetId[]

export function LayoutPicker() {
  const applyPreset = usePanelStore((s) => s.applyPreset)
  const reset = usePanelStore((s) => s.reset)

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Workspace layout"
            >
              <LayoutIcon size={14} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Workspace layout</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRESET_IDS.map((id) => {
          const preset = LAYOUT_PRESETS[id]
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => applyPreset(id)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="text-foreground text-sm font-medium">
                {preset.label}
              </span>
              <span className="text-muted-foreground text-[11px] leading-snug">
                {preset.description}
              </span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={reset}>Reset layout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
