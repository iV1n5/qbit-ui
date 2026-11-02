import { useEffect, useState } from "react"

import { getPieceAvailability, getPieceStates } from "@/api/client"

// As often as the official WebUI refreshes its General tab.
const REFRESH_INTERVAL_MS = 5000

/** A torrent's piece states and availability, refreshed every 5 s while mounted. */
export function useTorrentPieces(hash: string) {
  const [pieces, setPieces] = useState<{ states: number[]; availability: number[] }>()

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function load() {
      if (!document.hidden) {
        try {
          const [states, availability] = await Promise.all([
            getPieceStates(hash),
            getPieceAvailability(hash),
          ])
          if (!cancelled) setPieces({ states, availability })
        } catch {
          // Keep the last bars: the main polling reports connection problems.
        }
      }
      if (!cancelled) timer = setTimeout(load, REFRESH_INTERVAL_MS)
    }

    void load()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [hash])

  return pieces
}
