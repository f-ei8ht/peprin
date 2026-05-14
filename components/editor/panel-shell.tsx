"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface PanelShellProps {
  title?: React.ReactNode
  trailing?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** Hide the header bar when no title is provided. */
  hideHeader?: boolean
}

export function PanelShell({
  title,
  trailing,
  children,
  className,
  bodyClassName,
  hideHeader,
}: PanelShellProps) {
  return (
    <div className={cn("bg-card flex h-full flex-col overflow-hidden", className)}>
      {!hideHeader && (title || trailing) && (
        <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
          <div className="text-foreground/80 truncate text-xs font-medium uppercase tracking-wide">
            {title}
          </div>
          {trailing && <div className="flex items-center gap-1">{trailing}</div>}
        </div>
      )}
      <div className={cn("min-h-0 flex-1 overflow-auto", bodyClassName)}>
        {children}
      </div>
    </div>
  )
}
