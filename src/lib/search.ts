import type { SearchResult } from "@/api/types"
import { formatBytes } from "@/lib/format"

// Plugins send -1 for what the site doesn't say.
export function resultSize(r: SearchResult) {
  return r.fileSize >= 0 ? formatBytes(r.fileSize) : "?"
}

export function resultCount(n: number) {
  return n >= 0 ? String(n) : "?"
}

/** "thepiratebay.org" from the plugin's site URL. */
export function resultSite(r: SearchResult) {
  try {
    return new URL(r.siteUrl).host.replace(/^www\./, "")
  } catch {
    return r.engineName
  }
}

/** "1.23 GB · 45 seeds", plus the site if asked. */
export function resultSummary(r: SearchResult, withSite = false) {
  const parts = [resultSize(r), `${resultCount(r.nbSeeders)} seeds`]
  if (withSite) parts.push(resultSite(r))
  return parts.join(" · ")
}

/** Most seeders first; unknown counts (-1) last. */
export function compareResults(a: SearchResult, b: SearchResult) {
  return b.nbSeeders - a.nbSeeders
}
