import { useState } from "react"

import { deleteTorrent, errorMessage } from "@/api/client"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"

/** Asks before deleting a torrent, and whether to delete its files too. */
export function DeleteTorrentDialog({
  torrent,
  open,
  onOpenChange,
  onDeleted,
}: {
  /** Kept while the dialog closes, so it fades out with its content. */
  torrent: Torrent | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  // Off again at every closing: deleting files must be chosen each time.
  const [deleteFiles, setDeleteFiles] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) setDeleteFiles(false)
    onOpenChange(next)
  }

  async function handleDelete(torrent: Torrent) {
    const withFiles = deleteFiles
    handleOpenChange(false)
    try {
      await deleteTorrent(torrent.hash, withFiles)
      onDeleted()
    } catch (err) {
      toast.add({
        type: "error",
        title: "Could not delete the torrent",
        description: errorMessage(err),
      })
    }
  }

  return (
    <AlertDialog open={open && torrent !== undefined} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        {torrent && (
          <>
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
                onClick={() => void handleDelete(torrent)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
