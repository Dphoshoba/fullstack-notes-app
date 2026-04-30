import {
  Bot,
  CreditCard,
  FileQuestion,
  FolderSearch,
  HelpCircle,
  LayoutDashboard,
  MessageSquareText,
  NotebookText,
  Shield,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "../context/I18nContext.jsx";

const quickStartKeys = [
  "guideQuickStartStep1",
  "guideQuickStartStep2",
  "guideQuickStartStep3",
  "guideQuickStartStep4",
  "guideQuickStartStep5",
  "guideQuickStartStep6",
  "guideQuickStartStep7",
  "guideQuickStartStep8"
];

const guideSections = [
  {
    id: "dashboard-tour",
    icon: LayoutDashboard,
    titleKey: "guideDashboardTourTitle",
    introKey: "guideDashboardTourIntro",
    groups: [
      {
        titleKey: "guideDashboardHeaderTitle",
        items: [
          "guideDashboardHeaderLanguage",
          "guideDashboardHeaderRefresh",
          "guideDashboardHeaderExport",
          "guideDashboardHeaderAccount"
        ]
      },
      {
        titleKey: "guideDashboardStatsTitle",
        items: ["guideDashboardStatsBody", "guideDashboardStatsLoaded"]
      }
    ]
  },
  {
    id: "notes-basics",
    icon: NotebookText,
    titleKey: "guideNotesBasicsTitle",
    introKey: "guideNotesBasicsIntro",
    groups: [
      {
        titleKey: "guideCreateNoteSectionTitle",
        items: ["guideCreateNoteFields", "guideCreateNoteVisibility"]
      },
      {
        titleKey: "guideEditDeleteSectionTitle",
        items: ["guideEditNoteBody", "guideDeleteNoteBody"]
      },
      {
        titleKey: "guidePinStarSectionTitle",
        items: ["guidePinBody", "guideStarBody"]
      }
    ]
  },
  {
    id: "organizing-finding",
    icon: FolderSearch,
    titleKey: "guideOrganizingFindingTitle",
    introKey: "guideOrganizingFindingIntro",
    groups: [
      {
        titleKey: "guideCategoriesTagsTitle",
        items: ["guideCategoryBody", "guideTagsBody"]
      },
      {
        titleKey: "guideSearchFiltersTitle",
        items: ["guideSearchBody", "guideScopeFilterBody", "guideFilterBody", "guidePaginationBody"]
      }
    ]
  },
  {
    id: "collaboration",
    icon: MessageSquareText,
    titleKey: "guideCollaborationTitle",
    introKey: "guideCollaborationIntro",
    groups: [
      {
        titleKey: "guideCommentsAttachmentsTitle",
        items: ["guideCommentsBody", "guideAttachmentsBody", "guideAttachmentPermissionsBody"]
      },
      {
        titleKey: "guideWorkspaceSectionTitle",
        items: ["guidePrivateWorkspaceBody", "guideWorkspaceRolesBody", "guideWorkspaceInviteBody"]
      }
    ]
  },
  {
    id: "ai-tools",
    icon: Bot,
    titleKey: "guideAiUsageTitle",
    introKey: "guideAiUsageIntro",
    groups: [
      {
        titleKey: "guideAiActionsTitle",
        items: ["guideAiSelectNoteBody", "guideAiSummarizeBody", "guideAiTagsBody", "guideAiInsightsBody"]
      },
      {
        titleKey: "guideAiUsageLimitsTitle",
        items: ["guideAiResultBody", "guideAiLimitBody"]
      }
    ]
  },
  {
    id: "billing-account",
    icon: CreditCard,
    titleKey: "guideBillingAccountTitle",
    introKey: "guideBillingAccountIntro",
    groups: [
      {
        titleKey: "guidePlanBillingTitle",
        items: ["guidePlanUsageBody", "guideUpgradeBody", "guideBillingPortalBody"]
      },
      {
        titleKey: "guideAccountSettingsTitle",
        items: ["guideProfileBody", "guideSettingsBody", "guideLanguagesBody"]
      }
    ]
  },
  {
    id: "admin-tools",
    icon: Shield,
    titleKey: "guideAdminToolsTitle",
    introKey: "guideAdminToolsIntro",
    groups: [
      {
        titleKey: "guideAdminAccessTitle",
        items: ["guideAdminBody", "guideSuperadminBody", "guideRoleExplanationBody"]
      }
    ]
  }
];

const faqKeys = [
  "guideFaqLogin",
  "guideFaqNotes",
  "guideFaqSearch",
  "guideFaqWorkspace",
  "guideFaqAttachment",
  "guideFaqAi",
  "guideFaqStripe",
  "guideFaqPortal",
  "guideFaqLanguage",
  "guideFaqAdmin"
];

function SectionCard({ section }) {
  const { t } = useI18n();
  const Icon = section.icon;

  return (
    <article
      id={section.id}
      className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-950">{t(section.titleKey)}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t(section.introKey)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {section.groups.map((group) => (
          <div key={group.titleKey} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-950">{t(group.titleKey)}</h3>
            <ul className="mt-3 space-y-2">
              {group.items.map((key) => (
                <li key={key} className="flex gap-2 text-sm leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function GuidePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t("guideEyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              {t("guideTitle")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {t("guideSubtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("backToDashboard")}
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {t("guideOpenDashboard")}
            </Link>
          </div>
        </div>

        <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-950">{t("guideQuickStartTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("guideQuickStartSubtitle")}</p>
            </div>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickStartKeys.map((key, index) => (
              <li key={key} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-medium leading-6 text-slate-700">{t(key)}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-semibold text-slate-950">{t("guideContentsTitle")}</h2>
            </div>
            <nav className="mt-3 space-y-1">
              {guideSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {t(section.titleKey)}
                </a>
              ))}
              <a
                href="#faq"
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              >
                {t("guideFaqTitle")}
              </a>
            </nav>
          </aside>

          <div className="space-y-6">
            {guideSections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}

            <section
              id="faq"
              className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <FileQuestion className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{t("guideFaqTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t("guideFaqIntro")}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {faqKeys.map((key) => (
                  <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium leading-6 text-slate-700">{t(key)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
