// qBittorrent 5.3 WebAPI responses. Only the fields this UI reads are listed:
// the server sends more.

/** Torrent states. In 5.x `paused*` became `stopped*`. */
export type TorrentState =
  | "error"
  | "missingFiles"
  | "uploading"
  | "stoppedUP"
  | "queuedUP"
  | "stalledUP"
  | "checkingUP"
  | "forcedUP"
  | "downloading"
  | "metaDL"
  | "forcedMetaDL"
  | "stoppedDL"
  | "queuedDL"
  | "stalledDL"
  | "checkingDL"
  | "forcedDL"
  | "checkingResumeData"
  | "moving"
  | "unknown"

export interface Torrent {
  hash: string
  name: string
  /** Bytes, counting only the files selected for download. */
  size: number
  /** From 0 to 1. */
  progress: number
  /** Bytes per second. */
  dlspeed: number
  upspeed: number
  /** Seconds; MAX_ETA (8640000) when there is no estimate. */
  eta: number
  state: TorrentState
  /** Empty when uncategorized. */
  category: string
  save_path: string
  /** Unix time, seconds. */
  added_on: number
  /** -1 when infinite. */
  ratio: number
  /** Ratio per month of activity; -1 when infinite. */
  popularity: number
  /** Seeds and leechers we are connected to, and in the whole swarm. */
  num_seeds: number
  num_complete: number
  num_leechs: number
  num_incomplete: number
}

export interface ServerState {
  /** Global speeds, bytes per second. */
  dl_info_speed: number
  up_info_speed: number
}

export interface Category {
  name: string
  /** Empty: the default save path plus the category name. */
  savePath: string
}

export interface SearchPlugin {
  name: string
  enabled: boolean
}

export interface SearchResult {
  fileName: string
  /** A magnet link or a .torrent URL. */
  fileUrl: string
  /** Bytes. This and the counts are -1 when the site doesn't say. */
  fileSize: number
  nbSeeders: number
  nbLeechers: number
  /** The plugin that found it, which may be needed to download `fileUrl`. */
  engineName: string
  siteUrl: string
}

/** `search/results`: the results from the requested offset on. */
export interface SearchResults {
  status: "Running" | "Stopped"
  results: SearchResult[]
  total: number
}

/**
 * `sync/maindata`: what changed since the response with the `rid` we sent,
 * or everything when `full_update`. Torrents are keyed by hash and carry only
 * their changed fields.
 */
export interface MainData {
  rid: number
  full_update?: boolean
  torrents?: Record<string, Partial<Torrent>>
  torrents_removed?: string[]
  server_state?: Partial<ServerState>
}
