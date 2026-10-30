import type { MainData, ServerState, Torrent } from "@/api/types"

/** The client-side copy of qBittorrent's state, rebuilt from sync/maindata. */
export interface MainDataStore {
  torrents: Record<string, Torrent>
  serverState: ServerState
}

export const EMPTY_STORE: MainDataStore = {
  torrents: {},
  serverState: { dl_info_speed: 0, up_info_speed: 0 },
}

/** Applies one sync/maindata response, as the official WebUI's client.js does. */
export function mergeMainData(
  store: MainDataStore,
  data: MainData
): MainDataStore {
  const base = data.full_update ? EMPTY_STORE : store
  const torrents = { ...base.torrents }
  for (const [hash, changes] of Object.entries(data.torrents ?? {})) {
    // A new torrent arrives with all its fields; the hash is only the key.
    torrents[hash] = { ...torrents[hash], ...changes, hash } as Torrent
  }
  for (const hash of data.torrents_removed ?? []) {
    delete torrents[hash]
  }
  return {
    torrents,
    serverState: { ...base.serverState, ...data.server_state },
  }
}
