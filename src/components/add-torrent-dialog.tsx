import { useState } from "react"

import { addTorrent, ApiError, errorMessage } from "@/api/client"
import type { Category, SearchResult } from "@/api/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { toast } from "@/components/ui/toast"
import { resultSummary } from "@/lib/search"

export interface SaveTargets {
  categories: Record<string, Category>
  defaultSavePath: string
}

// A convenience, not a credential: localStorage is fine.
const LAST_CATEGORY_KEY = "qbit-ui:last-category"

/**
 * Confirms adding a search result, with a category picker and the folder
 * the download will end up in. Mount it with a `key` per result, so that
 * each opening starts from the last category used.
 */
export function AddTorrentDialog({
  result,
  open,
  onOpenChange,
  targets,
  onAdded,
}: {
  /** Kept while the dialog closes, so it fades out with its content. */
  result: SearchResult | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Undefined while loading. */
  targets: SaveTargets | undefined
  onAdded: () => void
}) {
  const [category, setCategory] = useState(readLastCategory)
  const [busy, setBusy] = useState(false)
  const categories = targets?.categories ?? {}
  // The remembered category may have been deleted since.
  const chosen = category in categories ? category : ""
  const names = Object.keys(categories).sort((a, b) => a.localeCompare(b))

  async function handleAdd(result: SearchResult) {
    setBusy(true)
    try {
      await addTorrent(result.fileUrl, result.engineName, chosen)
      writeLastCategory(chosen)
      toast.add({ type: "success", title: "Added", description: result.fileName })
      onAdded()
    } catch (err) {
      toast.add({
        type: "error",
        title: "Could not add the torrent",
        description:
          err instanceof ApiError && err.status === 409
            ? "qBittorrent refused it: it may already be in the list."
            : errorMessage(err),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open && result !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        {result && (
          <>
            <DialogHeader>
              <DialogTitle className="wrap-anywhere">{result.fileName}</DialogTitle>
              <DialogDescription>{resultSummary(result, true)}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-category">Category</Label>
              <NativeSelect
                id="add-category"
                className="w-full"
                value={chosen}
                onChange={(e) => setCategory(e.target.value)}
              >
                <NativeSelectOption value="">No category</NativeSelectOption>
                {names.map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {targets && (
                <p className="text-sm text-muted-foreground">
                  Saved to{" "}
                  <span className="wrap-anywhere text-foreground">
                    {savePath(chosen, targets)}
                  </span>
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button disabled={busy} onClick={() => void handleAdd(result)}>
                Add
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** As the official WebUI: a category without a path gets a subfolder. */
function savePath(category: string, { categories, defaultSavePath }: SaveTargets) {
  if (!category) return defaultSavePath
  return categories[category].savePath || `${defaultSavePath}/${category}`
}

// Storage can be unavailable (e.g. private browsing): then nothing is remembered.
function readLastCategory() {
  try {
    return localStorage.getItem(LAST_CATEGORY_KEY) ?? ""
  } catch {
    return ""
  }
}

function writeLastCategory(category: string) {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, category)
  } catch {
    // not remembered
  }
}
