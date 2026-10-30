import { useMemo, useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import type { Torrent } from "@/api/types"
import { StateLabel } from "@/components/state-label"
import { TorrentActions } from "@/components/torrent-actions"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatBytes,
  formatPeers,
  formatPercent,
  formatRatio,
  formatSpeed,
} from "@/lib/format"
import { etaLabel, stateColors, stateOrder } from "@/lib/torrents"

interface Column {
  title: string
  /** Applied to the header and the cells. */
  className?: string
  /** The first click sorts descending: biggest first. */
  descFirst?: boolean
  compare: (a: Torrent, b: Torrent) => number
  cell: (t: Torrent) => ReactNode
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
})
const byText = (get: (t: Torrent) => string) => (a: Torrent, b: Torrent) =>
  collator.compare(get(a), get(b))
const byNumber = (get: (t: Torrent) => number) => (a: Torrent, b: Torrent) =>
  get(a) - get(b)
// Connected peers first, then the swarm size, like the official WebUI.
const byPeers =
  (get: (t: Torrent) => [number, number]) => (a: Torrent, b: Torrent) => {
    const [a1, a2] = get(a)
    const [b1, b2] = get(b)
    return a1 - b1 || a2 - b2
  }
// -1 means infinite.
const ratioValue = (ratio: number) => (ratio < 0 ? Number.MAX_VALUE : ratio)

const NUMBER = "text-right tabular-nums"

const COLUMNS = {
  name: {
    title: "Name",
    // Takes the free width, and truncates instead of widening the table.
    className: "w-full max-w-0",
    compare: byText((t) => t.name),
    cell: (t) => (
      <span className="block truncate" title={t.name}>
        {t.name}
      </span>
    ),
  },
  size: {
    title: "Size",
    className: NUMBER,
    descFirst: true,
    compare: byNumber((t) => t.size),
    cell: (t) => formatBytes(t.size),
  },
  progress: {
    title: "Progress",
    className: NUMBER,
    descFirst: true,
    compare: byNumber((t) => t.progress),
    cell: (t) => (
      <div className="flex items-center justify-end gap-2">
        <Progress
          value={t.progress * 100}
          aria-label="Progress"
          className="w-16"
          indicatorClassName={stateColors(t.state).bg}
        />
        <span className="w-12">{formatPercent(t.progress)}</span>
      </div>
    ),
  },
  dlspeed: {
    title: "Down",
    className: NUMBER,
    descFirst: true,
    compare: byNumber((t) => t.dlspeed),
    cell: (t) => t.dlspeed > 0 && formatSpeed(t.dlspeed),
  },
  upspeed: {
    title: "Up",
    className: NUMBER,
    descFirst: true,
    compare: byNumber((t) => t.upspeed),
    cell: (t) => t.upspeed > 0 && formatSpeed(t.upspeed),
  },
  eta: {
    title: "ETA",
    className: NUMBER,
    compare: byNumber((t) => t.eta),
    cell: (t) => etaLabel(t),
  },
  seeds: {
    title: "Seeds",
    className: NUMBER,
    descFirst: true,
    compare: byPeers((t) => [t.num_seeds, t.num_complete]),
    cell: (t) => formatPeers(t.num_seeds, t.num_complete),
  },
  peers: {
    title: "Peers",
    className: NUMBER,
    descFirst: true,
    compare: byPeers((t) => [t.num_leechs, t.num_incomplete]),
    cell: (t) => formatPeers(t.num_leechs, t.num_incomplete),
  },
  ratio: {
    title: "Ratio",
    className: NUMBER,
    descFirst: true,
    compare: byNumber((t) => ratioValue(t.ratio)),
    cell: (t) => formatRatio(t.ratio),
  },
  popularity: {
    title: "Popularity",
    className: NUMBER,
    descFirst: true,
    compare: byNumber((t) => ratioValue(t.popularity)),
    cell: (t) => formatRatio(t.popularity),
  },
  category: {
    title: "Category",
    compare: byText((t) => t.category),
    cell: (t) => t.category,
  },
  state: {
    title: "State",
    compare: byNumber((t) => stateOrder(t.state)),
    cell: (t) => <StateLabel state={t.state} />,
  },
} satisfies Record<string, Column>

type ColumnKey = keyof typeof COLUMNS
const COLUMN_KEYS = Object.keys(COLUMNS) as ColumnKey[]

/** Desktop layout. `torrents` come in the default order. */
export function TorrentTable({
  torrents,
  onChanged,
}: {
  torrents: Torrent[]
  onChanged: () => void
}) {
  const [sort, setSort] = useState<{ key: ColumnKey; desc: boolean }>()

  const rows = useMemo(() => {
    if (!sort) return torrents
    const { compare } = COLUMNS[sort.key]
    // sort() is stable: ties keep the default order.
    return [...torrents].sort((a, b) =>
      sort.desc ? compare(b, a) : compare(a, b)
    )
  }, [torrents, sort])

  // Clicking a header cycles: one direction, the other, back to default.
  function toggleSort(key: ColumnKey) {
    const first = Boolean((COLUMNS[key] as Column).descFirst)
    setSort((s) =>
      s?.key !== key
        ? { key, desc: first }
        : s.desc === first
          ? { key, desc: !first }
          : undefined
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMN_KEYS.map((key) => {
            const column: Column = COLUMNS[key]
            const sorted = sort?.key === key ? sort : undefined
            return (
              <TableHead
                key={key}
                className={column.className}
                aria-sort={
                  sorted ? (sorted.desc ? "descending" : "ascending") : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => toggleSort(key)}
                  className="inline-flex items-center gap-1 hover:text-muted-foreground"
                >
                  {column.title}
                  {sorted &&
                    (sorted.desc ? (
                      <ArrowDown className="size-3.5" />
                    ) : (
                      <ArrowUp className="size-3.5" />
                    ))}
                </button>
              </TableHead>
            )
          })}
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.hash}>
            {COLUMN_KEYS.map((key) => {
              const column: Column = COLUMNS[key]
              return (
                <TableCell key={key} className={column.className}>
                  {column.cell(t)}
                </TableCell>
              )
            })}
            <TableCell className="py-0">
              <div className="flex">
                <TorrentActions torrent={t} compact onChanged={onChanged} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
