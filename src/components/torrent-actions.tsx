import { useState } from "react"
import { Play, Square, Trash2 } from "lucide-react"

import {
  deleteTorrent,
  errorMessage,
  startTorrent,
  stopTorrent,
} from "@/api/client"
import type { Torrent } from "@/api/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { isStopped } from "@/lib/torrents"

/**
 * Start or Stop, whichever applies, and Delete, which asks first.
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
  const [deleteFiles, setDeleteFiles] = useState(false)

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

  const toggle = isStopped(torrent.state)
    ? { label: "Start", Icon: Play, action: () => startTorrent(torrent.hash) }
    : { label: "Stop", Icon: Square, action: () => stopTorrent(torrent.hash) }
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
        onClick={() => {
          setDeleteFiles(false)
          setConfirming(true)
        }}
      >
        <Trash2 />
        {!compact && "Delete"}
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this torrent?</AlertDialogTitle>
            <AlertDialogDescription className="wrap-anywhere">
              {torrent.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Label>
            <Checkbox checked={deleteFiles} onCheckedChange={setDeleteFiles} />
            Also delete the downloaded files
          </Label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirming(false)
                void run(
                  () => deleteTorrent(torrent.hash, deleteFiles),
                  "Could not delete the torrent"
                )
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
