// Command-based undo/redo history for timeline edits.
//
// Each command captures a snapshot of the timeline before mutation so
// undo/redo can restore state deterministically.

import type { TimelineTrack } from "@/lib/db/types"

export interface Command {
  /** Human-readable label for undo/redo UI. */
  label: string
  /** State before the edit was applied. */
  before: TimelineTrack[]
  /** State after the edit was applied. */
  after: TimelineTrack[]
  /** Timestamp when the command was created. */
  createdAt: number
}

const MAX_HISTORY = 200

interface HistoryState {
  commands: Command[]
  index: number // points to the command *after* the current state (-1 = no history)
}

let _history: HistoryState = { commands: [], index: -1 }

export function getHistory(): HistoryState {
  return _history
}

export function resetHistory(): void {
  _history = { commands: [], index: -1 }
}

/** Returns true if there are commands to undo. */
export function canUndo(): boolean {
  return _history.index >= 0
}

/** Returns true if there are commands to redo. */
export function canRedo(): boolean {
  return _history.index < _history.commands.length - 1
}

/**
 * Push a new command onto the history stack.
 * Truncates any redo stack (commands after current index).
 */
export function pushCommand(label: string, before: TimelineTrack[], after: TimelineTrack[]): void {
  // Truncate redo history
  _history.commands = _history.commands.slice(0, _history.index + 1)

  _history.commands.push({ label, before, after, createdAt: Date.now() })

  // Enforce history size limit
  if (_history.commands.length > MAX_HISTORY) {
    _history.commands = _history.commands.slice(-MAX_HISTORY)
  }

  _history.index = _history.commands.length - 1
}

/**
 * Undo the current command. Returns the tracks to restore, or null if
 * nothing to undo.
 */
export function undo(): { label: string; tracks: TimelineTrack[] } | null {
  if (!canUndo()) return null
  const cmd = _history.commands[_history.index]
  _history.index--
  return { label: cmd.label, tracks: cmd.before }
}

/**
 * Redo the next command. Returns the tracks to restore, or null if
 * nothing to redo.
 */
export function redo(): { label: string; tracks: TimelineTrack[] } | null {
  if (!canRedo()) return null
  _history.index++
  const cmd = _history.commands[_history.index]
  return { label: cmd.label, tracks: cmd.after }
}
