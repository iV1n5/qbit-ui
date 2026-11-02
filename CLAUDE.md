# qbit-ui

A small, personal web UI for qBittorrent, mobile-first, covering only the owner's
everyday use. It is NOT a full replacement of the official WebUI: settings and
anything rare stay in the official UI.

Full functional spec: `docs/SPEC.md` (read it before implementing a feature).

## Working agreements

- Code, comments, commit messages and all UI strings in **English**.
- Units: SI, decimal (kB, MB, GB, MB/s — 1 GB = 10^9 bytes). Never imperial.
- Be direct; challenge requirements that look wrong. Say when something is your
  own opinion.
- Small, reviewable steps. Each feature should be usable end-to-end before the
  next one starts.
- When you introduce a new concept or command (Vite, Tailwind, shadcn/ui, …),
  explain it briefly.
- The repository is public: keep personal details (names, hosts, addresses,
  the owner's network) out of it, including commit metadata. They live in
  `.env.local`, `.env` on the server, and Claude's project memory.

## Stack (decided)

- **React + TypeScript**, built with **Vite**.
- **Tailwind CSS** for all styling, **shadcn/ui** for components (installed
  with the shadcn CLI, components live in `src/components/ui/` and are ours to
  edit). Icons: `lucide-react` (shadcn's default).
- Follow the official shadcn/ui installation guide for Vite for the exact
  setup (Tailwind version, path aliases, `components.json`); do not improvise
  the config.
- Initial setup: create-vite `react-ts` (Oxlint as linter), then
  `shadcn init` with the CLI's recommended component library **Base UI**
  (`@base-ui/react`) and preset **Nova** (Lucide icons, Geist font bundled via
  `@fontsource-variable/geist`). TypeScript 7 has no `baseUrl`: the `@/*`
  alias is `paths` only.
- Keep dependencies few: before adding a package beyond the above, ask.
  No state-management library unless a real need appears (React state +
  a small custom hook for polling is expected to be enough).
- **No external CDN or remote fonts at runtime**: everything is bundled, the UI
  must load on the LAN even without internet. Self-host fonts if any.
- Output of `npm run build` is static files in `dist/`; that is what gets
  deployed.
- One responsive app. Mobile layout below the `md` breakpoint (list + shadcn
  `Drawer` bottom sheet for details), desktop layout above (table + side
  panel). Splitting into separate routes/pages is fine if it gets cleaner.
- Theme: dark and light, following `prefers-color-scheme` (shadcn's
  CSS-variable theming; an inline script in `index.html` toggles the `dark`
  class).
- Installable on iPhone home screen (web app manifest + apple-touch-icon +
  `apple-mobile-web-app-capable`). No service worker: the UI is served over
  plain http on the LAN, where service workers do not run.
- Icon: a magnet (magnet links) with tips in the state colors. In `public/`:
  `favicon.svg` is the rounded tile for tabs; `icon.svg` is the full-bleed
  square (smaller glyph, for iOS and maskable cropping) the PNGs come from:
  `qlmanage -t -s 512 icon.svg`, then `sips -z <size> <size>` for 512, 192,
  180 (`apple-touch-icon.png`) and 32 (`favicon-32.png`).
- Node: current LTS.

## Layout (target)

```
index.html
src/
  main.tsx, App.tsx
  api/              the only place that talks to qBittorrent (typed client)
  hooks/            e.g. useMainData (sync/maindata polling)
  components/       our components
  components/ui/    shadcn components (generated, editable)
  lib/              formatting helpers (sizes, speeds, ETA)
public/             manifest, icons
docs/SPEC.md        functional spec
docs/screenshots/   README images, taken on example data (never the owner's torrents)
vite.config.ts      includes the dev proxy for /api
Dockerfile          production image: Node build stage, then Caddy
Caddyfile           production server: dist/ + the /api proxy
compose.yaml        runs the image on the NUC
```

## qBittorrent

- Target: **qBittorrent 5.3** (linuxserver image), WebAPI v2, base path `/api/v2/`.
- The UI always calls relative URLs (`/api/v2/...`): same-origin with the API,
  no CORS. In dev the Vite proxy forwards them; in production a reverse proxy
  (Caddy) does.
- Both proxies (Vite in `vite.config.ts`, also used by `vite preview`; Caddy
  in `Caddyfile`) rewrite `Host` to qBittorrent's address **and**, when
  present, `Origin` and `Referer` to its URL. Otherwise qBittorrent answers
  401: its Host check wants its own port, and its CSRF check compares
  Origin/Referer with Host (`X-Forwarded-Host` counts only with "reverse proxy
  support" enabled, which is off). Rewriting Origin blinds that CSRF check, so
  Caddy itself refuses requests whose Origin is not the UI's own.
- Auth: `POST /api/v2/auth/login` (form `username`, `password`) answers 204 and
  sets the session cookie (`QBT_SID_<port>`, HttpOnly, SameSite=Lax); 401 =
  wrong credentials, 403 = IP banned after too many failures. On any other
  endpoint 403 means "not logged in" → show the login form, while 401 means the
  Host/CSRF checks refused the request (a proxy problem).
- Never store the password (no localStorage, no cookies of our own). The
  session cookie set by qBittorrent is the only credential.
- 5.x renamed pause/resume: use `torrents/stop` / `torrents/start`, states
  `stoppedDL` / `stoppedUP` (not `paused*`).
- Search results are added like the 5.3 WebUI does: `torrents/add` with
  `urls=<fileUrl>` and `downloader=<engineName>` (the plugin fetches .torrent
  URLs that need it). Search jobs stay in qBittorrent, even across restarts,
  until `search/delete`. To choose files before adding, `torrents/fetchMetadata`
  (same `downloader`; 202 = ask again) and then `filePriorities` in
  `torrents/add`, which qBittorrent refuses (400) unless the metadata was
  fetched first.
- Type the API responses in `src/api/types.ts`.
- When an endpoint's behaviour is unclear, check how the official WebUI of 5.3
  does it (qBittorrent repo, `src/webui/www/private/scripts/`), and the WebAPI
  docs in the qBittorrent wiki. Prefer that over guessing.

## Development

```bash
npm install
npm run dev
```

`vite.config.ts` forwards `/api` to `QBT_URL`, read from the environment or
from `.env.local` (not committed; default `http://localhost:8080`). Testing is
against the owner's real qBittorrent instances: careful with destructive calls
(delete, stop, add): ask before doing them on real torrents.

## Deployment

Docker (commands in README): `Dockerfile` builds `dist/` and serves it with
Caddy, which proxies `/api/` to qBittorrent. `compose.yaml` publishes it on
port 8457 (plain http, reached by IP or a local DNS name: no virtual hosts) and
joins the Docker network of the compose project that runs qBittorrent behind
gluetun (defaults: network `qbittorrent-vpn_default`, `gluetun:8456`).

Important: Caddy must NOT run inside gluetun's network namespace. qBittorrent
may bypass authentication for clients on localhost (gluetun's port-forwarding
hook needs it); requests coming from 127.0.0.1 would skip the login entirely.

## Open questions

Tracked in `docs/SPEC.md` → "Open questions". Ask the user rather than assume.
