import { Platform } from "react-native";

/**
 * Base URL of our Cloudflare Worker API (never a secret — the Ticketmaster key
 * lives only in the Worker). Resolution:
 *  1. EXPO_PUBLIC_API_BASE_URL if set (local dev, or native prod → deployed URL).
 *  2. else on web → "" (same-origin: prod web is served BY the Worker).
 *  3. else (native, unconfigured) → localhost for dev.
 */
const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = configured
  ? configured.replace(/\/$/, "")
  : Platform.OS === "web"
    ? ""
    : "http://localhost:8787";
