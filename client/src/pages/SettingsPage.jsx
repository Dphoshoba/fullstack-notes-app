import { CheckCircle2, Copy, Loader2, Mail, Mic, Plus, Save, Settings, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { fetchUserSettings } from "../api/users.js";
import {
  addWorkspaceMember,
  createWorkspaceInvite,
  createWorkspace,
  fetchMyWorkspace,
  fetchWorkspaceMembers
} from "../api/workspaces.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function SettingsPage() {
  const { user, updateSettings } = useAuth();
  const { language, languages, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userSettingsRef = useRef(null);
  const workspaceRef = useRef(null);
  const [name, setName] = useState(user?.name || "");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || language);
  const [defaultNoteScope, setDefaultNoteScope] = useState(user?.defaultNoteScope || "private");
  const [workspaceInfo, setWorkspaceInfo] = useState({ workspace: null, role: "staff" });
  const [members, setMembers] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [memberForm, setMemberForm] = useState({ name: "", email: "", role: "staff" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "staff" });
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [microphoneStatus, setMicrophoneStatus] = useState({
    checking: false,
    tone: "idle",
    message: ""
  });

  const canManageMembers = ["owner", "manager"].includes(workspaceInfo.role);
  const hasWorkspace = Boolean(workspaceInfo.workspace);
  const activeSection = searchParams.get("section") === "workspace" ? "workspace" : "account";

  const handleRequestError = useCallback(
    (err) => {
      if (err.status === 401 || err.code === "AUTH_EXPIRED") {
        const message = t("pleaseLogInAgain");
        setError(message);
        navigate("/login", {
          replace: true,
          state: {
            from: { pathname: "/settings" },
            message
          }
        });
        return;
      }

      setError(err.message);
    },
    [navigate, t]
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [settings, workspace] = await Promise.all([fetchUserSettings(), fetchMyWorkspace()]);
      setName(settings.user.name || "");
      setPreferredLanguage(settings.user.preferredLanguage || language);
      setDefaultNoteScope(settings.user.defaultNoteScope || "private");
      setWorkspaceInfo(workspace);

      if (workspace.workspace && ["owner", "manager"].includes(workspace.role)) {
        const nextMembers = await fetchWorkspaceMembers();
        setMembers(nextMembers);
      }
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  }, [handleRequestError, language]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const target = activeSection === "workspace" ? workspaceRef.current : userSettingsRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection, loading]);

  const selectSettingsSection = (section) => {
    setSearchParams(section === "workspace" ? { section: "workspace" } : {});
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updated = await updateSettings({
        name,
        preferredLanguage,
        defaultNoteScope: hasWorkspace ? defaultNoteScope : "private"
      });
      setLanguage(preferredLanguage);
      setDefaultNoteScope(updated.defaultNoteScope || "private");
      setMessage(t("settingsSaved"));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setSaving(false);
    }
  };

  const submitWorkspace = async (event) => {
    event.preventDefault();
    setWorkspaceSaving(true);
    setMessage("");
    setError("");

    try {
      const created = await createWorkspace({ name: workspaceName });
      setWorkspaceInfo(created);
      setWorkspaceName("");
      setDefaultNoteScope("workspace");
      setMessage(t("workspaceCreated"));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const submitMember = async (event) => {
    event.preventDefault();
    setMemberSaving(true);
    setMessage("");
    setError("");

    try {
      await addWorkspaceMember(memberForm);
      setMemberForm({ name: "", email: "", role: "staff" });
      const nextMembers = await fetchWorkspaceMembers();
      setMembers(nextMembers);
      setMessage(t("workspaceMemberAdded"));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setMemberSaving(false);
    }
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    setInviteSaving(true);
    setInviteLink("");
    setMessage("");
    setError("");

    try {
      const invite = await createWorkspaceInvite(inviteForm);
      setInviteLink(invite.inviteLink);
      setInviteForm({ email: "", role: "staff" });
      setMessage(invite.emailSent ? t("inviteGrowthSuccess") : t("workspaceInviteEmailFailed"));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setInviteSaving(false);
    }
  };

  const copyInviteLink = async () => {
    await window.navigator.clipboard.writeText(inviteLink);
    setMessage(t("inviteLinkCopied"));
  };

  const checkMicrophoneAccess = async () => {
    setMicrophoneStatus({ checking: true, tone: "idle", message: "" });
    const isNativeCapacitor = Boolean(window.Capacitor?.isNativePlatform?.());

    if (!window.isSecureContext && !isNativeCapacitor) {
      setMicrophoneStatus({
        checking: false,
        tone: "error",
        message: t("microphoneRequiresHttps")
      });
      return;
    }

    if (!window.navigator.mediaDevices?.getUserMedia) {
      setMicrophoneStatus({
        checking: false,
        tone: "error",
        message: t("microphoneUnsupported")
      });
      return;
    }

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStatus({
        checking: false,
        tone: "success",
        message: t("microphoneGranted")
      });
    } catch (err) {
      const errorName = err?.name || "";
      let message = t("microphoneBlocked");

      if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        message = t("microphoneNotFound");
      } else if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        message = t("microphonePermissionDenied");
      } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        message = t("microphoneInUse");
      }

      setMicrophoneStatus({
        checking: false,
        tone: "error",
        message
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t("settings")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">{t("userSettings")}</h1>
          </div>
          <Link
            to="/dashboard"
            className="premium-button inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-800"
          >
            {t("backToDashboard")}
          </Link>
        </div>

        <div className="mb-6 grid gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm shadow-slate-950/5 sm:inline-grid sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectSettingsSection("account")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
              activeSection === "account"
                ? "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Settings className="h-4 w-4" />
            {t("userSettings")}
          </button>
          <button
            type="button"
            onClick={() => selectSettingsSection("workspace")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
              activeSection === "workspace"
                ? "bg-emerald-700 text-white shadow-sm shadow-emerald-950/10"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Users className="h-4 w-4" />
            {t("workspace")}
          </button>
        </div>

        {loading ? (
          <div className="premium-panel flex items-center justify-center gap-2 p-8 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <section
              ref={userSettingsRef}
              id="account-settings"
              className={`premium-panel scroll-mt-6 p-5 lg:block ${
                activeSection === "account" ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">{t("userSettings")}</h2>
              </div>
              <form onSubmit={saveSettings} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{t("name")}</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="premium-input mt-2 h-10 w-full px-3 text-sm"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Info label={t("email")} value={user?.email || ""} />
                  <Info label={t("role")} value={user?.role || "user"} />
                  <Info label={t("plan")} value={user?.plan || "free"} />
                  <Info label={t("workspaceRole")} value={workspaceInfo.role || "staff"} />
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{t("language")}</span>
                  <select
                    value={preferredLanguage}
                    onChange={(event) => setPreferredLanguage(event.target.value)}
                    className="premium-input mt-2 h-10 w-full px-3 text-sm"
                  >
                    {languages.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{t("defaultNoteScope")}</span>
                  <select
                    value={hasWorkspace ? defaultNoteScope : "private"}
                    onChange={(event) => setDefaultNoteScope(event.target.value)}
                    disabled={!hasWorkspace}
                    className="premium-input mt-2 h-10 w-full px-3 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="private">{t("privateNote")}</option>
                    <option value="workspace">{t("workspaceNote")}</option>
                  </select>
                  {!hasWorkspace ? (
                    <p className="mt-2 text-xs font-medium text-slate-500">{t("workspaceRequired")}</p>
                  ) : null}
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="premium-button inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("save")}
                </button>
              </form>

              <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-white p-2 text-emerald-700 shadow-sm shadow-slate-950/5">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-950">{t("microphoneAccess")}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{t("microphoneAccessDescription")}</p>
                    <button
                      type="button"
                      onClick={checkMicrophoneAccess}
                      disabled={microphoneStatus.checking}
                      className="premium-button mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-950/5 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {microphoneStatus.checking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : microphoneStatus.tone === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                      {t("checkMicrophone")}
                    </button>
                    {microphoneStatus.message ? (
                      <p
                        className={`mt-3 rounded-md border px-3 py-2 text-sm font-medium ${
                          microphoneStatus.tone === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {microphoneStatus.message}
                      </p>
                    ) : null}
                    <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-500">
                      <li>{t("microphoneHelpIos")}</li>
                      <li>{t("microphoneHelpAndroid")}</li>
                      <li>{t("microphoneHelpBrowser")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section
              ref={workspaceRef}
              id="workspace-settings"
              className={`premium-panel scroll-mt-6 p-5 lg:block ${
                activeSection === "workspace" ? "block" : "hidden"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-slate-950">{t("workspace")}</h2>
              </div>
              {!hasWorkspace ? (
                <form onSubmit={submitWorkspace} className="mt-5 space-y-4">
                  <p className="text-sm leading-6 text-slate-600">{t("createWorkspaceDescription")}</p>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("workspaceName")}</span>
                    <input
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      required
                      className="premium-input mt-2 h-10 w-full px-3 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={workspaceSaving}
                    className="premium-button inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {workspaceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {t("createWorkspace")}
                  </button>
                </form>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">{workspaceInfo.workspace.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {t("workspaceRole")}:{" "}
                      <span className="font-semibold capitalize">{t(workspaceInfo.role)}</span>
                    </p>
                  </div>

                  {canManageMembers ? (
                    <>
                      <form onSubmit={submitInvite} className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50/80 p-4 shadow-inner shadow-emerald-950/[0.03] sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <p className="text-sm font-semibold text-slate-950">{t("inviteMember")}</p>
                          <p className="mt-1 text-sm text-slate-600">{t("inviteMemberDescription")}</p>
                        </div>
                        <input
                          value={inviteForm.email}
                          onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                          required
                          type="email"
                          placeholder={t("email")}
                          className="premium-input h-10 px-3 text-sm"
                        />
                        <select
                          value={inviteForm.role}
                          onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
                          className="premium-input h-10 px-3 text-sm"
                        >
                          <option value="staff">{t("staff")}</option>
                          <option value="manager">{t("manager")}</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviteSaving}
                          className="premium-button inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-800 disabled:opacity-60 sm:col-span-2"
                        >
                          {inviteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          {t("createInvite")}
                        </button>
                        {inviteLink ? (
                          <div className="sm:col-span-2 rounded-md border border-emerald-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {t("inviteLink")}
                            </p>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                              <input
                                value={inviteLink}
                                readOnly
                                className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-700"
                              />
                              <button
                                type="button"
                                onClick={copyInviteLink}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Copy className="h-4 w-4" />
                                {t("copyLink")}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </form>

                      <form onSubmit={submitMember} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <p className="text-sm font-semibold text-slate-950">{t("addMemberManually")}</p>
                        </div>
                        <input
                          value={memberForm.name}
                          onChange={(event) => setMemberForm((current) => ({ ...current, name: event.target.value }))}
                          required
                          placeholder={t("name")}
                        className="premium-input h-10 px-3 text-sm"
                        />
                        <input
                          value={memberForm.email}
                          onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))}
                          required
                          type="email"
                          placeholder={t("email")}
                          className="premium-input h-10 px-3 text-sm"
                        />
                        <select
                          value={memberForm.role}
                          onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}
                          className="premium-input h-10 px-3 text-sm"
                        >
                          <option value="staff">{t("staff")}</option>
                          <option value="manager">{t("manager")}</option>
                        </select>
                        <button
                          type="submit"
                          disabled={memberSaving}
                          className="premium-button inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-800 disabled:opacity-60"
                        >
                          {memberSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          {t("addMember")}
                        </button>
                      </form>

                      <div className="overflow-hidden rounded-md border border-slate-200">
                        <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t("workspaceMembers")}
                        </div>
                        <div className="divide-y divide-slate-200 bg-white">
                          {members.map((member) => (
                            <div key={member.id} className="px-4 py-3 text-sm">
                              <p className="font-semibold text-slate-950">{member.name}</p>
                              <p className="text-slate-600">{member.email}</p>
                              <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                                {t(member.workspaceRole || "staff")}
                              </span>
                            </div>
                          ))}
                          {!members.length ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                              {t("noUsersFound")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        )}

        {message ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold capitalize text-slate-950">{value}</p>
    </div>
  );
}
