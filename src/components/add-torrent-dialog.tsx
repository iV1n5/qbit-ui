import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"

import {
  addTorrent,
  ApiError,
  errorMessage,
  getCategories,
  getDefaultSavePath,
} from "@/api/client"
import type { Category, SearchResult } from "@/api/types"
import { FileList } from "@/components/file-list"
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
import { useTorrentMetadata } from "@/hooks/use-torrent-metadata"
import { SKIP } from "@/lib/files"
import { formatBytes } from "@/lib/format"
import { resultSummary } from "@/lib/search"

interface SaveTargets {
  categories: Record<string, Category>
  defaultSavePath: string
}

// A convenience, not a credential: localStorage is fine.
const LAST_CATEGORY_KEY = "qbit-ui:last-category"

/**
 * Confirms adding a search result: category, the folder it will end up in,
 * and which files to download once qBittorrent has the file list.
 */
export function AddTorrentDialog({
  result,
  open,
  onOpenChange,
  onAdded,
}: {
  /** Kept while the dialog closes, so it fades out with its content. */
  result: SearchResult | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}) {
  return (
    <Dialog open={open && result !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted at each opening: fresh categories, last category used. */}
        {result && (
          <AddTorrentForm key={result.fileUrl} result={result} onAdded={onAdded} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AddTorrentForm({
  result,
  onAdded,
}: {
  result: SearchResult
  onAdded: () => void
}) {
  const [category, setCategory] = useState(readLastCategory)
  const [targets, setTargets] = useState<SaveTargets>()
  const metadata = useTorrentMetadata(result.fileUrl, result.engineName)
  // The user's choices, over the priorities qBittorrent proposes.
  const [priorities, setPriorities] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // On failure the picker just offers "No category".
    Promise.all([getCategories(), getDefaultSavePath()]).then(
      ([categories, defaultSavePath]) =>
        setTargets({ categories, defaultSavePath }),
      () => {}
    )
  }, [])

  const categories = targets?.categories ?? {}
  // The remembered category may have been deleted since.
  const chosen = category in categories ? category : ""
  const names = Object.keys(categories).sort((a, b) => a.localeCompare(b))

  const files = metadata.files?.map((f) => ({
    ...f,
    priority: priorities[f.index] ?? f.priority,
  }))
  const wanted = files?.filter((f) => f.priority !== SKIP) ?? []

  async function handleAdd() {
    setBusy(true)
    try {
      await addTorrent(
        result.fileUrl,
        result.engineName,
        chosen,
        // Files come in index order, as filePriorities wants them.
        files?.map((f) => f.priority)
      )
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

      <section className="flex flex-col gap-2 text-sm">
        <h3 className="font-medium">Files</h3>
        {metadata.error ? (
          <p className="text-muted-foreground">
            No file list ({metadata.error}): Add downloads them all.
          </p>
        ) : files === undefined ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-4 shrink-0 animate-spin" />
            Fetching the file list… You can add it now and choose later.
          </p>
        ) : (
          <>
            <p className="text-muted-foreground tabular-nums">
              {wanted.length} of {files.length} files,{" "}
              {formatBytes(wanted.reduce((sum, f) => sum + f.size, 0))}
            </p>
            <div className="max-h-64 overflow-y-auto">
              <FileList
                files={files}
                onChange={(index, priority) =>
                  setPriorities((p) => ({ ...p, [index]: priority }))
                }
              />
            </div>
          </>
        )}
      </section>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button
          disabled={busy || (files !== undefined && wanted.length === 0)}
          onClick={() => void handleAdd()}
        >
          Add
        </Button>
      </DialogFooter>
    </>
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
