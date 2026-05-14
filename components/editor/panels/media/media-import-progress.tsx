"use client"

import * as React from "react"
import {
  CheckCircle,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { useMediaStore } from "@/lib/media/store"
import { formatBytes } from "@/lib/string"
import { cn } from "@/lib/utils"

export function MediaImportProgress() {
  const imports = useMediaStore((s) => s.imports)
  const clearImports = useMediaStore((s) => s.clearImports)

  if (imports.length === 0) return null

  const inFlight = imports.filter((i) => i.status === "importing" || i.status === "queued")
  const done = imports.filter((i) => i.status === "done")
  const failed = imports.filter((i) => i.status === "error")

  return (
    <div className="bg-foreground/[0.03] flex shrink-0 flex-col gap-1.5 border-b px-3 py-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-medium">
          Importing {imports.length} file{imports.length === 1 ? "" : "s"}
        </span>
        {inFlight.length === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={clearImports}
          >
            Clear
          </Button>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {imports.slice(0, 6).map((task) => (
          <li
            key={task.id}
            className={cn(
              "flex items-center gap-2 rounded px-1 py-0.5",
              task.status === "error" && "text-destructive"
            )}
          >
            {task.status === "importing" || task.status === "queued" ? (
              <CircleNotch
                size={12}
                weight="bold"
                className="text-muted-foreground animate-spin"
              />
            ) : task.status === "done" ? (
              <CheckCircle size={12} weight="fill" className="text-emerald-500" />
            ) : (
              <WarningCircle size={12} weight="fill" />
            )}
            <span className="min-w-0 flex-1 truncate">{task.fileName}</span>
            <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
              {formatBytes(task.byteSize)}
            </span>
          </li>
        ))}
        {imports.length > 6 && (
          <li className="text-muted-foreground text-[10px] italic">
            …and {imports.length - 6} more
          </li>
        )}
      </ul>
      {failed.length > 0 && inFlight.length === 0 && (
        <p className="text-destructive">
          {failed.length} file{failed.length === 1 ? "" : "s"} couldn&apos;t be
          imported.
        </p>
      )}
      {done.length > 0 && inFlight.length === 0 && failed.length === 0 && (
        <p className="text-muted-foreground">All imports finished.</p>
      )}
    </div>
  )
}
