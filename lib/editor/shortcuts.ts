// Keyboard shortcuts registry for the editor.
// Registers a single global keydown listener and dispatches to typed handlers.

export type ShortcutAction =
  | "playPause"
  | "frameForward"
  | "frameBackward"
  | "jumpStart"
  | "jumpEnd"
  | "split"
  | "delete"
  | "undo"
  | "redo"
  | "cut"
  | "copy"
  | "paste"
  | "duplicate"
  | "selectAll"
  | "deselect"
  | "toggleRipple"
  | "toggleSnap"
  | "showShortcuts"

type ActionHandler = (action: ShortcutAction, event: KeyboardEvent) => void

let _handler: ActionHandler | null = null

/**
 * Register the shortcut handler. Only one handler can be active.
 * Returns a cleanup function.
 */
export function registerShortcuts(fn: ActionHandler): () => void {
  _handler = fn

  const onKeyDown = (e: KeyboardEvent) => {
    if (!_handler) return

    const tag = (e.target as HTMLElement).tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return

    const meta = e.metaKey || e.ctrlKey
    const shift = e.shiftKey

    // J/K/L — shuttle (no modifier)
    if (!meta && !shift) {
      if (e.code === "KeyJ") {
        e.preventDefault()
        _handler("playPause", e)
        // Actually, J is reverse play in JKL — for now map to simple actions
        return
      }
      if (e.code === "KeyK") {
        e.preventDefault()
        _handler("playPause", e)
        return
      }
      if (e.code === "KeyL") {
        e.preventDefault()
        _handler("playPause", e)
        return
      }
    }

    // Space — play/pause (no modifier, for now we use it via preview panel)
    if (e.code === "Space" && !meta && !shift) {
      e.preventDefault()
      _handler("playPause", e)
      return
    }

    // Arrow keys — frame step
    if (e.code === "ArrowLeft" && !meta && !shift) {
      e.preventDefault()
      _handler("frameBackward", e)
      return
    }
    if (e.code === "ArrowRight" && !meta && !shift) {
      e.preventDefault()
      _handler("frameForward", e)
      return
    }

    // Home / End — jump to start/end
    if (e.code === "Home" && !meta && !shift) {
      e.preventDefault()
      _handler("jumpStart", e)
      return
    }
    if (e.code === "End" && !meta && !shift) {
      e.preventDefault()
      _handler("jumpEnd", e)
      return
    }

    // Delete / Backspace — delete selection
    if ((e.code === "Delete" || e.code === "Backspace") && !meta) {
      e.preventDefault()
      _handler("delete", e)
      return
    }

    // S — split at playhead
    if (e.code === "KeyS" && !meta && !shift) {
      e.preventDefault()
      _handler("split", e)
      return
    }

    // Cmd/Ctrl + Z — undo
    if (meta && !shift && e.code === "KeyZ") {
      e.preventDefault()
      _handler("undo", e)
      return
    }

    // Cmd/Ctrl + Shift + Z — redo
    if (meta && shift && e.code === "KeyZ") {
      e.preventDefault()
      _handler("redo", e)
      return
    }

    // Cmd/Ctrl + X — cut
    if (meta && !shift && e.code === "KeyX") {
      e.preventDefault()
      _handler("cut", e)
      return
    }

    // Cmd/Ctrl + C — copy
    if (meta && !shift && e.code === "KeyC") {
      e.preventDefault()
      _handler("copy", e)
      return
    }

    // Cmd/Ctrl + V — paste
    if (meta && !shift && e.code === "KeyV") {
      e.preventDefault()
      _handler("paste", e)
      return
    }

    // Cmd/Ctrl + D — duplicate
    if (meta && !shift && e.code === "KeyD") {
      e.preventDefault()
      _handler("duplicate", e)
      return
    }

    // Cmd/Ctrl + A — select all
    if (meta && !shift && e.code === "KeyA") {
      e.preventDefault()
      _handler("selectAll", e)
      return
    }

    // Escape — deselect
    if (e.code === "Escape" && !meta && !shift) {
      e.preventDefault()
      _handler("deselect", e)
      return
    }

    // ? — show shortcuts
    if (e.code === "Slash" && shift && !meta) {
      e.preventDefault()
      _handler("showShortcuts", e)
      return
    }
  }

  window.addEventListener("keydown", onKeyDown)
  return () => window.removeEventListener("keydown", onKeyDown)
}
