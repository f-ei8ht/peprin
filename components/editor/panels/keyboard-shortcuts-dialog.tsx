"use client"

import { Keyboard } from "@phosphor-icons/react/dist/ssr"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; label: string }[]
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["?"], label: "Show this dialog" },
    ],
  },
  {
    title: "Playback",
    shortcuts: [
      { keys: ["Space"], label: "Play / Pause" },
      { keys: ["J"], label: "Shuttle reverse" },
      { keys: ["K"], label: "Pause" },
      { keys: ["L"], label: "Shuttle forward" },
      { keys: ["←"], label: "Frame backward" },
      { keys: ["→"], label: "Frame forward" },
      { keys: ["Home"], label: "Jump to start" },
      { keys: ["End"], label: "Jump to end" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["S"], label: "Split at playhead" },
      { keys: ["Del"], label: "Delete selected" },
      { keys: ["Ctrl", "Z"], label: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], label: "Redo" },
      { keys: ["Ctrl", "X"], label: "Cut" },
      { keys: ["Ctrl", "C"], label: "Copy" },
      { keys: ["Ctrl", "V"], label: "Paste" },
      { keys: ["Ctrl", "D"], label: "Duplicate" },
    ],
  },
  {
    title: "Selection",
    shortcuts: [
      { keys: ["Ctrl", "A"], label: "Select all" },
      { keys: ["Esc"], label: "Deselect" },
      { keys: ["Shift", "Click"], label: "Multi-select" },
    ],
  },
  {
    title: "Timeline",
    shortcuts: [
      { keys: ["Scroll"], label: "Zoom in / out" },
      { keys: ["Ctrl", "Scroll"], label: "Vertical scroll" },
    ],
  },
]

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded border border-foreground/20 bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground/80",
        className
      )}
    >
      {children}
    </kbd>
  )
}

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={18} weight="bold" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            All available keyboard shortcuts for the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((group) => (
            <section key={group.title}>
              <h4 className="text-foreground/90 mb-2 text-xs font-semibold uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="flex flex-col gap-1.5">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-foreground/[0.04]"
                  >
                    <span className="text-foreground/80 text-sm">{s.label}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Kbd>{key}</Kbd>
                          {i < s.keys.length - 1 && (
                            <span className="text-muted-foreground text-[11px]">+</span>
                          )}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
