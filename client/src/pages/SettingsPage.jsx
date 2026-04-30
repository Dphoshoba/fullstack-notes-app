import { Copy, Loader2, Mail, Plus, Save, Settings, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

  const canManageMembers = ["owner", "manager"].includes(workspaceInfo.role);
  const hasWorkspace = Boolean(workspaceInfo.workspace);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
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
      setMessage(t("workspaceInviteCreated"));
    } catch (err) {
      setError(err.message);
    } finally {
      setInviteSaving(false);
    }
  };

  const copyInviteLink = async () => {
    await window.navigator.clipboard.writeText(inviteLink);
    setMessage(t("inviteLinkCopied"));
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
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t("backToDashboard")}
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("save")}
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={workspaceSaving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
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
                      <form onSubmit={submitInvite} className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-2">
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
                          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        />
                        <select
                          value={inviteForm.role}
                          onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        >
                          <option value="staff">{t("staff")}</option>
                          <option value="manager">{t("manager")}</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviteSaving}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:col-span-2"
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
                          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        />
                        <input
                          value={memberForm.email}
                          onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))}
                          required
                          type="email"
                          placeholder={t("email")}
                          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        />
                        <select
                          value={memberForm.role}
                          onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        >
                          <option value="staff">{t("staff")}</option>
                          <option value="manager">{t("manager")}</option>
                        </select>
                        <button
                          type="submit"
                          disabled={memberSaving}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
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
