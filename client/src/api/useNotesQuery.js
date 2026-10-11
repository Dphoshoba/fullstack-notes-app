import { useQuery } from "@tanstack/react-query";
import { fetchNotes } from "./notes.js";

// Declarative, cached access to the notes list.
// Existing imperative calls in DashboardPage keep working; this hook is
// available for any component that wants automatic caching/refetching.
export function useNotesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["notes", filters],
    queryFn: () => fetchNotes(filters),
    enabled: options.enabled !== false,
    ...options
  });
}
