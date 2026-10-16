import {
  Bot,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  MessageSquareText,
  NotebookText,
  Shield,
  Users
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

import { trackEvent } from "../api/analytics.js";

const sections = [
  {
    id: "quick-start",
    title: "Quick Start",
    icon: CheckCircle2,
    items: [
      "Register or log in.",
      "Create your first private standard note.",
      "Add a category and tags so the note is easy to find later.",
      "Pin or star important notes.",
      "Use search, filters, and smart chips to narrow the list.",
      "Try the included Free AI actions for summaries and tag suggestions.",
      "Upgrade to Premium if you need team workspaces, meeting notes, comments, attachments, exports, or advanced AI tools.",
      "Use Settings to update your profile, language, billing, and workspace options."
    ]
  },
  {
    id: "plans",
    title: "Free vs Premium",
    icon: CreditCard,
    groups: [
      {
        title: "Free plan",
        items: [
          "Private standard notes",
          "Categories and tags",
          "Pin and star",
          "Search, filters, smart chips, and pagination",
          "Limited basic AI summaries and tag suggestions",
          "Profile, settings, language selector, notifications, and guide"
        ]
      },
      {
        title: "Premium plan",
        items: [
          "More AI usage",
          "Advanced AI tools and AI Insights",
          "Meeting notes and meeting AI actions",
          "Workspace notes",
          "Team invitations and member management",
          "Comments and attachments",
          "Export to Markdown and JSON",
          "Stripe billing portal access"
        ]
      }
    ]
  },
  {
    id: "notes",
    title: "Notes",
    icon: NotebookText,
    items: [
      "Standard notes are regular notes. On the Free plan, standard notes are private.",
      "Premium users can also create workspace notes for team collaboration.",
      "Use Create note to add a title, body, category, tags, visibility, pinned status, and starred status.",
      "Use Edit to update a note. Use Delete to remove a note after confirmation.",
      "Private notes are visible only to you. Workspace notes are visible to members of your workspace and require Premium."
    ]
  },
  {
    id: "meetings",
    title: "Meeting Notes",
    icon: FileText,
    items: [
      "Meeting notes are a Premium feature.",
      "Set Note type to Meeting to add meeting date, attendees, follow-up date, and meeting template content.",
      "The meeting template adds Agenda, Discussion, Decisions, Action items, and Next steps.",
      "Meeting note cards show a Meeting badge and can show a Meeting summary when meeting details exist.",
      "If you are on the Free plan, the Meeting option is disabled and the app shows an Upgrade to Premium path."
    ]
  },
  {
    id: "organize",
    title: "Organizing and Finding Notes",
    icon: HelpCircle,
    items: [
      "Use categories for broad groups such as General, Work, Personal, Ideas, or Tasks.",
      "Use tags as flexible labels. Add multiple tags separated by commas.",
      "Search matches note title, body, and tags.",
      "Use filters for scope, note type, category, and favorites.",
      "Use smart chips for Pinned, Starred, Workspace, Private, This week, Action notes, Due today, Due this week, Overdue, and Done.",
      "Changing search or filters resets the list to page 1."
    ]
  },
  {
    id: "collaboration",
    title: "Comments, Attachments, and Workspaces",
    icon: MessageSquareText,
    items: [
      "Comments are a Premium feature. Use Comments / Attachments on a note card to view or add comments.",
      "Attachments are a Premium feature. Supported files include PDF, images, DOC, DOCX, TXT, and MD up to 10MB.",
      "A workspace is a Premium shared area for an office or team.",
      "Workspace owners and managers can create invitation links from Settings.",
      "Free users may see their default workspace record, but inviting members, managing team members, and creating workspace notes require Premium."
    ]
  },
  {
    id: "ai",
    title: "AI Tools and Usage",
    icon: Bot,
    groups: [
      {
        title: "Free AI actions",
        items: ["Summarize a note", "Suggest tags"]
      },
      {
        title: "Premium AI actions",
        items: [
          "Improve writing",
          "Extract tasks",
          "Executive summary",
          "Follow-up email",
          "Study notes",
          "Generate smart insights",
          "AI Insights Dashboard",
          "Semantic search",
          "Convert to meeting minutes",
          "Extract action items",
          "Extract attendees and decisions",
          "Meeting intelligence"
        ]
      },
      {
        title: "Saving AI results",
        items: [
          "Save to note",
          "Save as comment, which requires Premium",
          "Replace note body, append to note body, or save to meeting details for meeting AI results",
          "The app does not silently overwrite note content. You choose how the AI result should be saved."
        ]
      }
    ]
  },
  {
    id: "billing",
    title: "Upgrade and Billing",
    icon: CreditCard,
    items: [
      "The dashboard header and Plan & Usage section show Upgrade to Premium for Free users.",
      "Use Upgrade to open Stripe Checkout.",
      "Premium users see a Premium badge and can use Manage billing to open the Stripe billing portal.",
      "Plan changes come from verified Stripe billing events, not manual frontend changes.",
      "If a Premium subscription is cancelled, the app receives a Stripe billing event and returns the account to the Free plan."
    ]
  },
  {
    id: "export",
    title: "Export",
    icon: Download,
    items: [
      "Export is a Premium feature.",
      "Use Export in the Dashboard header to download currently visible notes.",
      "Export formats are Markdown and JSON.",
      "Meeting notes export with structured meeting sections, including agenda, discussion, decisions, action items, attendees, and follow-up date."
    ]
  },
  {
    id: "roles",
    title: "Roles and Admin",
    icon: Shield,
    items: [
      "App roles are separate from workspace roles.",
      "A user can use the app features allowed by their Free or Premium plan.",
      "Admins can open the Admin panel and view users.",
      "Superadmins can view users and change another user's role.",
      "Superadmins cannot change their own role from the modal."
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: Users,
    items: [
      "Cannot log in: check your email and password, then confirm the backend is running.",
      "Notes are not loading: select Refresh and confirm the backend and MongoDB connection are running.",
      "Cannot see workspace notes: confirm you are on Premium and belong to a workspace.",
      "Cannot upload an attachment: confirm you are on Premium, then check file type and size.",
      "AI tools are disabled: you may have reached the Free plan AI limit or selected a Premium AI action.",
      "Cannot create meeting notes: upgrade to Premium.",
      "Cannot export notes: upgrade to Premium.",
      "Upgrade does not open Stripe: confirm Stripe environment variables are configured on the backend.",
      "Manage billing does not open: confirm the user has an active Premium Stripe customer."
    ]
  }
];

function ManualSection({ section }) {
  const Icon = section.icon;

  return (
    <section id={section.id} className="premium-card scroll-mt-6 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
        </div>
      </div>

      {section.items ? (
        <ul className="mt-5 space-y-2">
          {section.items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.groups ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {section.groups.map((group) => (
            <div key={group.title} className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="text-sm font-semibold text-slate-950">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function ManualPage() {
  useEffect(() => {
    trackEvent("manual_view");
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">User manual</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              Notes Workspace Manual
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              A beginner-friendly guide to notes, Premium features, billing, AI tools, workspaces, and troubleshooting.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/guide"
              className="premium-button inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
            >
              Open Guide
            </Link>
            <Link
              to="/dashboard"
              className="premium-button inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="premium-panel h-fit p-4 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-slate-950">Manual contents</h2>
            <nav className="mt-3 space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            {sections.map((section) => (
              <ManualSection key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
