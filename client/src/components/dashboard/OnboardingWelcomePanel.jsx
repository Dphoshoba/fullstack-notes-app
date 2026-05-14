import { Bot, CalendarDays, CheckCircle2, FileText, UserPlus, X } from "lucide-react";

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
  dismissLabel = "Dismiss for now"
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="onboarding-enter premium-panel border-emerald-200 bg-white p-4 shadow-emerald-950/5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">Getting started</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">Welcome to your AI Business Notes Workspace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Follow these four steps to capture notes, run AI, handle meetings, and collaborate with
              your team.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={dismissLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm font-semibold text-emerald-700">
          {completedCount} of {GETTING_STARTED_STEPS.length} steps complete
        </p>

        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {GETTING_STARTED_STEPS.map((step) => {
            const Icon = STEP_ICONS[step.id];
            const completed = stepCompletion[step.id];

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepAction(step.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50 ${
                    completed
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      completed ? "bg-emerald-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Step {step.step}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-slate-950">{step.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{step.helper}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => onStepAction("note")}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
          >
            <FileText className="h-4 w-4" />
            Get started — create a note
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:w-auto"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
