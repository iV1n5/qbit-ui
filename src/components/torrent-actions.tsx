import { useState } from "react"
import { Pause, Play, Trash2 } from "lucide-react"

import { errorMessage, startTorrent, stopTorrent } from "@/api/client"
import type { Torrent } from "@/api/types"
import { DeleteTorrentDialog } from "@/components/delete-torrent-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { isStopped } from "@/lib/torrents"

/**
 * Start or Pause, whichever applies, and Delete, which asks first.
 * `compact`: icon-only buttons, for table rows.
 */
export function TorrentActions({
  torrent,
  compact = false,
  onChanged,
}: {
  torrent: Torrent
  compact?: boolean
  /** Called after a successful action, to refresh the list. */
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true)
    try {
      await action()
      onChanged()
    } catch (err) {
      toast.add({ type: "error", title: failure, description: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  // qBittorrent 5 calls it Stop, but a stop square next to the trash can
  // reads as a checkbox: the button is Pause, the call still torrents/stop.
  const toggle = isStopped(torrent.state)
    ? { label: "Start", Icon: Play, action: () => startTorrent(torrent.hash) }
    : { label: "Pause", Icon: Pause, action: () => stopTorrent(torrent.hash) }
  const size = compact ? "icon-sm" : "default"

  return (
    <>
      <Button
        variant={compact ? "ghost" : "outline"}
        size={size}
        disabled={busy}
        aria-label={compact ? toggle.label : undefined}
        title={compact ? toggle.label : undefined}
        onClick={() =>
          void run(
            toggle.action,
            `Could not ${toggle.label.toLowerCase()} the torrent`
          )
        }
      >
        <toggle.Icon />
        {!compact && toggle.label}
      </Button>
      <Button
        variant={compact ? "ghost" : "destructive"}
        size={size}
        disabled={busy}
        aria-label={compact ? "Delete" : undefined}
        title={compact ? "Delete" : undefined}
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
        {!compact && "Delete"}
      </Button>
      <DeleteTorrentDialog
        torrent={torrent}
        open={confirming}
        onOpenChange={setConfirming}
        onDeleted={onChanged}
      />
    </>
  )
}
