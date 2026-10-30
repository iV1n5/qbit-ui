import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The qBittorrent WebUI that /api is forwarded to: QBT_URL from the
  // environment or from .env.local (not committed).
  const qbtUrl = (
    loadEnv(mode, import.meta.dirname, "").QBT_URL || "http://localhost:8080"
  ).replace(/\/+$/, "")

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // The UI calls /api/v2/... on its own origin. qBittorrent answers 401
        // unless Host carries its own port and, for its CSRF check, Origin and
        // Referer (when sent) match Host: point all three at qBittorrent.
        // `vite preview` uses this proxy too (preview.proxy defaults to it).
        "/api": {
          target: qbtUrl,
          changeOrigin: true, // rewrites Host
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              if (req.headers.origin) proxyReq.setHeader("Origin", qbtUrl)
              if (req.headers.referer) {
                proxyReq.setHeader("Referer", `${qbtUrl}/`)
              }
            })
          },
        },
      },
    },
  }
})
