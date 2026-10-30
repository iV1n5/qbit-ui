import { Fragment } from "react"

import type { Torrent } from "@/api/types"
import { StateLabel } from "@/components/state-label"
import { TorrentActions } from "@/components/torrent-actions"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  formatBytes,
  formatDate,
  formatPeers,
  formatPercent,
  formatRatio,
  formatSpeed,
} from "@/lib/format"
import { etaLabel } from "@/lib/torrents"

/** Phone layout: the tapped torrent's details and actions, in a bottom sheet. */
export function TorrentDrawer({
  torrent,
  open,
  onOpenChange,
  onChanged,
}: {
  /** Kept while the sheet closes, so it slides away with its content. */
  torrent: Torrent | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  return (
    <Drawer
      open={open && torrent !== undefined}
      onOpenChange={onOpenChange}
      showSwipeHandle
    >
      <DrawerContent>
        {torrent && (
          <>
            <DrawerHeader>
              <DrawerTitle className="wrap-anywhere">{torrent.name}</DrawerTitle>
              <DrawerDescription>
                <StateLabel state={torrent.state} />
              </DrawerDescription>
            </DrawerHeader>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 overflow-y-auto p-4">
              {details(torrent).map(([term, value]) => (
                <Fragment key={term}>
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="wrap-anywhere tabular-nums">{value}</dd>
                </Fragment>
              ))}
            </dl>
            <DrawerFooter className="flex-row *:flex-1">
              <TorrentActions torrent={torrent} onChanged={onChanged} />
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function details(t: Torrent): [string, string][] {
  return [
    ["Size", formatBytes(t.size)],
    ["Progress", formatPercent(t.progress)],
    ["Download", formatSpeed(t.dlspeed)],
    ["Upload", formatSpeed(t.upspeed)],
    ["ETA", etaLabel(t)],
    ["Category", t.category || "None"],
    ["Save path", t.save_path],
    ["Seeds", formatPeers(t.num_seeds, t.num_complete)],
    ["Peers", formatPeers(t.num_leechs, t.num_incomplete)],
    ["Ratio", formatRatio(t.ratio)],
    ["Added on", formatDate(t.added_on)],
  ]
}
