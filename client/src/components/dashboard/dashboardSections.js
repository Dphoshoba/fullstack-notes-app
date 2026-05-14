export const DASHBOARD_SECTIONS = [
  { id: "home", label: "Dashboard", helper: "Your overview and next steps" },
  { id: "notes", label: "Notes", helper: "Create a note" },
  { id: "ai-tools", label: "AI Tools", helper: "Use AI on your notes" },
  { id: "meetings", label: "Meetings", helper: "Turn meetings into action items" },
  { id: "workspace", label: "Workspace", helper: "Invite your team" },
  { id: "settings", label: "Settings", helper: "Account and preferences" }
];

export const DEFAULT_DASHBOARD_SECTION = "home";

export function isDashboardSection(value) {
  return DASHBOARD_SECTIONS.some((section) => section.id === value);
}
