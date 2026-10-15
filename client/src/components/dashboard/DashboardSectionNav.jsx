import {
  Bot,
  CalendarDays,
  FileText,
  Home,
  Settings,
  Users,
  Video
} from "lucide-react";

import { DASHBOARD_SECTIONS } from "./dashboardSections.js";

const SECTION_ICONS = {
  home: Home,
  notes: FileText,
  calendar: CalendarDays,
  meetings: Video,
  "ai-workspace": Bot,
  team: Users,
  settings: Settings
};

export function DashboardSectionNav({ activeSection, onChange }) {
  return (
    <>
      <nav
        className="sticky top-0 z-30 hidden border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 md:block"
        aria-label="Dashboard sections"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="-mx-4 flex gap-1 overflow-x-auto overscroll-x-contain px-4 py-1.5 sm:mx-0 sm:px-0 [&>*]:shrink-0"
            role="tablist"
          >
            {DASHBOARD_SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  id={`dashboard-tab-${section.id}`}
                  aria-selected={active}
                  aria-controls={`dashboard-panel-${section.id}`}
                  title={section.helper}
                  onClick={() => onChange(section.id)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                    active
                      ? "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-12px_35px_-28px_rgb(15_23_42_/_0.7)] backdrop-blur md:hidden"
        aria-label="Dashboard mobile sections"
      >
        <div
          className="mx-auto flex max-w-md gap-1 overflow-x-auto overscroll-x-contain px-1"
          role="tablist"
        >
          {DASHBOARD_SECTIONS.map((section) => {
            const active = activeSection === section.id;
            const SectionIcon = SECTION_ICONS[section.id] || FileText;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                id={`dashboard-tab-${section.id}`}
                aria-selected={active}
                aria-controls={`dashboard-panel-${section.id}`}
                title={section.helper}
                onClick={() => onChange(section.id)}
                className={`flex min-w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <SectionIcon className="h-4 w-4" />
                <span className="max-w-full truncate">{section.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
