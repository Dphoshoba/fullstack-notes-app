import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Search, Sparkles } from "lucide-react";

import { fetchSemanticSearch } from "../../api/ai.js";
import { SectionEmptyState } from "./SectionEmptyState.jsx";

const PLACEHOLDER_EXAMPLES = [
  "Find notes about Stripe",
  "Show meeting action items",
  "Find church planning discussions",
  "Search business ideas"
];

const SUGGESTED_SEARCHES = [
  "Find notes about Stripe",
  "Show meeting action items",
  "Find church planning discussions",
  "Search business ideas"
];

function scoreLabel(score) {
  if (score >= 80) {
    return "High match";
  }

  if (score >= 50) {
    return "Good match";
  }

  return "Related";
}

export function SemanticSearchPanel({ onSelectNote, usageLimitReached = false }) {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const runSearch = useCallback(
    async (searchText) => {
      const trimmed = searchText.trim();
      if (!trimmed) {
        return;
      }

      if (usageLimitReached) {
        setError("AI usage limit reached. Upgrade your plan to continue searching.");
        setResults([]);
        setLastQuery(trimmed);
        return;
      }

      setQuery(trimmed);
      setLoading(true);
      setError("");
      setLastQuery(trimmed);

      try {
        const data = await fetchSemanticSearch(trimmed);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "AI search is unavailable right now. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [usageLimitReached]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(query);
  };

  const hasSearched = lastQuery.length > 0;
  const showNoResults = hasSearched && !loading && !error && results?.length === 0;

  return (
    <div className="premium-panel mb-5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-950">AI Workspace Search</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Search across your business notes with AI — find projects, meetings, and ideas fast.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-2">
        <label className="block">
          <span className="sr-only">Search your workspace</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:pr-28"
              aria-label="AI workspace search"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1.5 top-1/2 hidden min-h-9 -translate-y-1/2 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search workspace
        </button>
      </form>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested searches</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_SEARCHES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => runSearch(suggestion)}
              disabled={loading}
              className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-60"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          Searching your workspace with AI…
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {!hasSearched && !loading ? (
        <div className="mt-5">
          <SectionEmptyState
            title="Search your workspace"
            description="Try a suggested search above, or describe what you need — for example, meeting action items or business ideas."
          />
        </div>
      ) : null}

      {showNoResults ? (
        <div className="mt-5">
          <SectionEmptyState
            title="No matching notes"
            description={`No results for “${lastQuery}”. Try a broader phrase or one of the suggested searches.`}
            actionLabel="Clear search"
            onAction={() => {
              setQuery("");
              setLastQuery("");
              setResults(null);
              setError("");
            }}
          />
        </div>
      ) : null}

      {results?.length ? (
        <ul className="mt-5 space-y-3">
          {results.map((result) => (
            <li key={result.noteId}>
              <button
                type="button"
                onClick={() => onSelectNote?.(result.noteId)}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{result.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{result.excerpt}</p>
                    <p className="mt-2 text-xs leading-5 text-emerald-800">{result.relevanceReason}</p>
                  </div>
                  <div className="shrink-0 sm:w-28">
                    <p className="text-right text-xs font-semibold text-slate-500">{scoreLabel(result.score)}</p>
                    <p className="mt-0.5 text-right text-sm font-bold text-emerald-700">{result.score}%</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${Math.min(Math.max(result.score, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
