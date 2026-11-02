import type { CSSProperties, ReactNode } from "react"
import { X } from "lucide-react"

import type { Torrent } from "@/api/types"
import {
  PiecesAvailabilityBar,
  PiecesProgressBar,
} from "@/components/pieces-bar"
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
import { useTorrentPieces } from "@/hooks/use-torrent-pieces"
import {
  formatAvailability,
  formatBytes,
  formatDate,
  formatPeers,
  formatPercent,
  formatRatio,
  formatSpeed,
} from "@/lib/format"
import { availabilityRange } from "@/lib/pieces"
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
              <TorrentDetails torrent={torrent} />
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

// A stable empty list while the pieces load, so the bars don't redraw for nothing.
const NO_PIECES: number[] = []

/** The details list, with pieces bars for progress and availability. */
function TorrentDetails({ torrent: t }: { torrent: Torrent }) {
  const pieces = useTorrentPieces(t.hash)
  const range = pieces && availabilityRange(pieces.availability)
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      <Row term="Size">{formatBytes(t.size)}</Row>
      <Row term="Progress">
        <PiecesProgressBar states={pieces?.states ?? NO_PIECES} />
        <BarValue>{formatPercent(t.progress)}</BarValue>
      </Row>
      <Row term="Availability">
        <PiecesAvailabilityBar availability={pieces?.availability ?? NO_PIECES} />
        <BarValue>{formatAvailability(t.availability)}</BarValue>
        {/* The bar's shades are relative to this range: say what it is. */}
        {range && (
          <span className="basis-full text-xs text-muted-foreground">
            {range.max === 0
              ? "No peer has any piece"
              : range.min === range.max
                ? `${range.max} peers per piece`
                : `${range.min}–${range.max} peers per piece`}
          </span>
        )}
      </Row>
      <Row term="Download">{formatSpeed(t.dlspeed)}</Row>
      <Row term="Upload">{formatSpeed(t.upspeed)}</Row>
      <Row term="ETA">{etaLabel(t)}</Row>
      <Row term="Category">{t.category || "None"}</Row>
      <Row term="Save path">{t.save_path}</Row>
      <Row term="Seeds">{formatPeers(t.num_seeds, t.num_complete)}</Row>
      <Row term="Peers">{formatPeers(t.num_leechs, t.num_incomplete)}</Row>
      <Row term="Ratio">{formatRatio(t.ratio)}</Row>
      <Row term="Added on">{formatDate(t.added_on)}</Row>
    </dl>
  )
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="flex flex-wrap items-center gap-x-3 gap-y-1 wrap-anywhere tabular-nums">
        {children}
      </dd>
    </>
  )
}

/** The value after a bar: fixed width, so the two bars line up. */
function BarValue({ children }: { children: string }) {
  return <span className="w-14 shrink-0 text-right">{children}</span>
}
