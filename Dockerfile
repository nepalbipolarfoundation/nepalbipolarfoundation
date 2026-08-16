# ============================================================
# Dockerfile — builds the whole app into one image.
#
# This project is full-stack:
#   - client/  Vue 3 + Vite (the browser frontend)
#   - server/  Feathers 5 + Express + MongoDB (the API)
#
# A "multi-stage" build means earlier stages do work (like
# compiling the client) and only their finished output is copied
# into the final stage, which keeps the image small.
#
#   Stage 1: build the Vue client into static files.
#   Stage 2: install the server's npm dependencies.
#   Stage 3: put it all together — the server process also serves
#            the built client (see server/src/app.ts).
#
# Run with the supplied docker-compose.yml so MongoDB is included:
#   docker compose up --build
# ============================================================

# ---------- Stage 1: build the client ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client

# Install dependencies first (cache-friendly: this layer only
# re-runs when package.json or the lockfile change).
COPY client/package.json client/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy the client source and build it into static files.
COPY client/ .
# An empty VITE_SERVER_URL makes the SPA talk to the API on the
# same origin it is served from (http://localhost:3030 by default).
ARG VITE_SERVER_URL=
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build

# ---------- Stage 2: server dependencies ----------
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app/server

# Install the server's dependencies (built in stage 2).
COPY --from=server-deps /app/server/node_modules ./node_modules

# Copy the server source (config + src).
COPY server/ .

# Serve the built client from the server process.
ENV CLIENT_DIST=/app/public/app
COPY --from=client-build /app/client/dist /app/public/app

# The API (and the built frontend) run on port 3030.
EXPOSE 3030

# `npm start` runs the API with tsx (see server/package.json).
CMD ["npm", "start"]
