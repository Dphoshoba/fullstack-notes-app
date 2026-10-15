import { useState } from "react";
import { Bot, CalendarDays, CheckCircle2, ChevronDown, FileText, Sparkles, UserPlus, X } from "lucide-react";

import { GETTING_STARTED_STEPS } from "./onboardingSteps.js";

const STEP_ICONS = {
  note: FileText,
  ai: Bot,
  meetings: CalendarDays,
  team: UserPlus
};

export function OnboardingWelcomePanel({
  completedCount,
  stepCompletion,
  onStepAction,
  onDismiss,
  dismissLabel = "Dismiss for now",
  t = (key) => key
}) {
  const [expanded, setExpanded] = useState(completedCount === 0);
  const total = GETTING_STARTED_STEPS.length;
  const done = completedCount >= total;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="onboarding-enter premium-panel border-emerald-200 bg-white shadow-emerald-950/5">
        {/* Slim banner row (always visible) */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-expanded={expanded}
          >
            <span className="truncate text-sm font-semibold text-slate-950">
              {done ? t("onboardingCompleteTitle") : t("onboardingProgressTitle")}
            </span>
            <span className="hidden truncate text-sm text-slate-500 sm:inline">
              {t("onboardingProgress", { completed: completedCount, total })}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={dismissLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expandable detail */}
        {expanded ? (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <p className="text-sm leading-6 text-slate-600">
              {t("onboardingDescription")}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-700 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ol className="mt-3 grid gap-2.5 md:grid-cols-2">
              {GETTING_STARTED_STEPS.map((step) => {
                const Icon = STEP_ICONS[step.id];
                const completed = stepCompletion[step.id];

                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => onStepAction(step.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50 ${
                        completed
                          ? "border-emerald-200 bg-emerald-50/80"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          completed ? "bg-emerald-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        {completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-950">{t(step.titleKey)}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-600">{t(step.helperKey)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => onStepAction("note")}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
              >
                <FileText className="h-4 w-4" />
                {t("onboardingPrimaryAction")}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:w-auto"
              >
                {dismissLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
