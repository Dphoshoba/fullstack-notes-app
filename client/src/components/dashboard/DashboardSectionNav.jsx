import { DASHBOARD_SECTIONS } from "./dashboardSections.js";

export function DashboardSectionNav({ activeSection, onChange }) {
  return (
    <nav
      className="border-b border-slate-200/80 bg-white/90 backdrop-blur"
      aria-label="Dashboard sections"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 sm:mx-0 sm:flex-wrap sm:px-0"
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
                onClick={() => onChange(section.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10"
                    : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="block text-sm font-semibold">{section.label}</span>
                <span
                  className={`mt-0.5 block text-[11px] font-medium leading-tight ${
                    active ? "text-emerald-50/90" : "text-slate-500"
                  }`}
                >
                  {section.helper}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
