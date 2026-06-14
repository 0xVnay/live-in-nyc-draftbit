# Setup & Deploy

This project has two parts:

- **App** (`/`) — Expo SDK 54 (iOS / Android / Web).
- **Worker** (`/worker`) — a Cloudflare Worker that serves the web build **and**
  exposes a normalized `/api/places` backed by the Ticketmaster Discovery API
  (key hidden, responses cached in KV).

```
Client (Expo)  ──►  Cloudflare Worker  ──►  Ticketmaster Discovery API
                     • hides the API key
                     • normalizes the response
                     • caches in KV (cheap, resilient)
                     • serves the static web build
```

---

## 1. Get a Ticketmaster API key

1. Create an app in the Ticketmaster Developer portal.
2. Copy the **Consumer Key** — the Discovery API uses it as the `apikey` query
   param. (The Consumer Secret is only for OAuth and isn't needed here.)
3. Free tier is 5,000 requests/day with no credit card. Our KV cache keeps real
   calls to a trickle.

## 2. Run the Worker locally

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars      # paste your Consumer Key as TICKETMASTER_API_KEY
npx wrangler kv namespace create CACHE   # paste the printed id into wrangler.toml
# build the web app once so the Worker has assets to serve:
cd .. && npx expo export -p web
cd worker && npm run dev            # Worker now on http://localhost:8787
```

Test it: `curl http://localhost:8787/api/places` → JSON array of events.

## 3. Run the app

```bash
cp .env.example .env                # points at http://localhost:8787 by default
npx expo start
```

- **iOS simulator / web:** `localhost:8787` works as-is.
- **Physical device:** set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP
  (e.g. `http://192.168.0.7:8787`) and run the Worker with `wrangler dev --ip 0.0.0.0`.
- **Android emulator:** use `http://10.0.2.2:8787`.

> Note: `react-native-maps` is a native module, so it does **not** run in Expo Go.
> Use the web build, or a dev build via `npx expo run:ios --device` /
> `npx expo run:android --device` (Android also needs a Google Maps API key).

## 4. Deploy (production)

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create CACHE   # if not done; id -> wrangler.toml
npx wrangler secret put TICKETMASTER_API_KEY   # paste your Consumer Key

cd .. && npx expo export -p web          # build the static site into ./dist
cd worker && npx wrangler deploy         # uploads the Worker + ../dist
```

`wrangler deploy` prints the public URL (e.g. `https://draftbit-map.<you>.workers.dev`).
That single URL serves both the app and its `/api`. The production web build calls
the API **same-origin**, so no extra config is needed. For **native** production
builds, set `EXPO_PUBLIC_API_BASE_URL` to that Worker URL before building with EAS.

---

## Why this architecture (the short version)

- **Key safety** — the Ticketmaster key is a Worker secret; it never ships in the client bundle.
- **Provider decoupling** — the app consumes our stable shape, so swapping the
  data provider is a Worker-only change (we did exactly that during the build).
- **Resilience + cost** — KV caches normalized responses, so we stay far under the
  rate limit and the demo serves the last good payload on any upstream error.
- **One deploy** — a single public Worker hosts the app and the API.
