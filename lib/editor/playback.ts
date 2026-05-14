// Playback manager — transport controls, RAF-based time advancement,
// frame-snapping, and event system for the preview canvas.
//
// Works in seconds. Designed to be a singleton per editor session.

type PlaybackListener = () => void
type TimeListener = (timeSec: number) => void

export class PlaybackManager {
  private _playing = false
  private _currentTime = 0 // seconds
  private _duration = 0 // seconds
  private _fps = 30
  private _isScrubbing = false
  private _rafId: number | null = null
  private _lastWallMs = 0
  private _playbackStartTime = 0 // seconds — time when play was last started

  private _listeners = new Set<PlaybackListener>()
  private _updateListeners = new Set<TimeListener>()
  private _seekListeners = new Set<TimeListener>()

  get playing() {
    return this._playing
  }

  get currentTime() {
    return this._currentTime
  }

  get duration() {
    return this._duration
  }

  get fps() {
    return this._fps
  }

  get isScrubbing() {
    return this._isScrubbing
  }

  setDuration(sec: number) {
    this._duration = Math.max(0, sec)
    this._clamp()
    this._notify()
  }

  setFps(fps: number) {
    this._fps = fps
  }

  play() {
    if (this._playing) return
    if (this._currentTime >= this._duration && this._duration > 0) {
      this._currentTime = 0
      this._notifySeek(0)
    }
    this._playing = true
    this._playbackStartTime = this._currentTime
    this._lastWallMs = performance.now()
    this._scheduleTick()
    this._notify()
  }

  pause() {
    if (!this._playing) return
    this._playing = false
    this._cancelTick()
    this._notify()
  }

  toggle() {
    if (this._playing) this.pause()
    else this.play()
  }

  seek(timeSec: number) {
    const prev = this._currentTime
    this._currentTime = Math.max(0, Math.min(timeSec, this._duration))
    if (this._playing) {
      this._playbackStartTime = this._currentTime
      this._lastWallMs = performance.now()
    }
    if (this._currentTime !== prev) {
      this._notifySeek(this._currentTime)
    }
    this._notify()
  }

  /** Frame-step forward by one frame at current FPS. */
  frameForward() {
    const step = 1 / this._fps
    this.seek(this._currentTime + step)
  }

  /** Frame-step backward by one frame at current FPS. */
  frameBackward() {
    const step = 1 / this._fps
    this.seek(this._currentTime - step)
  }

  jumpToStart() {
    this.seek(0)
  }

  jumpToEnd() {
    this.seek(this._duration)
  }

  setScrubbing(active: boolean) {
    this._isScrubbing = active
    this._notify()
  }

  // --- Event system ---

  /** Subscribe to any state change (play/pause/scrub). */
  subscribe(fn: PlaybackListener): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  /** Subscribe to per-frame time updates (fires during playback every frame). */
  onUpdate(fn: TimeListener): () => void {
    this._updateListeners.add(fn)
    return () => this._updateListeners.delete(fn)
  }

  /** Subscribe to seek events (fires on seek, jump, frame-step). */
  onSeek(fn: TimeListener): () => void {
    this._seekListeners.add(fn)
    return () => this._seekListeners.delete(fn)
  }

  destroy() {
    this._cancelTick()
    this._listeners.clear()
    this._updateListeners.clear()
    this._seekListeners.clear()
  }

  // --- Internals ---

  private _tick = () => {
    if (!this._playing) return

    const now = performance.now()
    const elapsed = (now - this._lastWallMs) / 1000
    const raw = this._playbackStartTime + elapsed

    // Snap to frame boundary
    const frameNum = Math.round(raw * this._fps)
    const snapped = frameNum / this._fps

    if (snapped >= this._duration && this._duration > 0) {
      this._currentTime = this._duration
      this._notifyUpdate(this._currentTime)
      this.pause()
      return
    }

    this._currentTime = Math.max(0, snapped)
    this._notifyUpdate(this._currentTime)
    this._scheduleTick()
  }

  private _scheduleTick() {
    this._rafId = requestAnimationFrame(this._tick)
  }

  private _cancelTick() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  private _clamp() {
    this._currentTime = Math.max(0, Math.min(this._currentTime, this._duration))
  }

  private _notify() {
    for (const fn of this._listeners) fn()
  }

  private _notifyUpdate(timeSec: number) {
    for (const fn of this._updateListeners) fn(timeSec)
  }

  private _notifySeek(timeSec: number) {
    for (const fn of this._seekListeners) fn(timeSec)
  }
}

/** Singleton for the current editor session. */
let _instance: PlaybackManager | null = null

export function getPlaybackManager(): PlaybackManager {
  if (!_instance) _instance = new PlaybackManager()
  return _instance
}

export function resetPlaybackManager(): void {
  _instance?.destroy()
  _instance = null
}
