import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  FileText,
  Loader2,
  LogOut,
  Pin,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  User,
  Users,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { createNote, deleteNote, fetchNotes, updateNote } from "../api/notes.js";
import { fetchUsers, updateUserRole } from "../api/users.js";
import { Button } from "../components/Button.jsx";
import { NoteForm } from "../components/NoteForm.jsx";
import { NoteList, NoteListSkeleton } from "../components/NoteList.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

const NOTES_LIMIT = 12;
const DEFAULT_CATEGORIES = ["General", "Work", "Personal", "Ideas", "Tasks"];

const noteTimestamp = (note) => new Date(note.updatedAt || note.createdAt || 0).getTime();

const sortVisibleNotes = (notes) =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return noteTimestamp(b) - noteTimestamp(a);
  });

const noteToExport = (note) => ({
  title: note.title || "",
  body: note.body || "",
  tags: note.tags || [],
  category: note.category || "General",
  pinned: Boolean(note.pinned),
  starred: Boolean(note.starred),
  createdDate: note.createdAt || "",
  updatedDate: note.updatedAt || ""
});

const formatExportDate = (value) => (value ? new Date(value).toISOString() : "");

const escapeMarkdown = (value) => String(value || "").replace(/\\/g, "\\\\").replace(/`/g, "\\`");

const notesToMarkdown = (notes) =>
  notes
    .map((note) => {
      const exported = noteToExport(note);

      return [
        `# ${escapeMarkdown(exported.title)}`,
        "",
        `- Category: ${escapeMarkdown(exported.category)}`,
        `- Tags: ${exported.tags.length ? exported.tags.map(escapeMarkdown).join(", ") : "None"}`,
        `- Pinned: ${exported.pinned ? "Yes" : "No"}`,
        `- Starred: ${exported.starred ? "Yes" : "No"}`,
        `- Created: ${formatExportDate(exported.createdDate)}`,
        `- Updated: ${formatExportDate(exported.updatedDate)}`,
        "",
        escapeMarkdown(exported.body)
      ].join("\n");
    })
    .join("\n\n---\n\n");

const downloadTextFile = ({ contents, filename, type }) => {
  const blob = new window.Blob([contents], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const { language, languages, setLanguage, t } = useI18n();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeleteNote, setPendingDeleteNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [favoritesFilter, setFavoritesFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: NOTES_LIMIT,
    total: 0,
    pages: 0
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [updatingRoleId, setUpdatingRoleId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const isSearching = Boolean(searchTerm.trim());
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canEditRoles = user?.role === "superadmin";
  const pinnedNotesCount = notes.filter((note) => note.pinned).length;
  const totalPages = Math.max(pagination.pages, 1);
  const categoryOptions = Array.from(
    new Set([...DEFAULT_CATEGORIES, categoryFilter, ...notes.map((note) => note.category || "General")])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, message }]);
  };

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadNotes = useCallback(
    async ({
      nextPage = page,
      nextSearch = searchTerm,
      nextCategory = categoryFilter,
      nextStarred = favoritesFilter
    } = {}) => {
    setError("");
    setLoading(true);

    try {
      const result = await fetchNotes({
        page: nextPage,
        limit: NOTES_LIMIT,
        search: nextSearch,
        category: nextCategory,
        starred: nextStarred
      });
      setNotes(result.notes);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
      addToast("error", t("notesLoadError", { message: err.message }));
    } finally {
      setLoading(false);
    }
    },
    [categoryFilter, favoritesFilter, page, searchTerm, t]
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreate = async (input) => {
    const note = await createNote(input);
    setPage(1);
    await loadNotes({ nextPage: 1 });
    return note;
  };

  const requestDelete = (id) => {
    const note = notes.find((item) => item.id === id);
    setPendingDeleteNote(note || { id, title: t("thisNote") });
  };

  const cancelDelete = () => {
    if (!deletingId) {
      setPendingDeleteNote(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteNote) {
      return;
    }

    const { id, title } = pendingDeleteNote;
    setDeletingId(id);

    try {
      await deleteNote(id);
      const nextPage = notes.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadNotes({ nextPage });
      addToast("success", t("noteDeleted", { title }));
    } catch (err) {
      setError(err.message);
      addToast("error", t("deleteNoteError", { message: err.message }));
    } finally {
      setDeletingId("");
      setPendingDeleteNote(null);
    }
  };

  const handleUpdate = async (id, input) => {
    const updatedNote = await updateNote(id, input);
    setNotes((current) => current.map((note) => (note.id === id ? updatedNote : note)));
    await loadNotes();
    return updatedNote;
  };

  const exportNotes = (format) => {
    const visibleNotes = sortVisibleNotes(notes);

    if (!visibleNotes.length) {
      addToast("error", t("exportNoNotes"));
      setExportOpen(false);
      return;
    }

    const exportedAt = new Date().toISOString().slice(0, 10);

    if (format === "json") {
      downloadTextFile({
        contents: JSON.stringify(visibleNotes.map(noteToExport), null, 2),
        filename: `notes-${exportedAt}.json`,
        type: "application/json"
      });
      addToast("success", t("exportSuccess", { format: "JSON" }));
    } else {
      downloadTextFile({
        contents: notesToMarkdown(visibleNotes),
        filename: `notes-${exportedAt}.md`,
        type: "text/markdown"
      });
      addToast("success", t("exportSuccess", { format: "Markdown" }));
    }

    setExportOpen(false);
  };

  const openProfile = () => {
    setProfileName(user?.name || "");
    setProfileEditing(false);
    setProfileError("");
    setProfileSuccess("");
    setProfileOpen(true);
  };

  const startProfileEdit = () => {
    setProfileName(user?.name || "");
    setProfileError("");
    setProfileSuccess("");
    setProfileEditing(true);
  };

  const cancelProfileEdit = () => {
    setProfileName(user?.name || "");
    setProfileError("");
    setProfileEditing(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);

    try {
      const updatedUser = await updateProfile({ name: profileName });
      setProfileName(updatedUser.name);
      setProfileEditing(false);
      setProfileSuccess(t("profileUpdated"));
      addToast("success", t("profileUpdated"));
    } catch (err) {
      setProfileError(err.message);
      addToast("error", t("profileUpdateError", { message: err.message }));
    } finally {
      setProfileSaving(false);
    }
  };

  const loadAdminUsers = useCallback(async () => {
    setAdminError("");
    setAdminLoading(true);

    try {
      const users = await fetchUsers();
      setAdminUsers(users);
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const handleRoleChange = async (targetUser, role) => {
    if (!canEditRoles || targetUser.id === user?.id || role === targetUser.role) {
      return;
    }

    setAdminError("");
    setAdminSuccess("");
    setUpdatingRoleId(targetUser.id);

    try {
      await updateUserRole(targetUser.id, role);
      setAdminSuccess(t("roleUpdatedTo", { name: targetUser.name, role }));
      addToast("success", t("roleUpdated", { name: targetUser.name }));
      await loadAdminUsers();
    } catch (err) {
      setAdminError(err.message);
      addToast("error", t("roleUpdateError", { message: err.message }));
    } finally {
      setUpdatingRoleId("");
    }
  };

  useEffect(() => {
    if (adminOpen && isAdmin) {
      loadAdminUsers();
    }
  }, [adminOpen, isAdmin, loadAdminUsers]);

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Notes API</p>
            <h1 className="text-2xl font-bold text-slate-950">{t("dashboard")}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <span className="sr-only">{t("language")}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                aria-label={t("language")}
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {user?.email}
            </span>
            <Button
              onClick={loadNotes}
              className="h-10 bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              {t("refresh")}
            </Button>
            <div className="relative">
              <Button
                onClick={() => setExportOpen((current) => !current)}
                disabled={loading}
                className="h-10 bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                aria-expanded={exportOpen}
                aria-haspopup="menu"
              >
                <Download className="h-4 w-4" />
                {t("exportNotes")}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {exportOpen ? (
                <div
                  className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft"
                  role="menu"
                  aria-label={t("exportVisibleNotes")}
                >
                  <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("exportVisibleNotes")}
                  </p>
                  <button
                    type="button"
                    onClick={() => exportNotes("markdown")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    role="menuitem"
                  >
                    <FileText className="h-4 w-4 text-emerald-700" />
                    {t("exportMarkdown")}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportNotes("json")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Download className="h-4 w-4 text-emerald-700" />
                    {t("exportJson")}
                  </button>
                </div>
              ) : null}
            </div>
            <Button
              onClick={openProfile}
              className="h-10 bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              <User className="h-4 w-4" />
              {t("profile")}
            </Button>
            {isAdmin ? (
              <Button
                onClick={() => setAdminOpen(true)}
                className="h-10 bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                <Shield className="h-4 w-4" />
                {t("admin")}
              </Button>
            ) : null}
            <Button onClick={logout} className="h-10 bg-slate-950">
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{t("totalNotes")}</p>
              <FileText className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-950">{pagination.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{t("pinnedNotes")}</p>
              <Pin className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-950">{pinnedNotesCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{t("userRole")}</p>
              <Shield className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-3 text-2xl font-bold capitalize text-slate-950">
              {user?.role || "user"}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">{t("createNote")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("notes")}</p>
          <div className="mt-5">
            <NoteForm
              onCreate={handleCreate}
              onCreateSuccess={(note) =>
                addToast("success", t("createdNote", { title: note.title }))
              }
              onCreateError={(err) => addToast("error", t("createNoteError", { message: err.message }))}
            />
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{t("notes")}</h2>
              <p className="text-sm text-slate-500">
                {t("shownCount", { shown: notes.length, total: pagination.total })}
              </p>
            </div>
            <label className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                placeholder={t("searchNotes")}
                aria-label={t("searchNotes")}
              />
            </label>
            <label className="w-full sm:max-w-xs">
              <span className="sr-only">{t("categoryFilter")}</span>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                aria-label={t("categoryFilter")}
              >
                <option value="">{t("allCategories")}</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-full sm:max-w-xs">
              <span className="sr-only">{t("favoritesFilter")}</span>
              <select
                value={favoritesFilter}
                onChange={(event) => {
                  setFavoritesFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                aria-label={t("favoritesFilter")}
              >
                <option value="">{t("showAllNotes")}</option>
                <option value="true">{t("showFavoritesOnly")}</option>
              </select>
            </label>
          </div>

          {error ? (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {loading ? (
            <div role="status" aria-label={t("loadingNotes")}>
              <NoteListSkeleton />
              <span className="sr-only">{t("loadingNotes")}</span>
            </div>
          ) : (
            <NoteList
              notes={notes}
              onDelete={requestDelete}
              onUpdate={handleUpdate}
              deletingId={deletingId}
              emptyTitle={
                isSearching || categoryFilter || favoritesFilter
                  ? t("emptyFilteredTitle")
                  : t("emptyNotesTitle")
              }
              emptyDescription={
                isSearching || categoryFilter || favoritesFilter
                  ? t("emptyFilteredDescription")
                  : t("emptyNotesDescription")
              }
              emptyVariant={isSearching || categoryFilter || favoritesFilter ? "search" : "notes"}
              onUpdateSuccess={(note) => addToast("success", t("updated", { title: note.title }))}
              onUpdateError={(err) => addToast("error", t("updateNoteError", { message: err.message }))}
            />
          )}
          {!loading && pagination.total > 0 ? (
            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-600">
                {t("pageStatus", { page: pagination.page, pages: totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={pagination.page <= 1}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("previous")}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={pagination.page >= totalPages}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {toasts.length ? (
        <div className="fixed right-4 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm space-y-3">
          {toasts.map((toast) => {
            const ToastIcon = toast.type === "success" ? CheckCircle2 : AlertCircle;

            return (
              <div
                key={toast.id}
                className={`flex items-start gap-3 rounded-lg border bg-white p-4 shadow-soft ${
                  toast.type === "success" ? "border-emerald-200" : "border-red-200"
                }`}
              >
                <ToastIcon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    toast.type === "success" ? "text-emerald-700" : "text-red-600"
                  }`}
                />
                <p className="flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={t("dismiss")}
                  title={t("dismiss")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {profileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <section
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">{t("account")}</p>
                <h2 id="profile-title" className="mt-1 text-xl font-bold text-slate-950">
                  {t("profile")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={t("closeProfile")}
                title={t("closeProfile")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("name")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {user?.name || t("unknown")}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("email")}
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-950">
                  {user?.email || t("unknown")}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("role")}
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-950">
                  {user?.role || "user"}
                </p>
              </div>
            </div>

            {profileError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {profileError}
              </p>
            ) : null}

            {profileSuccess ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {profileSuccess}
              </p>
            ) : null}

            {profileEditing ? (
              <form onSubmit={saveProfile} className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{t("name")}</span>
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    required
                    minLength="2"
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {profileSaving ? t("saving") : t("save")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    disabled={profileSaving}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    {t("cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={startProfileEdit}
                className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Edit3 className="h-4 w-4" />
                {t("editProfile")}
              </button>
            )}
          </section>
        </div>
      ) : null}

      {pendingDeleteNote ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <section
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-note-title" className="text-lg font-bold text-slate-950">
                  {t("confirmDeleteTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("confirmDeleteDescription", { title: pendingDeleteNote.title })}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletingId ? t("deleting") : t("deleteNote")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {adminOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <section
            className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700">{t("admin")}</p>
                <h2 id="admin-title" className="mt-1 text-xl font-bold text-slate-950">
                  {t("adminPanel")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAdminOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={t("closeAdminPanel")}
                title={t("closeAdminPanel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-sm font-semibold text-slate-950">{user?.name || t("unknown")}</p>
              <p className="mt-1 break-all text-sm text-slate-600">
                {user?.email || t("unknown")}
              </p>
              <span className="mt-3 inline-flex rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold capitalize text-white">
                {user?.role || "user"}
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-semibold text-slate-950">{t("users")}</h3>
                </div>
                <button
                  type="button"
                  onClick={loadAdminUsers}
                  disabled={adminLoading}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${adminLoading ? "animate-spin" : ""}`} />
                  {t("refresh")}
                </button>
              </div>

              {!canEditRoles ? (
                <p className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {t("adminViewOnly")}
                </p>
              ) : null}

              {adminLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loadingUsers")}
                </div>
              ) : null}

              {adminError ? (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{adminError}</p>
                </div>
              ) : null}

              {adminSuccess ? (
                <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">{adminSuccess}</p>
                </div>
              ) : null}

              {!adminLoading && !adminError ? (
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="hidden grid-cols-[1fr_1.35fr_170px_120px] gap-3 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
                    <span>{t("name")}</span>
                    <span>{t("email")}</span>
                    <span>{t("role")}</span>
                    <span>{t("created")}</span>
                  </div>
                  <div className="divide-y divide-slate-200 bg-white">
                    {adminUsers.map((adminUser) => (
                      <div
                        key={adminUser.id}
                        className="grid gap-2 px-4 py-3 text-sm text-slate-700 sm:grid-cols-[1fr_1.35fr_170px_120px] sm:items-center sm:gap-3"
                      >
                        <div>
                          <p className="font-medium text-slate-950">{adminUser.name}</p>
                          <p className="text-xs text-slate-500 sm:hidden">{adminUser.email}</p>
                        </div>
                        <p className="hidden break-all text-slate-600 sm:block">{adminUser.email}</p>
                        {canEditRoles ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={adminUser.role}
                              onChange={(event) => handleRoleChange(adminUser, event.target.value)}
                              disabled={adminUser.id === user?.id || updatingRoleId === adminUser.id}
                              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm capitalize text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                              aria-label={`${t("role")}: ${adminUser.name}`}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="superadmin">superadmin</option>
                            </select>
                            {updatingRoleId === adminUser.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                            ) : null}
                            {adminUser.id === user?.id ? (
                              <span className="text-xs text-slate-500">{t("you")}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                            {adminUser.role}
                          </span>
                        )}
                        <p className="text-xs text-slate-500 sm:text-sm">
                          {new Date(adminUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {!adminUsers.length ? (
                    <div className="bg-white px-4 py-10 text-center text-sm text-slate-500">
                      {t("noUsersFound")}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
