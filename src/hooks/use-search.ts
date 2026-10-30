import { useCallback, useEffect, useRef, useState } from "react"

import {
  deleteSearch,
  deleteSearchOnUnload,
  errorMessage,
  getSearchResults,
  startSearch,
  stopSearch,
} from "@/api/client"
import type { SearchResult } from "@/api/types"

const POLL_INTERVAL_MS = 1000

interface SearchState {
  /** "running" while the plugins are still answering. */
  status: "idle" | "running" | "done"
  results: SearchResult[]
  error: string | null
}

const IDLE: SearchState = { status: "idle", results: [], error: null }

interface Job {
  stop: () => void
  /** Stops polling and deletes the search from qBittorrent. */
  discard: () => void
  /** Deletes the search as the page goes away. */
  unload: () => void
}

/**
 * One qBittorrent search at a time. `start` replaces the current one; its
 * results are polled every second until it stops. Searches are deleted when
 * replaced and when the component unmounts, since qBittorrent keeps them in
 * memory otherwise.
 */
export function useSearch() {
  const [state, setState] = useState(IDLE)
  const job = useRef<Job>(undefined)

  const start = useCallback(async (pattern: string) => {
    job.current?.discard()
    let id: number | undefined
    let discarded = false
    let timer: ReturnType<typeof setTimeout> | undefined
    job.current = {
      stop: () => {
        if (id !== undefined) stopSearch(id).catch(ignore)
      },
      discard: () => {
        discarded = true
        clearTimeout(timer)
        if (id !== undefined) forget(id)
      },
      unload: () => {
        if (id !== undefined) deleteSearchOnUnload(id)
      },
    }
    setState({ status: "running", results: [], error: null })

    try {
      id = await startSearch(pattern)
    } catch (err) {
      if (!discarded) setState({ ...IDLE, error: errorMessage(err) })
      return
    }
    // Replaced while starting: nobody will look at this one.
    if (discarded) return forget(id)

    const searchId = id
    const results: SearchResult[] = []
    async function poll() {
      try {
        const page = await getSearchResults(searchId, results.length)
        if (discarded) return
        results.push(...page.results)
        const running = page.status === "Running"
        setState({
          status: running ? "running" : "done",
          results: [...results],
          error: null,
        })
        if (running) timer = setTimeout(poll, POLL_INTERVAL_MS)
      } catch (err) {
        if (!discarded) {
          setState({ status: "done", results: [...results], error: errorMessage(err) })
        }
      }
    }
    timer = setTimeout(poll, POLL_INTERVAL_MS)
  }, [])

  const stop = useCallback(() => job.current?.stop(), [])

  useEffect(() => {
    // React cleanups don't run when the whole page goes away.
    const onPageHide = () => job.current?.unload()
    addEventListener("pagehide", onPageHide)
    return () => {
      removeEventListener("pagehide", onPageHide)
      job.current?.discard()
    }
  }, [])

  return { ...state, start, stop }
}

// Either call may fail harmlessly: already stopped, or already gone.
function forget(id: number) {
  stopSearch(id)
    .catch(ignore)
    .then(() => deleteSearch(id))
    .catch(ignore)
}

function ignore() {}
