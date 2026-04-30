import { Link } from "react-router-dom";

import { useI18n } from "../context/I18nContext.jsx";

export function AuthLayout({ title, subtitle, footer, children }) {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="flex flex-col justify-between border-b border-slate-200 bg-white px-6 py-8 lg:border-b-0 lg:border-r lg:px-10">
          <Link to="/dashboard" className="text-sm font-bold tracking-wide text-slate-950">
            Notes API
          </Link>
          <div className="py-12 lg:py-0">
            <p className="text-sm font-semibold text-emerald-700">{t("expressMongo")}</p>
            <h1 className="mt-4 max-w-sm text-4xl font-bold tracking-normal text-slate-950">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              {t("heroCopy")}
            </p>
          </div>
          <p className="text-xs text-slate-500">{t("backendLabel")}</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </div>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
