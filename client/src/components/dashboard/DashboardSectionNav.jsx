import { DASHBOARD_SECTIONS } from "./dashboardSections.js";

export function DashboardSectionNav({ activeSection, onChange }) {
  return (
    <nav
      className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
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
  );
}
