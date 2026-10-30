import type { TorrentState } from "@/api/types"
import { stateColors, stateLabel } from "@/lib/torrents"
import { cn } from "@/lib/utils"

/** The state's name, after a dot of its color. */
export function StateLabel({ state }: { state: TorrentState }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("size-2 shrink-0 rounded-full", stateColors(state).bg)}
      />
      {stateLabel(state)}
    </span>
  )
}
