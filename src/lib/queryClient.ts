import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient. Event data changes slowly (and the Worker caches it
 * too), so we cache aggressively — no refetch on focus, long stale time.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
