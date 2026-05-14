export const DAILY_BRIEFING_DISMISSED_KEY = "notes_api_daily_briefing_dismissed";

export const MOCK_DAILY_BRIEFING = {
  priorities: [
    "Finalize Q2 revenue forecast and share with leadership",
    "Review vendor contract updates before Friday",
    "Prepare talking points for the client check-in"
  ],
  deadlines: [
    { label: "Submit expense report", due: "Today, 5:00 PM" },
    { label: "Board prep deck draft", due: "Tomorrow" },
    { label: "Renew domain registration", due: "Friday" }
  ],
  followUps: [
    "Email Alex the revised project timeline",
    "Schedule follow-up with design on homepage copy",
    "Send meeting recap to the sales team"
  ],
  meetingActions: [
    { title: "Product sync", action: "Assign owner for onboarding checklist" },
    { title: "Weekly standup", action: "Confirm launch date with engineering" },
    { title: "Client call", action: "Share pricing options by EOD" }
  ],
  productivityReminder:
    "Block 90 minutes this morning for deep work on your highest-impact priority before checking messages."
};

export const BRIEFING_CARD_DEFINITIONS = [
  {
    id: "priorities",
    title: "Top priorities",
    helper: "Focus on these priorities today"
  },
  {
    id: "deadlines",
    title: "Upcoming deadlines",
    helper: "Upcoming actions needing attention"
  },
  {
    id: "follow-ups",
    title: "Suggested follow-ups",
    helper: "AI-recommended follow-ups"
  },
  {
    id: "meeting-actions",
    title: "Recent meeting actions",
    helper: "Action items from recent meetings"
  },
  {
    id: "productivity",
    title: "Productivity reminder",
    helper: "A quick nudge to stay on track today"
  }
];
