import { useEffect, useMemo, useState, type FormEvent } from "react"
import { LoaderCircle } from "lucide-react"

import {
  getCategories,
  getDefaultSavePath,
  getSearchPlugins,
} from "@/api/client"
import type { SearchResult } from "@/api/types"
import {
  AddTorrentDialog,
  type SaveTargets,
} from "@/components/add-torrent-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSearch } from "@/hooks/use-search"
import {
  compareResults,
  resultCount,
  resultSite,
  resultSize,
  resultSummary,
} from "@/lib/search"

/** Searches with qBittorrent's plugins; picking a result offers to add it. */
export function SearchView({ onAdded }: { onAdded: () => void }) {
  const search = useSearch()
  const [pluginsEnabled, setPluginsEnabled] = useState<boolean>()
  const [targets, setTargets] = useState<SaveTargets>()
  // The selection outlives the dialog, so that it closes with its content.
  const [selected, setSelected] = useState<SearchResult>()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Results only get appended, so their index is a stable key.
  const results = useMemo(
    () =>
      search.results
        .map((result, id) => ({ id, result }))
        .sort((a, b) => compareResults(a.result, b.result)),
    [search.results]
  )

  useEffect(() => {
    // On failure these stay unknown: searching still works, or says why.
    getSearchPlugins().then(
      (plugins) => setPluginsEnabled(plugins.some((p) => p.enabled)),
      () => {}
    )
    Promise.all([getCategories(), getDefaultSavePath()]).then(
      ([categories, defaultSavePath]) =>
        setTargets({ categories, defaultSavePath }),
      () => {}
    )
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const pattern = String(new FormData(event.currentTarget).get("pattern"))
    if (pattern.trim()) void search.start(pattern.trim())
  }

  function select(result: SearchResult) {
    setSelected(result)
    setDialogOpen(true)
  }

  if (pluginsEnabled === false) {
    return (
      <p className="mx-auto mt-16 max-w-sm px-4 text-center text-sm text-muted-foreground">
        No search plugin is enabled. Enable some in qBittorrent's official
        WebUI, under Search → Search plugins.
      </p>
    )
  }

  const count = results.length
  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        <Input
          name="pattern"
          type="search"
          enterKeyHint="search"
          placeholder="Search torrents"
          aria-label="Search torrents"
          autoComplete="off"
          required
        />
        {search.status === "running" ? (
          <Button type="button" variant="outline" onClick={search.stop}>
            Stop
          </Button>
        ) : (
          <Button type="submit">Search</Button>
        )}
      </form>

      <p
        role="status"
        className="flex items-center gap-2 px-4 pb-2 text-sm text-muted-foreground"
      >
        {search.status === "running" && (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Searching…{count > 0 && ` ${count} results`}
          </>
        )}
        {search.status === "done" &&
          (count > 0 ? `${count} results` : "No results.")}
        {search.error && (
          <span className="text-destructive">{search.error}</span>
        )}
      </p>

      {count > 0 && (
        <>
          <ul className="divide-y border-t md:hidden">
            {results.map(({ id, result }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => select(result)}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left active:bg-muted"
                >
                  <span className="line-clamp-2 text-sm wrap-anywhere">
                    {result.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {resultSummary(result)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full max-w-0">Name</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Seeds</TableHead>
                  <TableHead className="text-right">Leechers</TableHead>
                  <TableHead>Site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(({ id, result }) => (
                  // The name is a button for the keyboard; its click bubbles here.
                  <TableRow
                    key={id}
                    onClick={() => select(result)}
                    className="cursor-pointer"
                  >
                    <TableCell className="w-full max-w-0">
                      <button
                        type="button"
                        className="block w-full truncate text-left"
                        title={result.fileName}
                      >
                        {result.fileName}
                      </button>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {resultSize(result)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {resultCount(result.nbSeeders)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {resultCount(result.nbLeechers)}
                    </TableCell>
                    <TableCell>{resultSite(result)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AddTorrentDialog
        key={selected?.fileUrl}
        result={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targets={targets}
        onAdded={onAdded}
      />
    </>
  )
}
