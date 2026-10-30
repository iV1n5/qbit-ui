import type { Torrent, TorrentState } from "@/api/types"
import { formatDuration } from "@/lib/format"

/** The ETA qBittorrent sends when it has no estimate (100 days). */
export const MAX_ETA = 8640000

// The groups of the official WebUI's "Downloading" and "Completed" filters:
// any *DL state is still downloading, any *UP state has finished.
export function isDownloading(state: TorrentState) {
  return state === "downloading" || state.includes("DL")
}

export function isCompleted(state: TorrentState) {
  return state === "uploading" || state.includes("UP")
}

export function isErrored(state: TorrentState) {
  return state === "error" || state === "missingFiles"
}

/** Stopped by the user: the one case where "Start" applies. */
export function isStopped(state: TorrentState) {
  return state === "stoppedDL" || state === "stoppedUP"
}

// Colors at a glance: green downloading, orange waiting (stalled, queued,
// metadata, checking, moving), blue finished, gray stopped, red error.
const COLORS = {
  downloading: {
    text: "text-green-600 dark:text-green-500",
    bg: "bg-green-600 dark:bg-green-500",
  },
  waiting: { text: "text-amber-600 dark:text-amber-500", bg: "bg-amber-500" },
  finished: { text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/70" },
  stopped: { text: "text-muted-foreground", bg: "bg-muted-foreground/50" },
  error: { text: "text-destructive", bg: "bg-destructive" },
}

/** Tailwind classes for the state's color: `text` for labels, `bg` for bars and dots. */
export function stateColors(state: TorrentState) {
  if (isErrored(state)) return COLORS.error
  if (state === "downloading" || state === "forcedDL") return COLORS.downloading
  if (isCompleted(state) && state !== "checkingUP") return COLORS.finished
  if (state === "stoppedDL" || state === "unknown") return COLORS.stopped
  return COLORS.waiting
}

/** What the ETA column shows: a duration, or why there is none. */
export function etaLabel({ state, eta }: Torrent) {
  if (isErrored(state)) return "Error"
  if (isCompleted(state)) return "Done"
  if (state === "stoppedDL") return "Stopped"
  if (state === "queuedDL") return "Queued"
  if (eta >= MAX_ETA) return "∞"
  return formatDuration(eta)
}

/**
 * Default order: torrents still downloading first, soonest ETA first (no
 * estimate last); then the others, most recently added first.
 */
export function compareDefault(a: Torrent, b: Torrent) {
  const aDownloading = isDownloading(a.state)
  if (aDownloading !== isDownloading(b.state)) return aDownloading ? -1 : 1
  if (aDownloading && a.eta !== b.eta) return a.eta - b.eta
  return b.added_on - a.added_on
}

// Names and sort order of the states, as in the official WebUI.
const STATES: Record<TorrentState, { label: string; order: number }> = {
  unknown: { label: "Unknown", order: -1 },
  forcedDL: { label: "[F] Downloading", order: 0 },
  downloading: { label: "Downloading", order: 1 },
  forcedMetaDL: { label: "[F] Downloading metadata", order: 2 },
  metaDL: { label: "Downloading metadata", order: 3 },
  stalledDL: { label: "Stalled", order: 4 },
  forcedUP: { label: "[F] Seeding", order: 5 },
  uploading: { label: "Seeding", order: 6 },
  stalledUP: { label: "Seeding", order: 7 },
  checkingResumeData: { label: "Checking resume data", order: 8 },
  queuedDL: { label: "Queued", order: 9 },
  queuedUP: { label: "Queued", order: 10 },
  checkingUP: { label: "Checking", order: 11 },
  checkingDL: { label: "Checking", order: 12 },
  stoppedDL: { label: "Stopped", order: 13 },
  stoppedUP: { label: "Completed", order: 14 },
  moving: { label: "Moving", order: 15 },
  missingFiles: { label: "Missing files", order: 16 },
  error: { label: "Errored", order: 17 },
}

// A state added by a newer qBittorrent is shown as unknown.
export function stateLabel(state: TorrentState) {
  return STATES[state]?.label ?? "Unknown"
}

export function stateOrder(state: TorrentState) {
  return STATES[state]?.order ?? -1
}
