import {
  ArrowDown,
  ArrowUp,
  Download,
  EllipsisVertical,
  LogOut,
  Search,
} from "lucide-react"

import type { ServerState } from "@/api/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatSpeed } from "@/lib/format"

export type View = "downloads" | "search"

export function AppHeader({
  view,
  onViewChange,
  serverState,
  onLogout,
}: {
  view: View
  onViewChange: (view: View) => void
  serverState: ServerState
  onLogout: () => void
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background px-4 py-2">
      {/* Icons only on phones, where the labels would not fit. */}
      <Tabs value={view} onValueChange={(value) => onViewChange(value as View)}>
        <TabsList>
          <TabsTrigger value="downloads" aria-label="Downloads">
            <Download />
            <span className="hidden sm:inline">Downloads</span>
          </TabsTrigger>
          <TabsTrigger value="search" aria-label="Search">
            <Search />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="ml-auto flex gap-3 text-sm text-muted-foreground tabular-nums">
        <span className="flex items-center gap-1">
          <ArrowDown className="size-4" />
          <span className="sr-only">Download speed</span>
          {formatSpeed(serverState.dl_info_speed)}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUp className="size-4" />
          <span className="sr-only">Upload speed</span>
          {formatSpeed(serverState.up_info_speed)}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Menu" />}
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onLogout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
