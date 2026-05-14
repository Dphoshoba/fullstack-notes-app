import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Sun, X } from "lucide-react";

import { fetchDailyBriefing } from "../../api/ai.js";
import {
  BRIEFING_CARD_DEFINITIONS,
  DAILY_BRIEFING_DISMISSED_KEY
} from "./dailyBriefingMock.js";
import { SectionEmptyState } from "./SectionEmptyState.jsx";

function readDismissedIds() {
  try {
    const raw = localStorage.getItem(DAILY_BRIEFING_DISMISSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeBriefing(payload) {
  return {
    priorities: Array.isArray(payload?.topPriorities) ? payload.topPriorities : [],
    deadlines: Array.isArray(payload?.upcomingDeadlines) ? payload.upcomingDeadlines : [],
    followUps: Array.isArray(payload?.suggestedFollowUps) ? payload.suggestedFollowUps : [],
    meetingActions: Array.isArray(payload?.recentMeetingActions) ? payload.recentMeetingActions : [],
    productivityReminder: String(payload?.productivityReminder || "").trim(),
    date: String(payload?.date || "").trim()
  };
}

function cardHasContent(cardId, briefing) {
  if (cardId === "priorities") {
    return briefing.priorities.length > 0;
  }
  if (cardId === "deadlines") {
    return briefing.deadlines.length > 0;
  }
  if (cardId === "follow-ups") {
    return briefing.followUps.length > 0;
  }
  if (cardId === "meeting-actions") {
    return briefing.meetingActions.length > 0;
  }
  if (cardId === "productivity") {
    return Boolean(briefing.productivityReminder);
  }
  return false;
}

function formatBriefingDate(value) {
  if (!value) {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function BriefingCard({ title, helper, onDismiss, children }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Dismiss ${title}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function BriefingCardContent({ cardId, briefing }) {
  if (cardId === "priorities") {
    return (
      <ul className="space-y-2 text-sm text-slate-700">
        {briefing.priorities.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-emerald-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (cardId === "deadlines") {
    return (
      <ul className="space-y-2 text-sm text-slate-700">
        {briefing.deadlines.map((item) => (
          <li
            key={`${item.label}-${item.due}`}
            className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
          >
            <span>{item.label}</span>
            {item.due ? (
              <span className="shrink-0 text-xs font-semibold text-amber-800">{item.due}</span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  if (cardId === "follow-ups") {
    return (
      <ul className="space-y-2 text-sm text-slate-700">
        {briefing.followUps.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-emerald-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (cardId === "meeting-actions") {
    return (
      <ul className="space-y-2 text-sm text-slate-700">
        {briefing.meetingActions.map((item) => (
          <li key={`${item.title}-${item.action}`} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-600">{item.action}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="rounded-md border border-emerald-100 bg-emerald-50/60 px-3 py-3 text-sm leading-6 text-emerald-900">
      {briefing.productivityReminder}
    </p>
  );
}

export function DailyBriefingSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [briefing, setBriefing] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(() => readDismissedIds());

  useEffect(() => {
    let cancelled = false;

    async function loadBriefing() {
      setLoading(true);
      setError("");

      try {
        const payload = await fetchDailyBriefing();
        if (!cancelled) {
          setBriefing(normalizeBriefing(payload));
        }
      } catch (loadError) {
        if (!cancelled) {
          setBriefing(null);
          setError(loadError.message || "Unable to load your daily briefing.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBriefing();

    return () => {
      cancelled = true;
    };
  }, []);

  const cardsWithContent = useMemo(() => {
    if (!briefing) {
      return [];
    }

    return BRIEFING_CARD_DEFINITIONS.filter((card) => cardHasContent(card.id, briefing));
  }, [briefing]);

  const visibleCards = useMemo(
    () => cardsWithContent.filter((card) => !dismissedIds.includes(card.id)),
    [cardsWithContent, dismissedIds]
  );

  const dismissCard = (cardId) => {
    setDismissedIds((current) => {
      const next = [...new Set([...current, cardId])];
      localStorage.setItem(DAILY_BRIEFING_DISMISSED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetDismissed = () => {
    localStorage.removeItem(DAILY_BRIEFING_DISMISSED_KEY);
    setDismissedIds([]);
  };

  const todayLabel = formatBriefingDate(briefing?.date);

  return (
    <section className="premium-panel p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <Sun className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Daily Briefing</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayLabel}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Your AI-curated snapshot for today — priorities, deadlines, and follow-ups in one place.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          Preparing your daily briefing…
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && cardsWithContent.length === 0 ? (
        <div className="mt-5">
          <SectionEmptyState
            title="No briefing items yet"
            description={
              briefing?.productivityReminder ||
              "Add notes and meeting records to unlock your daily briefing."
            }
          />
        </div>
      ) : null}

      {!loading && !error && cardsWithContent.length > 0 && visibleCards.length === 0 ? (
        <div className="mt-5">
          <SectionEmptyState
            title="Briefing cleared for today"
            description="You dismissed all briefing cards. Restore them anytime to see today's priorities and follow-ups."
            actionLabel="Show briefing again"
            onAction={resetDismissed}
          />
        </div>
      ) : null}

      {!loading && !error && visibleCards.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleCards.map((card) => (
            <BriefingCard
              key={card.id}
              title={card.title}
              helper={card.helper}
              onDismiss={() => dismissCard(card.id)}
            >
              <BriefingCardContent cardId={card.id} briefing={briefing} />
            </BriefingCard>
          ))}
        </div>
      ) : null}
    </section>
  );
}
