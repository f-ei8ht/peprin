"use client"

import { Check, CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr"

import { useEditorStore } from "@/lib/editor/editor-store"
import { formatRelative } from "@/lib/relative-time"
import { cn } from "@/lib/utils"

export function SaveIndicator({ className }: { className?: string }) {
  const status = useEditorStore((s) => s.saveStatus)
  const error = useEditorStore((s) => s.saveError)
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt)

  if (status === "saving") {
    return (
      <span
        className={cn(
          "text-muted-foreground inline-flex items-center gap-1.5 text-xs",
          className
        )}
      >
        <CircleNotch size={12} weight="bold" className="animate-spin" />
        Saving…
      </span>
    )
  }

  if (status === "error") {
    return (
      <span
        className={cn(
          "text-destructive inline-flex items-center gap-1.5 text-xs",
          className
        )}
        title={error ?? undefined}
      >
        <WarningCircle size={12} weight="bold" />
        Couldn&apos;t save
      </span>
    )
  }

  if (status === "saved" || (status === "idle" && lastSavedAt)) {
    return (
      <span
        className={cn(
          "text-muted-foreground inline-flex items-center gap-1.5 text-xs",
          className
        )}
      >
        <Check size={12} weight="bold" />
        {lastSavedAt ? `Saved ${formatRelative(lastSavedAt)}` : "Saved"}
      </span>
    )
  }

  return null
}
