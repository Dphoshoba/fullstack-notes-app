import { ArrowLeft, CheckCircle2, HelpCircle, Mail, NotebookTabs, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const supportEmail = "support@notesworkspace.app";

const pageContent = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    subtitle: "How Notes Workspace handles account, notes, workspace, billing, and analytics data.",
    icon: Shield,
    sections: [
      {
        title: "What we collect",
        items: [
          "Account information such as name, email, role, plan, and workspace membership.",
          "Content you create, including notes, meeting details, comments, attachments metadata, categories, tags, and action note fields.",
          "Usage information such as first-party analytics events, common paths, AI usage count, invite activity, and app actions.",
          "Billing status from Stripe, such as whether your plan is Free or Premium. Card details are handled by Stripe, not this app."
        ]
      },
      {
        title: "How we use data",
        items: [
          "To provide protected note, workspace, AI, billing, notification, and account features.",
          "To keep private notes visible only to the owner and workspace notes visible only to permitted workspace members.",
          "To improve product reliability and understand which workflows are being used.",
          "To send transactional emails for invites, comments, attachments, and billing events when email is configured."
        ]
      },
      {
        title: "AI and analytics",
        items: [
          "AI requests are sent from the backend to the configured AI provider only when users trigger AI actions.",
          "First-party analytics are stored in MongoDB and should not include passwords, payment details, JWTs, secrets, or card data.",
          "Admins can view summary analytics, but the app should not expose sensitive user content in analytics dashboards."
        ]
      },
      {
        title: "Security basics",
        items: [
          "Access tokens protect API routes, while refresh tokens are stored in HTTP-only cookies.",
          "Production secrets belong in Render and Netlify environment settings, not source code.",
          "File uploads are limited by type and size, and attachment access follows note permissions."
        ]
      }
    ]
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms of Use",
    subtitle: "Simple rules for using Notes Workspace responsibly.",
    icon: CheckCircle2,
    sections: [
      {
        title: "Using the app",
        items: [
          "Use Notes Workspace only for lawful notes, files, comments, meetings, and workspace collaboration.",
          "Keep your login details private and tell an administrator if you believe your account was accessed without permission.",
          "Do not upload malware, harmful content, illegal content, or files you do not have permission to share."
        ]
      },
      {
        title: "Workspace responsibilities",
        items: [
          "Workspace owners and managers are responsible for inviting the right people and managing member access.",
          "Private notes should remain private to the owner. Workspace notes may be visible to permitted workspace members.",
          "Users should review shared notes before relying on them for business decisions."
        ]
      },
      {
        title: "AI and billing",
        items: [
          "AI output may be incomplete or inaccurate. Review AI summaries, tags, meeting minutes, and action items before using them.",
          "Free and Premium usage limits may apply to AI features.",
          "Payments and billing portal actions are handled by Stripe. Premium access depends on verified billing events."
        ]
      },
      {
        title: "Availability",
        items: [
          "The app may be updated, improved, paused, or unavailable during maintenance.",
          "Render free instances may sleep after inactivity, which can delay the first backend request.",
          "Users should export important information when they need an offline copy."
        ]
      }
    ]
  },
  support: {
    eyebrow: "Support",
    title: "Support Center",
    subtitle: "A simple place to get help, report problems, and check common launch issues.",
    icon: HelpCircle,
    sections: [
      {
        title: "Before reporting a problem",
        items: [
          "Refresh the page once, especially after a new deployment.",
          "Check that you are logged in with the correct email address.",
          "Try the same action in a normal browser tab if the installed PWA behaves differently.",
          "On mobile, confirm microphone, file, and site permissions in device settings."
        ]
      },
      {
        title: "What to include",
        items: [
          "Your device and browser, such as iPhone Safari or Android Chrome.",
          "The page or feature that failed, such as Notes, Calendar, AI Workspace, Settings, invite, or billing.",
          "The exact message you saw, plus a screenshot if possible.",
          "Whether the issue happens every time or only sometimes."
        ]
      },
      {
        title: "Common fixes",
        items: [
          "If you see “Please log in again,” log out and log back in.",
          "If voice input fails, refresh after granting microphone permission.",
          "If an invite email does not arrive, copy and share the invite link manually.",
          "If AI is unavailable, check your usage limit and try again after the backend is awake."
        ]
      }
    ]
  }
};

export default function LegalPage({ type }) {
  const content = pageContent[type] || pageContent.support;
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white">
              <NotebookTabs className="h-5 w-5" />
            </span>
            Notes Workspace
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-700">{content.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">{content.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{content.subtitle}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">Last updated: October 16, 2026</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            {content.sections.map((section) => (
              <section key={section.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {type === "support" ? (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Report a problem</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Send a short message with the feature, device, browser, and screenshot or error text.
              </p>
              <a
                href={`mailto:${supportEmail}?subject=Notes%20Workspace%20Support%20Request`}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Mail className="h-4 w-4" />
                Email support
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
