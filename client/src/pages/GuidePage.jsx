import {
  Bot,
  CreditCard,
  Globe2,
  HelpCircle,
  KeyRound,
  NotebookText,
  Pin,
  Search,
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
  "guideQuickStartStep7"
];

const featureSections = [
  {
    icon: KeyRound,
    titleKey: "guideAuthTitle",
    items: ["guideRegisterBody", "guideLoginBody", "guideDashboardBody"]
  },
  {
    icon: NotebookText,
    titleKey: "guideNotesTitle",
    items: ["guideCreateNoteBody", "guideEditNoteBody", "guideDeleteNoteBody"]
  },
  {
    icon: Pin,
    titleKey: "guideOrganizeTitle",
    items: ["guidePinBody", "guideStarBody", "guideCategoryBody"]
  },
  {
    icon: Search,
    titleKey: "guideFindExportTitle",
    items: ["guideSearchBody", "guideFilterBody", "guideExportBody"]
  },
  {
    icon: Globe2,
    titleKey: "guideLanguagesTitle",
    items: ["guideLanguagesBody"]
  },
  {
    icon: Bot,
    titleKey: "guideAiTitle",
    items: ["guideAiSummarizeBody", "guideAiTagsBody", "guideAiInsightsBody", "guideAiLimitBody"]
  },
  {
    icon: Sparkles,
    titleKey: "guidePremiumTitle",
    items: ["guidePremiumBody", "guideUpgradeBody"]
  },
  {
    icon: CreditCard,
    titleKey: "guideBillingTitle",
    items: ["guideBillingBody", "guideBillingPortalBody"]
  },
  {
    icon: Shield,
    titleKey: "guideAdminTitle",
    items: ["guideAdminBody", "guideSuperadminBody"]
  }
];

const troubleshootingKeys = [
  "guideTroubleLogin",
  "guideTroubleNotes",
  "guideTroubleAi",
  "guideTroubleStripe",
  "guideTroubleLanguage",
  "guideTroubleAdmin",
  "guideTroublePortal"
];

export default function GuidePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t("guideEyebrow")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              {t("guideTitle")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
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
              {t("guideUpgradeCta")}
            </Link>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t("guideQuickStartTitle")}</h2>
              <p className="text-sm text-slate-500">{t("guideQuickStartSubtitle")}</p>
            </div>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
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

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {featureSections.map((section) => {
            const Icon = section.icon;

            return (
              <article
                key={section.titleKey}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold text-slate-950">{t(section.titleKey)}</h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {section.items.map((key) => (
                    <li key={key} className="flex gap-2 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{t("guideAiPremiumTitle")}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
                  {t("guideAiPremiumBody")}
                </p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {t("guideUpgradeCta")}
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-950">{t("guideTroubleshootingTitle")}</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {troubleshootingKeys.map((key) => (
              <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium leading-6 text-slate-700">{t(key)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
