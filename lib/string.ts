// String helpers.

export function capitalizeFirstLetter({ string }: { string: string }) {
  if (!string) return string
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

export function formatBytes(bytes: number, fractionDigits = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const exp = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  )
  const value = bytes / 1024 ** exp
  return `${value.toFixed(fractionDigits)} ${units[exp]}`
}
