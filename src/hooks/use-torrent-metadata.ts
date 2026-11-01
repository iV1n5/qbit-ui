import { useEffect, useState } from "react"

import { errorMessage, fetchMetadata } from "@/api/client"
import { NORMAL, type FileItem } from "@/lib/files"

// How often the official WebUI asks again while the metadata is on its way.
const RETRY_MS = 1000

/**
 * The files of a torrent about to be added. `files` stays undefined while
 * qBittorrent gets them (from the peers, for a magnet), which may never end.
 */
export function useTorrentMetadata(source: string, engine: string) {
  const [files, setFiles] = useState<FileItem[]>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function load() {
      try {
        const { pending, metadata } = await fetchMetadata(source, engine)
        if (cancelled) return
        if (pending || !metadata.info) {
          timer = setTimeout(load, RETRY_MS)
          return
        }
        setFiles(
          (metadata.info.files ?? []).map((f, index) => ({
            index,
            name: f.path,
            size: f.length,
            // qBittorrent pre-skips files matching its excluded-names filter.
            priority: f.priority ?? NORMAL,
          }))
        )
      } catch (err) {
        if (!cancelled) setError(errorMessage(err))
      }
    }

    void load()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, engine])

  return { files, error }
}
