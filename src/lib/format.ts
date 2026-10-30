// Display formatting. Sizes use SI decimal units: 1 kB = 1000 B.

const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB", "PB"]

/** "999 B", "1.23 kB", "45.6 MB", "789 GB": three significant digits. */
export function formatBytes(bytes: number) {
  let value = bytes
  let unit = 0
  // From 999.5 the number would round to "1000": use the next unit instead.
  while (value >= 999.5 && unit < BYTE_UNITS.length - 1) {
    value /= 1000
    unit++
  }
  const decimals = unit === 0 || value >= 99.95 ? 0 : value >= 9.995 ? 1 : 2
  return `${value.toFixed(decimals)} ${BYTE_UNITS[unit]}`
}

export function formatSpeed(bytesPerSecond: number) {
  return `${formatBytes(bytesPerSecond)}/s`
}

/** "45 s", "12 min", "3 h 20 min", "2 d", rounded down like the official WebUI. */
export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.floor(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
  }
  return `${Math.floor(hours / 24)} d`
}

/** "45.3%", rounded down so that only a finished download shows 100%. */
export function formatPercent(fraction: number) {
  return `${truncate(fraction * 100, 1)}%`
}

/** "1.25"; qBittorrent sends -1 for an infinite ratio. */
export function formatRatio(ratio: number) {
  return ratio < 0 ? "∞" : truncate(ratio, 2)
}

/** "3 (120)": peers we are connected to, and in the swarm when known. */
export function formatPeers(connected: number, swarm: number) {
  return swarm >= 0 ? `${connected} (${swarm})` : String(connected)
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
})

/** "30 Oct 2026, 10:15". */
export function formatDate(unixSeconds: number) {
  return dateFormat.format(unixSeconds * 1000)
}

/** Like toFixed, but rounding down. */
function truncate(value: number, decimals: number) {
  const factor = 10 ** decimals
  // The epsilon keeps float noise (0.29 * 100 = 28.999…) from losing a digit.
  return (Math.floor(value * factor + 1e-9) / factor).toFixed(decimals)
}
