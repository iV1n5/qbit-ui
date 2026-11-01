import { useState } from "react"

import type { Torrent } from "@/api/types"
import { DeleteTorrentDialog } from "@/components/delete-torrent-dialog"
import { SwipeToDelete } from "@/components/swipe-to-delete"
import { Progress } from "@/components/ui/progress"
import { etaLabel, stateColors } from "@/lib/torrents"
import { cn } from "@/lib/utils"

/**
 * Phone layout: name and ETA, colored by state, with a thin progress bar
 * under each row. Tapping a row selects it; swiping it left offers to
 * delete it.
 */
export function TorrentList({
  torrents,
  onSelect,
  onChanged,
}: {
  torrents: Torrent[]
  onSelect: (hash: string) => void
  /** Called after a deletion, to refresh the list. */
  onChanged: () => void
}) {
  // The torrent outlives the dialog, so that it closes with its content.
  const [deleting, setDeleting] = useState<Torrent>()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <ul className="divide-y">
        {torrents.map((t) => {
          const colors = stateColors(t.state)
          return (
            <li key={t.hash}>
              <SwipeToDelete
                onSwipe={() => {
                  setDeleting(t)
                  setConfirmOpen(true)
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(t.hash)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left active:bg-muted"
                >
                  <span className="flex items-start justify-between gap-3 text-sm">
                    <span className="line-clamp-2 wrap-anywhere">{t.name}</span>
                    <span className={cn("shrink-0 tabular-nums", colors.text)}>
                      {etaLabel(t)}
                    </span>
                  </span>
                  <Progress
                    value={t.progress * 100}
                    aria-label="Progress"
                    indicatorClassName={colors.bg}
                  />
                </button>
              </SwipeToDelete>
            </li>
          )
        })}
      </ul>
      <DeleteTorrentDialog
        torrent={deleting}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onDeleted={onChanged}
      />
    </>
  )
}
