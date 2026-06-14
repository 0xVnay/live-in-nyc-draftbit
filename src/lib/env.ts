import { Platform } from "react-native";

/**
 * Base URL of our Cloudflare Worker API.
 *
 * Resolution order:
 *  1. EXPO_PUBLIC_API_BASE_URL if set (used for local dev → http://localhost:8787,
 *     and for native production → the deployed Worker URL).
 *  2. Otherwise, on web fall back to "" (same-origin) — in production the web
 *     build is served BY the Worker, so `/api/places` is already same-origin and
 *     needs no configuration.
 *  3. Otherwise (native, unconfigured) default to localhost for dev.
 *
 * This is never a secret — the Ticketmaster key lives only inside the Worker.
 */
const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = configured
  ? configured.replace(/\/$/, "")
  : Platform.OS === "web"
    ? ""
    : "http://localhost:8787";
