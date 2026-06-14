// Base module for TypeScript resolution only.
// Metro picks the platform implementation for a written file specifier:
// `Map.native.tsx` on iOS/Android, `Map.web.tsx` on web. This `.ts` base is
// never bundled when a platform-specific file exists — it just gives `tsc`
// (and editors) a module to resolve `@/src/components/Map/Map` against.
export { Map } from "./Map.native";
export type { MapProps } from "./types";
