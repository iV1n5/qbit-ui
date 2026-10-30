# qbit-ui image: builds the static UI with Node, then serves it with Caddy,
# which also proxies /api/ to qBittorrent (see Caddyfile and compose.yaml).

# Build stage: only dist/ is kept from it.
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: Caddy plus the built files.
FROM caddy:2.11-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
