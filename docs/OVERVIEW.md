# Project Overview - Live in NYC

Handover notes for **Live in NYC**, a cross-platform map app built for the
Draftbit Experts test project: what it is, the key decisions and why, and the
problems solved along the way.

- **Live:** https://draftbit-map.vinayleokumar.workers.dev
- **Run / deploy:** see the [README](../README.md)
- **Demo:** a screen recording is in the [README](../README.md#demo)

## Contents

1. [What it is](#1-what-it-is)
2. [Core requirement](#2-core-requirement)
3. [Architecture](#3-architecture)
4. [Key decisions](#4-key-decisions)
5. [Data-source journey](#5-data-source-journey)
6. [Signature interactions](#6-signature-interactions)
7. [Caching & resilience](#7-caching--resilience)
8. [Challenges & fixes](#8-challenges--fixes)
9. [What's next](#9-whats-next)

---

## 1. What it is

A two-screen app plotting **live music events in New York City**:

- **Map** - venue pins + a card carousel, kept in two-way sync (tap a pin and the
  carousel snaps to it; swipe the carousel and the map pans to the pin).
- **Detail** - the tapped card's image morphs into a full-screen hero with a
  parallax header, date/time, venue, price, genre, the artist with links, and
  "Get Tickets" / "Directions".

It runs natively on iOS/Android and exports to web, deployed as one public
Cloudflare Worker.

## 2. Core requirement

The brief wants an app "into the iOS and Android app store" **and** "deployed to
Cloudflare." Cloudflare can't host a native binary, so the public artifact is the
Expo web export while the same code still runs natively. That one fact, **a
genuinely cross-platform app that runs native and exports to web**, drove the
map-library choice and the one-Worker deployment.

## 3. Architecture

```
Client (Expo: iOS / Android / Web)
        │  fetches OUR normalized shape from /api/places
        ▼
Cloudflare Worker  (Backend-for-Frontend)
  • hides the Ticketmaster API key (server secret)
  • normalizes events → our stable Location shape
  • caches normalized payloads in KV (6h fresh / 60d stale-on-error)
  • also serves the static Expo web build (one public URL = app + API)
        │
        ▼
  Ticketmaster Discovery API
```

- **BFF Worker:** the app only calls `/api/places`, never Ticketmaster, so the
  provider is swappable without touching the app. Split into `index` (routing),
  `config`, `types`, `cache`, and `ticketmaster` (the only provider-specific file).
- **Platform-split map** behind one `<Map />`: `react-native-maps` on native,
  `react-leaflet` + keyless CARTO/OSM tiles on web. A types-only `Map.d.ts` keeps
  native maps out of the web bundle.

## 4. Key decisions

- **Keyless web map (Leaflet/OSM), not Google/Mapbox.** The web build is a public
  static site; a billable map key in a public bundle is a liability. Native keeps
  store-quality maps.
- **BFF Worker.** Hides the API key, decouples the app from the provider, and lets
  one URL host both the app and its API.
- **TanStack Query (server state) + Zustand (UI state).** Query for
  caching/loading/error; Zustand for the small cross-screen bits (theme + the
  card-to-detail rect).
- **Normalize fully on the server.** The list carries every field the detail
  needs, so detail opens instantly from cache and the app never depends on
  Ticketmaster's field names.
- **Feature-based structure + scaffolded i18n.** A feature is a folder; every
  string goes through `t()`, so adding a language is one JSON file.

## 5. Data-source journey

The provider changed several times, which is exactly why the BFF paid off (each
swap was a Worker-only change, invisible to the app):

> Geoapify → OpenTripMap → Foursquare (blocked: credit card required, photos
> paywalled) → **Ticketmaster Discovery API** ✅

Ticketmaster won: free 5k/day, no credit card, and real images, coordinates,
dates, prices, genres, and artist links. Coverage is US/UK-strong, so the
showcased city is **New York**.

## 6. Signature interactions

- **Map ↔ carousel sync:** everything routes through one `activeIndex`, built on a
  Reanimated scroll handler so it's smooth and identical on web and native.
- **Card → detail hero morph:** the card's measured rect animates into the
  full-screen hero (custom shared-element, since Reanimated 4 dropped
  `sharedTransitionTag`).
- **Parallax detail header** on scroll.

## 7. Caching & resilience

- **Worker KV:** normalized payloads under a versioned key; fresh 6h, retained 60
  days and served **stale-on-error** so the demo never blanks.
- **Client (React Query):** 15-min stale time, 24h gc, no refetch on focus, retry twice.
- **Force refresh:** `?refresh=1` bypasses KV; the in-app refresh button uses it.

## 8. Challenges & fixes

1. **Platform-split resolution.** A base `Map.ts` beat `Map.web.tsx` on web (Metro
   extension ordering), pulling native maps into the web bundle. Fix: a types-only
   `Map.d.ts`, never bundled when a platform file exists.
2. **Leaflet `window is not defined`** during static prerender (it runs in Node).
   Fix: lazy-load Leaflet so it only evaluates client-side.
3. **Flickering / vanishing markers.** Web: swapping a marker's icon remounted it,
   so swap in place with stable keys. Native: `react-native-maps` re-rasterizes a
   custom marker while `tracksViewChanges` is on, so render the red idle pins once
   and freeze them, plus one blue marker that only moves (its filled center keeps
   the idle pin from showing through).
4. **Map rippled through pins** when tapping a distant card. Fix: suppress
   carousel-to-map updates during a tap-driven glide until it reaches the target.
5. **Detail pop-in** (rich data a beat late). Fix: the search response already
   carries the rich fields, so the list is fully normalized and detail is instant.
6. **Deploy / env gotchas.** iOS ATS blocks cleartext to a LAN IP (drove deploying
   early; use HTTPS or `localhost`), and a stale API base got baked into the web
   bundle (fix: rebuild with `--clear`; production web is same-origin).
7. **Web bundle crashed on `import.meta`.** zustand's devtools middleware uses the
   Vite-only `import.meta.env`, and Expo's web export loads the bundle as a classic
   script where that's a parse error, so nothing hydrated. Fix: Expo's
   `unstable_transformImportMeta` (default from SDK 56).
8. **Leaflet covered the overlays.** Its panes use `z-index: 400+` and the map had
   no stacking context, so it painted over the header and carousel. Fix: give the
   map container `zIndex: 0`.
9. **Two UX gaps.** A missing/expired event id showed an infinite spinner (added a
   proper not-found state), and the "system" theme picked poor control-icon colors
   (simplified the toggle to light/dark, still following the OS on first launch).

## 9. What's next

- Pin clustering at low zoom.
- A bottom-sheet list as an alternative to the carousel.
- Tests around the Worker normalizer.
- EAS build + store config for native distribution.
