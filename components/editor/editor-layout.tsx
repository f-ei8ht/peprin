"use client"

import * as React from "react"
import { Group, Panel, Separator, type Layout } from "react-resizable-panels"

import { LeftPanel } from "@/components/editor/panels/left-panel"
import { PreviewPanel } from "@/components/editor/panels/preview-panel"
import { RightPanel } from "@/components/editor/panels/right-panel"
import { TimelinePanel } from "@/components/editor/panels/timeline-panel"
import { usePanelStore } from "@/lib/editor/panel-store"
import { cn } from "@/lib/utils"

const OUTER_IDS = {
  left: "left",
  center: "center",
  right: "right",
} as const

const INNER_IDS = {
  preview: "preview",
  timeline: "timeline",
} as const

export function EditorLayout() {
  const sizes = usePanelStore((s) => s.sizes)
  const setOuter = usePanelStore((s) => s.setOuter)
  const setInner = usePanelStore((s) => s.setInner)

  const handleOuterChanged = React.useCallback(
    (layout: Layout) => {
      setOuter({
        left: layout[OUTER_IDS.left] ?? sizes.outer.left,
        center: layout[OUTER_IDS.center] ?? sizes.outer.center,
        right: layout[OUTER_IDS.right] ?? sizes.outer.right,
      })
    },
    [setOuter, sizes.outer.left, sizes.outer.center, sizes.outer.right]
  )

  const handleInnerChanged = React.useCallback(
    (layout: Layout) => {
      setInner({
        preview: layout[INNER_IDS.preview] ?? sizes.inner.preview,
        timeline: layout[INNER_IDS.timeline] ?? sizes.inner.timeline,
      })
    },
    [setInner, sizes.inner.preview, sizes.inner.timeline]
  )

  return (
    <div className="bg-background relative flex h-[calc(100svh-3rem)] min-h-0 w-full flex-col">
      <Group
        orientation="horizontal"
        className="h-full w-full"
        onLayoutChanged={handleOuterChanged}
      >
        <Panel
          id={OUTER_IDS.left}
          defaultSize={sizes.outer.left}
          minSize={14}
          maxSize={32}
          className="bg-card border-r"
        >
          <LeftPanel />
        </Panel>

        <PanelDivider direction="vertical" />

        <Panel
          id={OUTER_IDS.center}
          defaultSize={sizes.outer.center}
          minSize={30}
        >
          <Group
            orientation="vertical"
            className="h-full w-full"
            onLayoutChanged={handleInnerChanged}
          >
            <Panel
              id={INNER_IDS.preview}
              defaultSize={sizes.inner.preview}
              minSize={25}
            >
              <PreviewPanel />
            </Panel>
            <PanelDivider direction="horizontal" />
            <Panel
              id={INNER_IDS.timeline}
              defaultSize={sizes.inner.timeline}
              minSize={20}
            >
              <TimelinePanel />
            </Panel>
          </Group>
        </Panel>

        <PanelDivider direction="vertical" />

        <Panel
          id={OUTER_IDS.right}
          defaultSize={sizes.outer.right}
          minSize={16}
          maxSize={36}
          className="bg-card border-l"
        >
          <RightPanel />
        </Panel>
      </Group>
    </div>
  )
}

function PanelDivider({
  direction,
}: {
  /** "vertical" = vertical hairline (sits between horizontally arranged panels). */
  direction: "vertical" | "horizontal"
}) {
  return (
    <Separator
      className={cn(
        "group/handle relative flex items-center justify-center transition-colors",
        direction === "vertical"
          ? "w-1.5 cursor-col-resize"
          : "h-1.5 cursor-row-resize",
        "data-[separator]:hover:bg-foreground/10"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-border block rounded-full transition-colors",
          direction === "vertical" ? "h-8 w-0.5" : "h-0.5 w-8",
          "group-hover/handle:bg-foreground/40"
        )}
      />
    </Separator>
  )
}
