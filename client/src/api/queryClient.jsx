import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Centralized React Query configuration for server-state caching.
// Enables request deduplication, background refetching, and cache reuse
// without changing the existing imperative fetch calls in api/*.js.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: true
    }
  }
});

export function QueryProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
