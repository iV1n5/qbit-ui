import { useCallback, useEffect, useRef, useState } from "react"

import { ApiError, errorMessage, getMainData } from "@/api/client"
import { EMPTY_STORE, mergeMainData } from "@/api/maindata"
import type { ServerState, Torrent } from "@/api/types"

const POLL_INTERVAL_MS = 2000

interface MainDataState {
  /** "loading" until the first answer; "loggedOut" stops the polling. */
  status: "loading" | "ready" | "loggedOut"
  torrents: Torrent[]
  serverState: ServerState
  /** Why the last poll failed, while it keeps retrying; null when fine. */
  error: string | null
}

const INITIAL: MainDataState = {
  status: "loading",
  torrents: [],
  serverState: EMPTY_STORE.serverState,
  error: null,
}

/**
 * Torrents and global speeds from sync/maindata, polled every 2 s while the
 * page is visible. `pollNow` refreshes right away (after an action);
 * `restart` starts over with a full update (after a login).
 */
export function useMainData() {
  const [state, setState] = useState(INITIAL)
  const [session, setSession] = useState(0)
  const pollNowRef = useRef(() => {})

  useEffect(() => {
    const controller = new AbortController()
    let store = EMPTY_STORE
    let rid = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false
    let stopped = false
    let pollAgain = false

    async function poll() {
      timer = undefined
      inFlight = true
      try {
        const data = await getMainData(rid, controller.signal)
        rid = data.rid
        store = mergeMainData(store, data)
        setState({
          status: "ready",
          torrents: Object.values(store.torrents),
          serverState: store.serverState,
          error: null,
        })
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof ApiError && err.status === 403) {
          stopped = true
          setState({ ...INITIAL, status: "loggedOut" })
          return
        }
        setState((prev) => ({ ...prev, error: errorMessage(err) }))
      } finally {
        inFlight = false
      }
      if (pollAgain) {
        pollAgain = false
        void poll()
      } else {
        schedule()
      }
    }

    // Poll only while the page is visible, and catch up as soon as it is.
    function schedule() {
      if (!stopped && !document.hidden) {
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    function onVisibilityChange() {
      clearTimeout(timer)
      timer = undefined
      if (!document.hidden && !inFlight && !stopped) void poll()
    }

    pollNowRef.current = () => {
      if (stopped) return
      // A request already on its way may predate the action: ask again after it.
      if (inFlight) {
        pollAgain = true
        return
      }
      clearTimeout(timer)
      void poll()
    }

    void poll()
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      stopped = true
      controller.abort()
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [session])

  const pollNow = useCallback(() => pollNowRef.current(), [])

  const restart = useCallback(() => {
    setState(INITIAL)
    setSession((s) => s + 1)
  }, [])

  return { ...state, pollNow, restart }
}
