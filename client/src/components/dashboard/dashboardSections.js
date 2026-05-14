export const DASHBOARD_SECTIONS = [
  { id: "home", label: "Home", helper: "Your business overview" },
  { id: "notes", label: "Notes", helper: "Capture and organize ideas" },
  { id: "meetings", label: "Meetings", helper: "Turn meetings into action items" },
  { id: "ai-workspace", label: "AI Workspace", helper: "Use AI to organize business notes" },
  { id: "team", label: "Team", helper: "Collaborate with your team" },
  { id: "settings", label: "Settings", helper: "Account and billing" }
];

export const DEFAULT_DASHBOARD_SECTION = "home";

const LEGACY_SECTION_ALIASES = {
  dashboard: "home",
  "ai-tools": "ai-workspace",
  workspace: "team"
};

export function isDashboardSection(value) {
  return DASHBOARD_SECTIONS.some((section) => section.id === value);
}

export function normalizeDashboardSection(value) {
  if (!value) {
    return DEFAULT_DASHBOARD_SECTION;
  }

  const normalized = LEGACY_SECTION_ALIASES[value] || value;
  return isDashboardSection(normalized) ? normalized : DEFAULT_DASHBOARD_SECTION;
}
