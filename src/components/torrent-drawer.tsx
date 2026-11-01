import { Fragment, type CSSProperties } from "react"
import { X } from "lucide-react"

import type { Torrent } from "@/api/types"
import { StateLabel } from "@/components/state-label"
import { TorrentActions } from "@/components/torrent-actions"
import { TorrentFiles } from "@/components/torrent-files"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  formatBytes,
  formatDate,
  formatPeers,
  formatPercent,
  formatRatio,
  formatSpeed,
} from "@/lib/format"
import { etaLabel } from "@/lib/torrents"

// Wider than the default side panel (24rem): file names are long.
const SIDE_PANEL: CSSProperties = {
  ["--drawer-content-width" as string]: "min(40rem, 90vw)",
}

/**
 * The selected torrent's details, files and actions: a bottom sheet on
 * phones, a panel from the right from `md` up.
 */
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
  const desktop = useMediaQuery("(min-width: 48rem)")
  return (
    <Drawer
      open={open && torrent !== undefined}
      onOpenChange={onOpenChange}
      swipeDirection={desktop ? "right" : "down"}
      showSwipeHandle={!desktop}
    >
      <DrawerContent style={desktop ? SIDE_PANEL : undefined}>
        {torrent && (
          <>
            <DrawerHeader className="md:pr-12">
              <DrawerTitle className="wrap-anywhere">{torrent.name}</DrawerTitle>
              <DrawerDescription>
                <StateLabel state={torrent.state} />
              </DrawerDescription>
            </DrawerHeader>
            {desktop && (
              <DrawerClose
                className="absolute top-3 right-3"
                render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}
              >
                <X />
              </DrawerClose>
            )}
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                {details(torrent).map(([term, value]) => (
                  <Fragment key={term}>
                    <dt className="text-muted-foreground">{term}</dt>
                    <dd className="wrap-anywhere tabular-nums">{value}</dd>
                  </Fragment>
                ))}
              </dl>
              <TorrentFiles hash={torrent.hash} onChanged={onChanged} />
            </div>
            <DrawerFooter className="flex-row border-t pt-4 *:flex-1">
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
