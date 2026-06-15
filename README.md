# Live in NYC - a cross-platform map app

A two-screen, cross-platform (iOS / Android / Web) app that plots **live music
events in New York City** on a map and lets you explore each one. Built with
Expo SDK 54 and deployed as a single public Cloudflare Worker that serves both
the web app and its API.

**Live demo:** https://draftbit-map.vinayleokumar.workers.dev
**Repo:** https://github.com/0xVnay/live-in-nyc-draftbit

> [!IMPORTANT]
> **📖 The full write-up lives in [docs/OVERVIEW.md](docs/OVERVIEW.md)** - the
> architecture decisions and trade-offs, the data-source journey, and the
> complete log of problems hit and how each was solved. Start there for the "why."

## Demos

<!--
To fill these in: on github.com, click this README's pencil (Edit) icon, drag the
iOS and Android screen recordings into the editor, and GitHub will upload them and
insert https://github.com/user-attachments/assets/... URLs. Drop each URL into the
matching `src` below (or replace the cell with the bare URL), then commit.
-->

| iOS | Android |
| --- | --- |
| <video src="IOS_VIDEO_URL" controls></video> | <video src="ANDROID_VIDEO_URL" controls></video> |

## Screens

1. **Map** - event venues as pins, with a horizontal card carousel. Tap a pin
   and the carousel snaps to that card; swipe the carousel and the map pans to
   the pin (two-way sync). The focused pin is highlighted.
2. **Detail** - the card image morphs into a full-screen hero (shared-element
   style transition) with a parallax header, showing date/time, venue, price,
   genre, the artist with links (Spotify, YouTube, Wikipedia, …), and "Get
   Tickets" / "Directions" deep links.

## Features

- Two-way **map ↔ carousel sync** with a highlighted active pin
- **Card → detail hero morph** (custom shared-element transition) + parallax header
- Live data from the **Ticketmaster Discovery API**, normalized server-side
- **Light / dark** theme toggle (follows the OS on first launch)
- Loading / error / empty / not-found states throughout
- Manual **force-refresh** that bypasses the server cache
- i18n-ready (every string via `t()`; English shipped)

## Tech stack

- **Expo SDK 54** + **Expo Router** (file-based, native + web)
- **TypeScript** (strict)
- **TanStack Query** - server state, caching, loading/error states
- **NativeWind v4** - Tailwind styling + dark mode
- **Reanimated 4** + **Gesture Handler** - carousel, parallax, hero morph
- **react-native-maps** (native) / **react-leaflet** + free CARTO/OSM tiles (web)
- **Zustand** - small UI store (theme + transition state)
- **i18next** - localization scaffolding
- **Cloudflare Workers** + **KV** - BFF proxy, cache, static hosting

## Architecture

```
Client (Expo: native + web)
        │   fetches a stable, normalized shape from /api/places
        ▼
Cloudflare Worker  ──►  Ticketmaster Discovery API
  • hides the API key (server-side secret)
  • normalizes the response → the app is provider-agnostic
  • caches normalized payloads in KV (6h fresh / 60d stale-on-error)
  • also serves the static web build (one public URL = app + API)
```

The Worker is a **backend-for-frontend**: the app only ever talks to
`/api/places`, never to Ticketmaster, so the data provider can be swapped
without touching the app. The map is **platform-split** - `react-native-maps`
on native, `react-leaflet` (keyless tiles) on web - behind one shared `Map`
interface, so the web build never bundles native-only modules.

See **[docs/OVERVIEW.md](docs/OVERVIEW.md)** for the full reasoning.

## Project structure

```
app/                       Expo Router routes (Map + Detail) + providers
src/
  components/Map/          platform-split map (Map.native / Map.web + Leaflet)
  components/ui/           shared UI (StateView, ThemeToggle, RefreshButton, IconButton)
  features/locations/      data layer + location components (provider-agnostic)
  lib/                     env, http, queryClient
  store/                   Zustand UI store (theme + transition source)
  theme/                   color tokens + NativeWind bridge
  i18n/                    i18next setup + locales/en.json
worker/src/                Cloudflare Worker - split into index / config / types / cache / ticketmaster
```

## Running it

### 1. Set the API URL (required)

The app reads `EXPO_PUBLIC_API_BASE_URL` to know where the API lives. Copy the
example env (it already points at the live Worker, so no local backend is needed):

```bash
cp .env.example .env
# .env
# EXPO_PUBLIC_API_BASE_URL=https://draftbit-map.vinayleokumar.workers.dev
```

If you run the Worker locally instead (see step 3), point this at it:
`http://localhost:8787` for the iOS simulator and web, or `http://<your-LAN-IP>:8787`
for a physical device. Update `.env` accordingly whenever you switch.

### 2. Start the app

```bash
npm install
npx expo start
```

Follow the Expo CLI prompts: press `w` for web, or `i` / `a` for iOS / Android.

- **Web** runs immediately.
- **Native (iOS / Android):** `react-native-maps` is a native module, so the
  native app needs a **dev build** (not Expo Go):

  ```bash
  npx expo run:ios        # or: npx expo run:android (needs a Google Maps API key)
  ```

  The dev build reads the same `EXPO_PUBLIC_API_BASE_URL`, so make sure it's set
  (the deployed HTTPS URL, or your LAN IP if you point it at a local Worker).

### 3. (Optional) Run the Worker locally

Only needed if you're working on the API itself. Requires a free Ticketmaster
Consumer Key:

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars           # paste your key as TICKETMASTER_API_KEY
npx wrangler kv namespace create CACHE    # paste the printed id into wrangler.toml
npx wrangler dev                          # serves /api at http://localhost:8787
```

Then set `EXPO_PUBLIC_API_BASE_URL` (step 1) to your local Worker URL.

## Deploying (Cloudflare)

```bash
cd worker
npx wrangler login
npx wrangler secret put TICKETMASTER_API_KEY   # production secret

cd .. && EXPO_PUBLIC_API_BASE_URL="" npx expo export -p web --clear   # same-origin build
cd worker && npx wrangler deploy                                      # uploads Worker + ../dist
```

`wrangler deploy` prints the public URL. That single Worker serves both the app
and its `/api`; the production web build calls the API **same-origin**, so no
extra config is needed.
