import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { acceptWorkspaceInvite, fetchWorkspaceInvite } from "../api/workspaces.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const { booting, user } = useAuth();
  const { t } = useI18n();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvite = async () => {
      setLoading(true);
      setError("");

      try {
        const nextInvite = await fetchWorkspaceInvite(token);
        setInvite(nextInvite);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  const acceptInvite = async () => {
    setAccepting(true);
    setMessage("");
    setError("");

    try {
      await acceptWorkspaceInvite(token);
      setMessage(t("teamGrowing"));
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  const emailMatches =
    user && invite?.invitedEmail && user.email.toLowerCase() === invite.invitedEmail.toLowerCase();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                {t("workspaceInvite")}
              </p>
              <h1 className="text-2xl font-bold text-slate-950">{t("acceptInvite")}</h1>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center gap-2 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : null}

          {invite ? (
            <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">{t("workspace")}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{invite.workspaceName}</p>
              <p className="mt-3 text-sm text-slate-600">
                {t("invitedEmail")}: <span className="font-semibold">{invite.invitedEmail}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t("workspaceRole")}: <span className="font-semibold capitalize">{t(invite.workspaceRole)}</span>
              </p>
            </div>
          ) : null}

          {booting ? (
            <div className="mt-5 flex items-center gap-2 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : null}

          {!booting && !user && !loading ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">{t("loginToAcceptInvite")}</p>
              <Link
                to="/login"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {t("logIn")}
              </Link>
            </div>
          ) : null}

          {!booting && user && invite && !emailMatches ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{t("inviteEmailMismatch")}</p>
            </div>
          ) : null}

          {!booting && user && invite && emailMatches && !message ? (
            <button
              type="button"
              onClick={acceptInvite}
              disabled={accepting}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t("acceptInvite")}
            </button>
          ) : null}

          {message ? (
            <div className="mt-5 flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <p>{message}</p>
                <Link to="/settings" className="mt-2 inline-flex font-semibold text-emerald-900">
                  {t("settings")}
                </Link>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <Link
            to="/dashboard"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("backToDashboard")}
          </Link>
        </section>
      </div>
    </main>
  );
}
