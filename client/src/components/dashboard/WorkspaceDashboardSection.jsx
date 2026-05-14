import { Link } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

import { SectionEmptyState } from "./SectionEmptyState.jsx";

export function WorkspaceDashboardSection({
  workspaceInfo,
  hasWorkspace,
  t,
  onGoToSettings
}) {
  const workspace = workspaceInfo.workspace;

  if (!hasWorkspace) {
    return (
      <section
        id="dashboard-panel-workspace"
        role="tabpanel"
        aria-labelledby="dashboard-tab-workspace"
        className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8"
      >
        <SectionEmptyState
          title="No workspace yet"
          description="Create a workspace in Settings, then invite teammates to share notes and meeting intelligence."
          actionLabel="Invite your team"
          onAction={onGoToSettings}
        />
      </section>
    );
  }

  return (
    <section
      id="dashboard-panel-workspace"
      role="tabpanel"
      aria-labelledby="dashboard-tab-workspace"
      className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="premium-panel p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-slate-950">{t("workspace")}</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Invite your team and collaborate on shared notes.
        </p>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Workspace details
          </p>
          <p className="mt-2 text-base font-semibold text-slate-950">{workspace.name}</p>
          <p className="mt-1 text-sm text-slate-600">
            Your role: <span className="font-semibold capitalize">{workspaceInfo.role}</span>
          </p>
        </div>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collaboration</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Share workspace notes with your team.</li>
            <li>Invite members from Settings to collaborate.</li>
            <li>Use meeting intelligence on shared meeting notes.</li>
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/settings"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <UserPlus className="h-4 w-4" />
            {t("invite")}
          </Link>
          <button
            type="button"
            onClick={onGoToSettings}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("settings")}
          </button>
        </div>
      </div>
    </section>
  );
}
