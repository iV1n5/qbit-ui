import { useMemo, useState } from "react"
import { LoaderCircle } from "lucide-react"

import type { Torrent } from "@/api/types"
import { TorrentDrawer } from "@/components/torrent-drawer"
import { TorrentList } from "@/components/torrent-list"
import { TorrentTable } from "@/components/torrent-table"
import { compareDefault } from "@/lib/torrents"

/** The home view: a list on phones, a sortable table from `md` up. */
export function Downloads({
  torrents,
  loading,
  onChanged,
}: {
  torrents: Torrent[]
  loading: boolean
  /** Called after an action on a torrent, to refresh the data. */
  onChanged: () => void
}) {
  const sorted = useMemo(() => [...torrents].sort(compareDefault), [torrents])
  // The selection outlives the sheet, so that it closes with its content.
  const [selectedHash, setSelectedHash] = useState<string>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const selected = torrents.find((t) => t.hash === selectedHash)

  if (loading) {
    return (
      <p role="status" className="mt-16 flex justify-center text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin" />
        <span className="sr-only">Loading</span>
      </p>
    )
  }
  if (sorted.length === 0) {
    return (
      <p className="mt-16 text-center text-sm text-muted-foreground">
        No torrents.
      </p>
    )
  }
  return (
    <>
      <div className="md:hidden">
        <TorrentList
          torrents={sorted}
          onSelect={(hash) => {
            setSelectedHash(hash)
            setSheetOpen(true)
          }}
        />
        <TorrentDrawer
          torrent={selected}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onChanged={onChanged}
        />
      </div>
      <div className="hidden md:block">
        <TorrentTable torrents={sorted} onChanged={onChanged} />
      </div>
    </>
  )
}
