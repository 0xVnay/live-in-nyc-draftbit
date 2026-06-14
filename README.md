# Live in NYC — a cross-platform map app

A two-screen, cross-platform (iOS / Android / Web) app that plots **live events
in New York City** on a map and lets you explore them. Built with Expo SDK 54 and
deployed as a single public Cloudflare Worker.

**Live demo:** https://draftbit-map.vinayleokumar.workers.dev

## Screens

1. **Map** — event venues as pins, with a horizontal card carousel. Tap a pin and
   the carousel snaps to that card; swipe the carousel and the map pans to the pin
   (two-way sync). The focused pin is highlighted.
2. **Detail** — the card image morphs into a full-screen hero (shared-element
   style transition) with a parallax header, showing date/time, venue, price,
   genre, the artist with links (Spotify, YouTube, Wikipedia, …), and a "Get
   Tickets" deep link.

## Architecture

```
Client (Expo: native + web)
        │   fetches a stable, normalized shape
        ▼
Cloudflare Worker  ──►  Ticketmaster Discovery API
  • hides the API key (server-side secret)
  • normalizes the response → the app is provider-agnostic
  • caches normalized payloads in KV (cheap + resilient)
  • also serves the static web build (one public URL = app + API)
```

The Worker is a **backend-for-frontend**: the app talks only to `/api/places`,
never to Ticketmaster, so the data provider can be swapped without touching the
app (which happened several times during the build).

The map is **platform-split** — `react-native-maps` on native, `react-leaflet`
(free OSM/CARTO tiles, no token) on web — behind one shared `Map` interface, so
the web build never bundles native-only modules.

## Tech stack

- **Expo SDK 54** + **Expo Router** (file-based, native + web)
- **TypeScript** (strict)
- **TanStack Query** (server state, caching, loading/error states)
- **NativeWind v4** (Tailwind styling, dark mode)
- **Reanimated 4** + **Gesture Handler** (carousel scale, parallax, hero morph)
- **react-native-maps** (native) / **react-leaflet** (web)
- **Zustand** (small UI store: theme + transition state)
- **i18next** (strings scaffolded for localization; English shipped)
- **Cloudflare Workers** + **KV** (BFF proxy, cache, static hosting)

## Project structure

```
app/                     # Expo Router routes (Map + Detail)
src/
  features/locations/    # data layer + location components (provider-agnostic)
  components/Map/         # platform-split map (Map.native / Map.web + Leaflet)
  components/ui/          # shared UI
  lib/ store/ theme/ i18n/
worker/                  # Cloudflare Worker (Ticketmaster BFF + static assets)
docs/SETUP.md            # run + deploy instructions
```

## Running it

See **[docs/SETUP.md](docs/SETUP.md)** for full local-run and deploy steps.

Quick start:

```bash
npm install
# Worker (Ticketmaster key in worker/.dev.vars):
cd worker && npm install && npm run dev
# App:
cd .. && npx expo start
```

> `react-native-maps` is a native module and does **not** run in Expo Go — use the
> web build or a dev build (`npx expo run:ios --device`).
