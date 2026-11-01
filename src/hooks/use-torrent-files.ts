import { useCallback, useEffect, useRef, useState } from "react"

import { errorMessage, getTorrentFiles, setFilePriority } from "@/api/client"
import type { TorrentFile } from "@/api/types"
import { toast } from "@/components/ui/toast"

// As often as the official WebUI refreshes its file list.
const REFRESH_INTERVAL_MS = 5000

/**
 * A torrent's files, refreshed every 5 s while mounted. `setPriority` shows
 * the change at once and undoes it if qBittorrent refuses it.
 */
export function useTorrentFiles(hash: string) {
  const [files, setFiles] = useState<TorrentFile[]>()
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(() => {})

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // Only the latest request counts: an older answer could undo a change.
    let latest = 0

    async function load() {
      clearTimeout(timer)
      const request = ++latest
      if (!document.hidden) {
        try {
          const result = await getTorrentFiles(hash)
          if (cancelled || request !== latest) return
          setFiles(result)
          setError(null)
        } catch (err) {
          if (cancelled || request !== latest) return
          setError(errorMessage(err))
        }
      }
      timer = setTimeout(load, REFRESH_INTERVAL_MS)
    }

    loadRef.current = () => void load()
    void load()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [hash])

  const setPriority = useCallback(
    async (indexes: number[], priority: number) => {
      setFiles((current) =>
        current?.map((f) => (indexes.includes(f.index) ? { ...f, priority } : f))
      )
      try {
        await setFilePriority(hash, indexes, priority)
      } catch (err) {
        toast.add({
          type: "error",
          title: "Could not change the file priority",
          description: errorMessage(err),
        })
      }
      // Either way, show what qBittorrent has now.
      loadRef.current()
    },
    [hash]
  )

  return { files, error, setPriority }
}
