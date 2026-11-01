import { useMemo } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  commonFolder,
  compareFiles,
  FILE_PRIORITIES,
  NORMAL,
  SKIP,
  splitPath,
  type FileItem,
} from "@/lib/files"
import { formatBytes, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Files with a checkbox (download it or not) and a priority each, sorted by
 * path. A torrent can't drop a file: unticking it ("Do not download") is how
 * qBittorrent skips it.
 */
export function FileList({
  files,
  onChange,
}: {
  files: FileItem[]
  onChange: (index: number, priority: number) => void
}) {
  const sorted = useMemo(() => [...files].sort(compareFiles), [files])
  // Every file is usually inside the torrent's own folder: don't repeat it.
  const root = commonFolder(sorted)

  return (
    <ul className="divide-y">
      {sorted.map((f) => {
        const { folder, file } = splitPath(f.name.slice(root.length))
        const skipped = f.priority === SKIP
        const details = [folder, formatBytes(f.size)]
        if (f.progress !== undefined) details.push(formatPercent(f.progress))
        return (
          <li key={f.index} className="flex items-start gap-3 py-2">
            <Checkbox
              className="mt-0.5"
              checked={!skipped}
              onCheckedChange={(checked) =>
                onChange(f.index, checked ? NORMAL : SKIP)
              }
              aria-label={`Download ${file}`}
            />
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col gap-1",
                skipped && "text-muted-foreground"
              )}
            >
              <span className="wrap-anywhere">{file}</span>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-xs text-muted-foreground tabular-nums wrap-anywhere">
                  {details.filter(Boolean).join(" · ")}
                </span>
                <NativeSelect
                  size="sm"
                  value={String(f.priority)}
                  onChange={(e) => onChange(f.index, Number(e.target.value))}
                  aria-label={`Priority of ${file}`}
                >
                  {FILE_PRIORITIES.map((p) => (
                    <NativeSelectOption key={p.value} value={p.value}>
                      {p.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
