// The only module that talks to qBittorrent. URLs are relative: the UI is
// served from the same origin as the WebAPI (Vite proxy in dev, Caddy in
// production), so the browser sends qBittorrent's session cookie by itself.

import type {
  Category,
  MainData,
  SearchPlugin,
  SearchResults,
} from "@/api/types"

const BASE = "/api/v2"

/** qBittorrent answered with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  // Live data: never answer from the browser cache.
  const res = await fetch(`${BASE}/${path}`, { cache: "no-store", ...init })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res
}

/** A short description of a failed call, for the UI. */
export function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return "Request rejected (HTTP 401): check how the proxy rewrites Host, Origin and Referer."
    }
    return `Request failed (HTTP ${err.status}): ${err.message}`
  }
  // What fetch() throws when the server can't be reached.
  if (err instanceof TypeError) return "Cannot reach the server."
  return String(err)
}

function post(path: string, form: Record<string, string> = {}) {
  return request(path, { method: "POST", body: new URLSearchParams(form) })
}

async function getJson<T>(path: string, init?: RequestInit) {
  return (await (await request(path, init)).json()) as T
}

/** Throws ApiError 401 on wrong credentials, 403 if this IP is banned. */
export async function login(username: string, password: string) {
  await post("auth/login", { username, password })
}

export async function logout() {
  await post("auth/logout")
}

/**
 * Changes since the response with this `rid` (0: everything). Like every
 * endpoint but login, it throws ApiError 403 when logged out.
 */
export function getMainData(rid: number, signal?: AbortSignal) {
  return getJson<MainData>(`sync/maindata?rid=${rid}`, { signal })
}

export async function startTorrent(hash: string) {
  await post("torrents/start", { hashes: hash })
}

export async function stopTorrent(hash: string) {
  await post("torrents/stop", { hashes: hash })
}

/** `deleteFiles`: also delete the downloaded data. */
export async function deleteTorrent(hash: string, deleteFiles: boolean) {
  await post("torrents/delete", { hashes: hash, deleteFiles: String(deleteFiles) })
}

/**
 * Adds a search result, as the official WebUI does: `engine` lets
 * qBittorrent download a .torrent URL through the plugin that found it, and
 * autoTMM makes the category's folder apply. 409: nothing was added (e.g.
 * the torrent is already there).
 */
export async function addTorrent(url: string, engine: string, category: string) {
  await post("torrents/add", {
    urls: url,
    downloader: engine,
    category,
    autoTMM: "true",
  })
}

export function getCategories() {
  return getJson<Record<string, Category>>("torrents/categories")
}

/** Where torrents without a category go. */
export async function getDefaultSavePath() {
  return (await getJson<{ save_path: string }>("app/preferences")).save_path
}

export function getSearchPlugins() {
  return getJson<SearchPlugin[]>("search/plugins")
}

/** Starts a search on every enabled plugin; returns its id. */
export async function startSearch(pattern: string) {
  const res = await post("search/start", {
    pattern,
    plugins: "enabled",
    category: "all",
  })
  return ((await res.json()) as { id: number }).id
}

/** The results found from `offset` on, and whether the search still runs. */
export function getSearchResults(id: number, offset: number) {
  return getJson<SearchResults>(`search/results?id=${id}&offset=${offset}`)
}

export async function stopSearch(id: number) {
  await post("search/stop", { id: String(id) })
}

/** qBittorrent keeps every search, even across restarts, until it is deleted. */
export async function deleteSearch(id: number) {
  await post("search/delete", { id: String(id) })
}

/**
 * deleteSearch while the page goes away (reload, closed tab): a beacon is
 * still sent then, where a fetch could be cancelled. Running searches stop too.
 */
export function deleteSearchOnUnload(id: number) {
  navigator.sendBeacon(
    `${BASE}/search/delete`,
    new URLSearchParams({ id: String(id) })
  )
}
