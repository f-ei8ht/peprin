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
  middle: "middle",
  timeline: "timeline",
} as const

const INNER_IDS = {
  left: "left",
  center: "center",
  right: "right",
} as const

export function EditorLayout() {
  const sizes = usePanelStore((s) => s.sizes)
  const revision = usePanelStore((s) => s.revision)
  const setOuter = usePanelStore((s) => s.setOuter)
  const setInner = usePanelStore((s) => s.setInner)

  const handleOuterChanged = React.useCallback(
    (layout: Layout) => {
      setOuter({
        middle: layout[OUTER_IDS.middle] ?? sizes.outer.middle,
        timeline: layout[OUTER_IDS.timeline] ?? sizes.outer.timeline,
      })
    },
    [setOuter, sizes.outer.middle, sizes.outer.timeline]
  )

  const handleInnerChanged = React.useCallback(
    (layout: Layout) => {
      setInner({
        left: layout[INNER_IDS.left] ?? sizes.inner.left,
        center: layout[INNER_IDS.center] ?? sizes.inner.center,
        right: layout[INNER_IDS.right] ?? sizes.inner.right,
      })
    },
    [setInner, sizes.inner.left, sizes.inner.center, sizes.inner.right]
  )

  return (
    <div className="bg-background relative flex h-[calc(100svh-3rem)] min-h-0 w-full flex-col">
      <Group
        // Re-mount when defaults change (preset switch) so child Panels pick
        // up the new sizes. v4 reads defaultSize on mount only.
        key={revision}
        orientation="vertical"
        className="h-full w-full"
        onLayoutChanged={handleOuterChanged}
      >
        <Panel
          id={OUTER_IDS.middle}
          defaultSize={sizes.outer.middle}
          minSize={30}
        >
          <Group
            orientation="horizontal"
            className="h-full w-full"
            onLayoutChanged={handleInnerChanged}
          >
            <Panel
              id={INNER_IDS.left}
              defaultSize={sizes.inner.left}
              minSize={14}
              maxSize={40}
              className="bg-foreground/[0.015] dark:bg-foreground/[0.02]"
            >
              <LeftPanel />
            </Panel>

            <PanelDivider direction="vertical" />

            <Panel
              id={INNER_IDS.center}
              defaultSize={sizes.inner.center}
              minSize={30}
              className="bg-background"
            >
              <PreviewPanel />
            </Panel>

            <PanelDivider direction="vertical" />

            <Panel
              id={INNER_IDS.right}
              defaultSize={sizes.inner.right}
              minSize={16}
              maxSize={40}
              className="bg-foreground/[0.015] dark:bg-foreground/[0.02]"
            >
              <RightPanel />
            </Panel>
          </Group>
        </Panel>

        <PanelDivider direction="horizontal" />

        <Panel
          id={OUTER_IDS.timeline}
          defaultSize={sizes.outer.timeline}
          minSize={15}
          maxSize={70}
          className="bg-foreground/[0.015] dark:bg-foreground/[0.02]"
        >
          <TimelinePanel />
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
        "group/handle bg-border relative flex shrink-0 items-center justify-center transition-colors",
        direction === "vertical"
          ? "w-1 cursor-col-resize hover:w-1.5"
          : "h-1 cursor-row-resize hover:h-1.5",
        "data-[separator]:hover:bg-foreground/40 data-[separator-active=true]:bg-foreground/60"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-foreground/40 absolute block rounded-full opacity-0 transition-opacity",
          "group-hover/handle:opacity-100",
          direction === "vertical" ? "h-10 w-0.5" : "h-0.5 w-10"
        )}
      />
    </Separator>
  )
}
