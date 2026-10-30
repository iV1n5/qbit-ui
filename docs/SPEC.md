# qbit-ui — functional spec (v0.1)

Scope: three things only — watch downloads (and start, stop or delete them),
search, add a search result with a category. Everything else stays in the
official WebUI.

## 0. Login

- Shown when any API call returns 403.
- Fields: username, password. `POST /api/v2/auth/login`.
- On success go back to the previous view. Logout in a menu (`auth/logout`).

## 1. Downloads (home view)

Purpose: keep an eye on the status of downloads at a glance.

### Data

- `GET /api/v2/sync/maindata?rid=N`, polled every ~2 s while the page is
  visible (stop polling when `document.hidden`). It returns diffs: keep a local
  store and merge `torrents`, remove `torrents_removed`, honour `full_update`.
- Fields used: `name`, `size`, `progress`, `dlspeed`, `upspeed`, `eta`,
  `state`, `category`, `save_path`, `added_on`, `num_seeds`, `num_complete`,
  `num_leechs`, `num_incomplete`, `ratio`, `popularity`.
- Global: `server_state.dl_info_speed`, `server_state.up_info_speed`, shown in
  the header on both layouts.

### Colors

Each state has a color, used for progress bars, the mobile ETA and the
desktop state dot: green downloading, orange waiting (stalled, queued,
metadata, checking, moving), blue finished, gray stopped, red error.

### Actions

Start or Stop (whichever applies) and Delete. Delete asks for confirmation,
with "Also delete the downloaded files" (off by default).

### Mobile list

- Each row: **name** (max 2 lines, ellipsis) and **ETA**.
- A thin progress bar under the row (cheap, very informative).
- ETA rendering: error/missingFiles → "Error"; completed → "Done"; stopped →
  "Stopped"; queued → "Queued"; `eta >= 8640000` → "∞". Otherwise human
  format: "45 s", "12 min", "3 h 20 min", "2 d".
- Sort (default): downloading first by ETA ascending, then everything else by
  `added_on` descending. "Downloading" is any `*DL` state, as in the official
  WebUI's filter, so stopped and queued downloads follow the active ones.
- Tap a row → detail.

### Mobile detail (bottom sheet)

Name (full), size, progress %, download speed, upload speed, ETA, state,
category, destination folder, seeds/peers, ratio, added on; the actions.

### Desktop

- Table: name, size, progress (bar + %), down speed, up speed, ETA, seeds,
  peers, ratio, popularity, category, state, and the actions. Sortable
  columns.
- Later: click a row → side panel with the same detail as mobile.
- No category filter for now.

## 2. Search

- One text field + "Search". No filters: always `plugins=enabled`,
  `category=all`.
- `POST /api/v2/search/start` (`pattern`, `plugins=enabled`, `category=all`)
  → `{id}`.
- Poll `GET /api/v2/search/results?id=..&offset=..` every ~1 s, appending new
  results, until its `status` says `Stopped`. Show a spinner while running
  and a "Stop" button (`search/stop`).
- When leaving the view or starting a new search: `search/stop` +
  `search/delete` for the old id (qBittorrent keeps searches, even across
  restarts). When the page itself goes away: `search/delete` by beacon.
- Results list: name, size, seeders (sorted by seeders, descending).
  Desktop: also leechers and source site.
- Tap a result → confirmation (section 3).
- If no plugin is enabled, say so and point to the official WebUI
  (Search → Search plugins).

## 3. Add confirmation

- Shows: name, size, seeders, source site.
- **Category picker** from `GET /api/v2/torrents/categories`
  (`{name: {name, savePath}}`), plus "No category". Under the picker show the
  resolved destination folder, as the official WebUI computes it: the
  default save path (`app/preferences` → `save_path`) without a category;
  the category's `savePath`; or, when that is empty, the default save path
  plus `/<category name>`.
- Remember the last category used (localStorage is fine for this; it is a
  convenience, not a credential).
- "Add" → `POST /api/v2/torrents/add` with `urls=<fileUrl>`,
  `downloader=<engineName>`, `category=<name>`, `autoTMM=true`, as the 5.3
  WebUI does. `downloader` makes qBittorrent fetch .torrent URLs through the
  plugin that found them (some sites need it); magnet links are added
  directly. `autoTMM=true` is what makes the category's folder apply; without
  it the torrent goes to the default save path. 409 means nothing was added
  (e.g. already in the list).
- After adding: toast "Added", go to Downloads.

## Non-goals

Settings, RSS, trackers/peers/files management, creating categories, torrent
file upload, multiple servers. (Can be revisited later.)

## Open questions

1. ~~Downloads list: show everything, or hide completed torrents by default
   (with a toggle)?~~ Decided: show everything, no toggle (the default sort
   already puts downloads first).
2. ~~Desktop extras~~ Decided: start/stop and delete, on desktop and mobile;
   no category filter for now.
3. ~~Search: publication date?~~ Decided: no.
4. ~~Hostname for the deployed UI~~ Decided: no virtual host, the UI is
   reached by IP or a local DNS name plus its port (default 8457).
