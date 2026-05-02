import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  MessageSquare,
  NotebookTabs,
  Paperclip,
  Pin,
  Search,
  Shield,
  Sparkles,
  Star,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { trackEvent } from "../api/analytics.js";

const LANDING_EMAIL_KEY = "notes_api_landing_email";

const featureHighlights = [
  {
    icon: FileText,
    title: "Standard notes",
    copy: "Capture daily ideas, tasks, decisions, and office knowledge in one organized workspace."
  },
  {
    icon: NotebookTabs,
    title: "Meeting notes",
    copy: "Turn meeting records into structured summaries, action items, attendees, and follow-ups."
  },
  {
    icon: Bot,
    title: "AI summaries and tags",
    copy: "Summarize notes, suggest useful tags, and generate insights across loaded notes."
  },
  {
    icon: Users,
    title: "Workspaces for teams",
    copy: "Create shared notes for your office while keeping private notes separate."
  },
  {
    icon: MessageSquare,
    title: "Comments and attachments",
    copy: "Discuss notes in context and attach files your team needs to move work forward."
  },
  {
    icon: Globe2,
    title: "Multilingual support",
    copy: "Switch languages from the dashboard and keep the app comfortable for more users."
  }
];

const faqItems = [
  {
    question: "Can I use it for personal notes?",
    answer: "Yes. Private notes stay visible only to you, and you can organize them with categories, tags, pins, stars, and search."
  },
  {
    question: "How do meeting notes work?",
    answer: "Choose Meeting as the note type, add meeting details, use the template, and save structured meeting information for later."
  },
  {
    question: "What does AI help with?",
    answer: "AI can summarize notes, suggest tags, generate insights, convert rough notes into meeting minutes, and extract action items."
  },
  {
    question: "Is there a free plan?",
    answer: "Yes. The Free plan includes notes, personal organization, and basic AI usage. Premium adds more AI usage and team-focused tools."
  }
];

const pricingPlans = [
  {
    name: "Free",
    description: "Start organizing personal notes and lightweight work.",
    price: "$0",
    cta: "Get started",
    to: "/register",
    features: ["Notes", "Basic AI usage", "Personal organization"]
  },
  {
    name: "Premium",
    description: "Unlock more AI usage and stronger team workflows.",
    price: "Upgrade",
    cta: "Upgrade / Premium",
    to: "/register",
    featured: true,
    features: ["More AI usage", "Meeting intelligence", "Workspace collaboration", "Export and billing tools"]
  }
];

function CtaLink({ children, onClick, to, variant = "primary" }) {
  const className =
    variant === "primary"
      ? "premium-button inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
      : "premium-button inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-100";

  return (
    <Link to={to} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{copy}</p>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    trackEvent("landing_page_view");
  }, []);

  const trackClick = (eventName, metadata = {}) => {
    trackEvent(eventName, metadata);
  };

  const submitEmailCapture = (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (trimmedEmail) {
      localStorage.setItem(LANDING_EMAIL_KEY, trimmedEmail);
    }

    trackClick("click_get_started", { location: "hero_email_capture" });
    navigate("/register");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/[0.03] backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white">
              <NotebookTabs className="h-5 w-5" />
            </span>
            Notes API
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950">Features</a>
            <a href="#pricing" onClick={() => trackClick("click_pricing", { location: "nav" })} className="hover:text-slate-950">Pricing</a>
            <a href="#faq" className="hover:text-slate-950">FAQ</a>
            <Link to="/guide" className="hover:text-slate-950">Guide</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              onClick={() => trackClick("click_login", { location: "header" })}
              className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={() => trackClick("click_register", { location: "header" })}
            className="premium-button inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-800"
            >
              Register
            </Link>
          </div>
        </nav>
      </header>

      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-slate-200/80 bg-white/95 p-2 shadow-2xl shadow-slate-950/20 backdrop-blur">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            to="/register"
            onClick={() => trackClick("click_get_started", { location: "sticky_start_free" })}
            className="premium-button inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-800"
          >
            Start Free
          </Link>
          <Link
            to="/register"
            onClick={() => trackClick("click_upgrade", { location: "sticky_try_premium" })}
            className="premium-button inline-flex h-10 items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 shadow-sm shadow-emerald-950/[0.03] transition hover:bg-emerald-100"
          >
            Try Premium
          </Link>
        </div>
      </div>

      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-35">
          <div className="absolute left-1/2 top-12 h-[560px] w-[920px] -translate-x-1/2 rounded-[2rem] border border-white/15 bg-slate-900 shadow-2xl" />
          <div className="absolute left-[calc(50%-380px)] top-24 w-[520px] rounded-lg border border-white/15 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="h-3 w-28 rounded bg-emerald-600" />
                <div className="mt-2 h-2 w-44 rounded bg-slate-200" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-md bg-slate-100" />
                <div className="h-8 w-20 rounded-md bg-slate-950" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-emerald-50 p-3">
                <Pin className="h-4 w-4 text-emerald-700" />
                <div className="mt-4 h-2 w-16 rounded bg-emerald-600" />
                <div className="mt-2 h-2 w-24 rounded bg-emerald-100" />
              </div>
              <div className="rounded-md border border-slate-200 bg-amber-50 p-3">
                <Star className="h-4 w-4 text-amber-600" />
                <div className="mt-4 h-2 w-20 rounded bg-amber-500" />
                <div className="mt-2 h-2 w-24 rounded bg-amber-100" />
              </div>
              <div className="rounded-md border border-slate-200 bg-indigo-50 p-3">
                <Bot className="h-4 w-4 text-indigo-700" />
                <div className="mt-4 h-2 w-14 rounded bg-indigo-500" />
                <div className="mt-2 h-2 w-24 rounded bg-indigo-100" />
              </div>
            </div>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="h-3 w-3/4 rounded bg-slate-300" />
              <div className="mt-3 h-2 w-full rounded bg-slate-200" />
              <div className="mt-2 h-2 w-10/12 rounded bg-slate-200" />
              <div className="mt-4 flex gap-2">
                <span className="h-6 w-20 rounded-md bg-emerald-100" />
                <span className="h-6 w-24 rounded-md bg-indigo-100" />
              </div>
            </div>
          </div>
          <div className="absolute right-[calc(50%-420px)] top-64 w-80 rounded-lg border border-white/15 bg-white p-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-700" />
              <div className="h-3 w-36 rounded bg-slate-300" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-md bg-slate-100 p-3">
                <div className="h-2 w-32 rounded bg-slate-300" />
                <div className="mt-2 h-2 w-48 rounded bg-slate-200" />
              </div>
              <div className="rounded-md bg-emerald-50 p-3">
                <div className="h-2 w-28 rounded bg-emerald-500" />
                <div className="mt-2 h-2 w-44 rounded bg-emerald-100" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-100">
              <Sparkles className="h-4 w-4" />
              Notes, meetings, AI, and team knowledge
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-tight text-white sm:text-6xl">
              A smarter workspace for notes, meetings, and team knowledge
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Capture ideas, organize office knowledge, turn meetings into action items, and use AI to work faster.
            </p>
            <form
              onSubmit={submitEmailCapture}
              className="mt-8 flex max-w-xl flex-col gap-3 rounded-lg border border-white/15 bg-white/10 p-2 backdrop-blur sm:flex-row"
            >
              <label className="sr-only" htmlFor="landing-email">Enter your email to get started</label>
              <input
                id="landing-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email to get started"
                className="h-12 min-w-0 flex-1 rounded-md border border-white/20 bg-white px-4 text-sm font-medium text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                autoComplete="email"
              />
              <button
                type="submit"
                className="premium-button inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-950/20 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink to="/register" onClick={() => trackClick("click_get_started", { location: "hero_cta" })}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </CtaLink>
              <CtaLink to="/login" variant="secondary" onClick={() => trackClick("click_login", { location: "hero_cta" })}>Log in</CtaLink>
              <CtaLink to="/register" variant="secondary" onClick={() => trackClick("click_upgrade", { location: "hero_cta" })}>Upgrade / Premium</CtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-2">
          <div className="premium-card premium-card-hover bg-slate-50 p-5">
            <Users className="h-6 w-6 text-emerald-700" />
            <h2 className="mt-3 text-lg font-bold text-slate-950">Built for individuals and teams</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start with private notes, then bring your office into shared workspaces when collaboration grows.
            </p>
          </div>
          <div className="premium-card premium-card-hover bg-slate-50 p-5">
            <Shield className="h-6 w-6 text-emerald-700" />
            <h2 className="mt-3 text-lg font-bold text-slate-950">Secure, fast, and scalable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Protected routes, role-aware admin tools, scoped workspaces, and production-ready deployment guidance.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">The problem</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Office knowledge gets scattered fast.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Meeting notes live in one place.", "Action items get lost after calls.", "Files, comments, and context split across tools."].map((item) => (
              <div key={item} className="premium-card premium-card-hover bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The solution"
          title="One workspace for capturing, organizing, and acting on knowledge."
          copy="Bring notes, meetings, comments, attachments, AI tools, and team collaboration into a focused SaaS workspace that is easy to learn."
        />
      </section>

      <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Features"
            title="Built for everyday notes and real team workflows."
            copy="Start with simple notes, then grow into meeting intelligence, shared workspaces, and premium AI usage when your team needs more."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureHighlights.map((feature) => {
              const Icon = feature.icon;

              return (
                <article key={feature.title} className="premium-card premium-card-hover p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <article className="premium-card premium-card-hover p-6 lg:col-span-2">
            <NotebookTabs className="h-8 w-8 text-indigo-700" />
            <h2 className="mt-4 text-2xl font-bold text-slate-950">Meeting Notes</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use meeting templates, track attendees and follow-up dates, and export meeting notes with clean structure.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Agenda", "Decisions", "Action items"].map((item) => (
                <span key={item} className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 ring-1 ring-indigo-100">
                  {item}
                </span>
              ))}
            </div>
            <Link
              to="/register"
              onClick={() => trackClick("click_register", { location: "try_meeting_notes" })}
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white transition hover:bg-indigo-800"
            >
              Try Meeting Notes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
          <article className="premium-card premium-card-hover p-6">
            <Bot className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-bold text-slate-950">AI Tools</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Summarize notes, suggest tags, generate insights, and turn meetings into structured next steps.
            </p>
            <Link
              to="/register"
              onClick={() => trackClick("click_register", { location: "try_ai_tools" })}
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Try AI Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Workspace Collaboration</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Private when you need it. Shared when the team needs it.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Workspaces help offices share knowledge without losing personal organization. Add comments, upload attachments, and invite staff into shared notes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Shield, label: "Private and workspace notes" },
              { icon: MessageSquare, label: "Threaded context with comments" },
              { icon: Paperclip, label: "File attachments" },
              { icon: Search, label: "Search and smart filters" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="premium-card premium-card-hover bg-slate-50 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Upgrade when AI and teamwork become part of the workflow."
            copy="Free keeps personal organization simple. Premium gives heavier teams more room for AI-powered work."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-lg border p-6 shadow-sm ${
                  plan.featured ? "border-emerald-400 bg-emerald-50/70 shadow-emerald-950/10" : "border-slate-200 bg-white shadow-slate-950/5"
                }`}
              >
                {plan.featured ? (
                  <span className="absolute right-4 top-4 rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                ) : null}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>
                  </div>
                  {plan.featured ? <CreditCard className="h-6 w-6 text-emerald-700" /> : null}
                </div>
                <p className="mt-6 text-3xl font-bold text-slate-950">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.to}
                  onClick={() =>
                    trackClick(plan.featured ? "click_upgrade" : "click_get_started", {
                      location: "pricing",
                      plan: plan.name
                    })
                  }
                  className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-emerald-700 text-white hover:bg-emerald-800"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions before you start?"
            copy="Here are the basics for new users, teams, and anyone evaluating Premium."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="premium-card premium-card-hover bg-slate-50 p-5">
                <div className="flex gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{item.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-lg border border-slate-800 bg-slate-950 px-6 py-12 text-center shadow-2xl shadow-slate-950/20">
          <h2 className="text-3xl font-bold text-white">Ready to organize your notes and meetings?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Start free, explore the guide, and upgrade when your team is ready for more AI-powered knowledge work.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaLink to="/register" onClick={() => trackClick("click_get_started", { location: "final_cta" })}>Get started</CtaLink>
            <CtaLink to="/login" variant="secondary" onClick={() => trackClick("click_login", { location: "final_cta" })}>Log in</CtaLink>
            <CtaLink to="/guide" variant="secondary">Read the Guide</CtaLink>
          </div>
        </div>
      </section>
    </main>
  );
}
