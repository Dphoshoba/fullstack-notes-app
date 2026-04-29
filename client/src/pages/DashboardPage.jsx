import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  Edit3,
  FileText,
  Folder,
  HelpCircle,
  Loader2,
  LogOut,
  MessageSquare,
  Pin,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { generateSmartInsights, suggestTags, summarizeNote } from "../api/ai.js";
import { createCheckoutSession, createPortalSession, fetchBillingStatus } from "../api/billing.js";
import { createComment, createNote, deleteNote, fetchNotes, updateNote } from "../api/notes.js";
import { fetchUsage, fetchUsers, updateUserRole } from "../api/users.js";
import { fetchMyWorkspace } from "../api/workspaces.js";
import { Button } from "../components/Button.jsx";
import { NoteForm } from "../components/NoteForm.jsx";
import { NoteList, NoteListSkeleton } from "../components/NoteList.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

const NOTES_LIMIT = 12;
const DEFAULT_CATEGORIES = ["General", "Work", "Personal", "Ideas", "Tasks"];
const GUIDE_ONBOARDING_KEY = "notes_api_guide_onboarding_seen";
const DETAIL_ERROR_MESSAGES = new Set([
  "Comments could not be loaded",
  "Attachments could not be loaded",
  "Attachment could not be uploaded",
  "Comment could not be saved"
]);

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

const noteOwnerId = (note) => note?.owner?.id || note?.owner?._id || note?.owner;

const aiResultToText = (result) => {
  if (!result) {
    return "";
  }

  if (result.summary) {
    return result.summary;
  }

  if (result.suggestedTags) {
    return result.suggestedTags.length
      ? `AI Suggested Tags:\n${result.suggestedTags.map((tag) => `- ${tag}`).join("\n")}`
      : "AI Suggested Tags:\nNo new tag suggestions yet.";
  }

  if (result.insights) {
    return [
      "AI Insights:",
      `Total notes: ${result.insights.totalNotes}`,
      `Most used category: ${result.insights.topCategory}`,
      `Pinned notes: ${result.insights.pinnedCount}`,
      `Starred notes: ${result.insights.starredCount}`,
      result.insights.suggestedFocus
    ].filter(Boolean).join("\n");
  }

  return "";
};

const roleBadgeClassName = (role) => {
  if (role === "superadmin") {
    return "bg-purple-50 text-purple-700 ring-purple-200";
  }

  if (role === "admin") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
};

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

const formatDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

export default function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const { language, languages, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeleteNote, setPendingDeleteNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [favoritesFilter, setFavoritesFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [pinnedFilter, setPinnedFilter] = useState("");
  const [thisWeekFilter, setThisWeekFilter] = useState("");
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
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [updatingRoleId, setUpdatingRoleId] = useState("");
  const [selectedAiNoteId, setSelectedAiNoteId] = useState("");
  const [aiLoadingAction, setAiLoadingAction] = useState("");
  const [aiSavingAction, setAiSavingAction] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [usage, setUsage] = useState({
    plan: "free",
    aiUsageCount: 0,
    aiUsageLimit: 5,
    remainingAiUses: 5
  });
  const [usageLoading, setUsageLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showGuideOnboarding, setShowGuideOnboarding] = useState(
    () => localStorage.getItem(GUIDE_ONBOARDING_KEY) !== "true"
  );
  const [toasts, setToasts] = useState([]);
  const [workspaceInfo, setWorkspaceInfo] = useState({ workspace: null, role: "staff" });

  const isSearching = Boolean(searchTerm.trim());
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canEditRoles = user?.role === "superadmin";
  const hasWorkspace = Boolean(workspaceInfo.workspace);
  const loadedNotesCount = notes.length;
  const pinnedNotesCount = notes.filter((note) => note.pinned).length;
  const starredNotesCount = notes.filter((note) => note.starred).length;
  const loadedCategories = notes.map((note) => note.category || "General");
  const categoriesCount = new Set(loadedCategories).size;
  const pinnedProgress = loadedNotesCount ? Math.round((pinnedNotesCount / loadedNotesCount) * 100) : 0;
  const starredProgress = loadedNotesCount ? Math.round((starredNotesCount / loadedNotesCount) * 100) : 0;
  const totalPages = Math.max(pagination.pages, 1);
  const categoryOptions = Array.from(
    new Set([...DEFAULT_CATEGORIES, categoryFilter, ...notes.map((note) => note.category || "General")])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const categoryCounts = loadedCategories.reduce((counts, category) => {
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const [mostUsedCategory = "", mostUsedCategoryCount = 0] =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || [];
  const latestCreatedNote = [...notes].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )[0];
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const notesCreatedThisWeek = notes.filter(
    (note) => note.createdAt && new Date(note.createdAt).getTime() >= weekStart.getTime()
  ).length;
  const weekProgress = loadedNotesCount
    ? Math.round((notesCreatedThisWeek / loadedNotesCount) * 100)
    : 0;
  const statCards = [
    {
      label: t("totalNotes"),
      value: loadedNotesCount,
      icon: FileText,
      tone: "emerald",
      detail: t("currentLoadedNotes")
    },
    {
      label: t("pinnedNotes"),
      value: pinnedNotesCount,
      icon: Pin,
      tone: "emerald",
      progress: pinnedProgress,
      detail: pinnedNotesCount
        ? t("ofLoadedNotes", { percent: pinnedProgress })
        : t("emptyPinnedNotesDescription")
    },
    {
      label: t("starredNotes"),
      value: starredNotesCount,
      icon: Star,
      tone: "amber",
      progress: starredProgress,
      detail: starredNotesCount
        ? t("ofLoadedNotes", { percent: starredProgress })
        : t("emptyStarredNotesDescription")
    },
    {
      label: t("categoriesCount"),
      value: categoriesCount,
      icon: Folder,
      tone: "slate",
      detail: t("currentLoadedNotes")
    },
    {
      label: t("userRole"),
      value: user?.role || "user",
      icon: Shield,
      tone: "slate",
      detail: t("account")
    }
  ];
  const selectedAiNote = notes.find((note) => note.id === selectedAiNoteId) || notes[0];
  const selectedAiResultText = aiResultToText(aiResult);
  const selectedAiNoteOwnerId = noteOwnerId(selectedAiNote);
  const canSaveAiToNote = Boolean(
    aiResult &&
      selectedAiNote &&
      selectedAiResultText &&
      selectedAiNoteOwnerId &&
      selectedAiNoteOwnerId.toString() === user?.id
  );
  const canSaveAiAsComment = Boolean(aiResult && selectedAiNote && selectedAiResultText);
  const usageLimitReached =
    usage.plan === "free" && usage.remainingAiUses <= 0;
  const usageProgress = usage.aiUsageLimit
    ? Math.min(Math.round((usage.aiUsageCount / usage.aiUsageLimit) * 100), 100)
    : 0;
  const usagePlanLabel = usage.plan === "premium" ? t("premiumPlan") : t("freePlan");
  const remainingAiUses = Math.max(usage.remainingAiUses ?? usage.aiUsageLimit - usage.aiUsageCount, 0);
  const notesEmptyState = (() => {
    if (isSearching) {
      return {
        title: t("emptySearchTitle"),
        description: t("emptySearchDescription"),
        variant: "search"
      };
    }

    if (favoritesFilter === "true") {
      return {
        title: t("emptyStarredNotesTitle"),
        description: t("emptyStarredNotesDescription"),
        variant: "search"
      };
    }

    if (pinnedFilter === "true") {
      return {
        title: t("emptyPinnedNotesTitle"),
        description: t("emptyPinnedNotesDescription"),
        variant: "search"
      };
    }

    if (scopeFilter === "workspace") {
      return {
        title: t("emptyWorkspaceNotesTitle"),
        description: t("emptyWorkspaceNotesDescription"),
        variant: "notes"
      };
    }

    if (categoryFilter || scopeFilter !== "all" || thisWeekFilter === "true") {
      return {
        title: t("emptyFilteredTitle"),
        description: t("emptyFilteredDescription"),
        variant: "search"
      };
    }

    return {
      title: t("emptyNotesTitle"),
      description: t("emptyNotesDescription"),
      variant: "notes"
    };
  })();
  const filteredAdminUsers = adminUsers.filter((adminUser) => {
    const query = adminSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [adminUser.name, adminUser.email, adminUser.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, message }]);
  };

  const rememberGuideOnboarding = () => {
    localStorage.setItem(GUIDE_ONBOARDING_KEY, "true");
    setShowGuideOnboarding(false);
  };

  const openGuideFromOnboarding = () => {
    rememberGuideOnboarding();
    navigate("/guide");
  };

  const togglePinnedFilter = () => {
    setPinnedFilter((current) => (current === "true" ? "" : "true"));
    setPage(1);
  };

  const toggleThisWeekFilter = () => {
    setThisWeekFilter((current) => (current === "true" ? "" : "true"));
    setPage(1);
  };

  const toggleStarredFilter = () => {
    setFavoritesFilter((current) => (current === "true" ? "" : "true"));
    setPage(1);
  };

  const toggleScopeChip = (scope) => {
    setScopeFilter((current) => (current === scope ? "all" : scope));
    setPage(1);
  };

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadNotes = useCallback(
    async ({
      nextPage = page,
      nextSearch = searchTerm,
      nextCategory = categoryFilter,
      nextStarred = favoritesFilter,
      nextScope = scopeFilter,
      nextPinned = pinnedFilter,
      nextThisWeek = thisWeekFilter
    } = {}) => {
    setError("");
    setLoading(true);

    try {
      const result = await fetchNotes({
        page: nextPage,
        limit: NOTES_LIMIT,
        search: nextSearch,
        category: nextCategory,
        starred: nextStarred,
        scope: nextScope,
        pinned: nextPinned,
        thisWeek: nextThisWeek
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
    [categoryFilter, favoritesFilter, page, pinnedFilter, scopeFilter, searchTerm, t, thisWeekFilter]
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const loadWorkspace = useCallback(async () => {
    try {
      const info = await fetchMyWorkspace();
      setWorkspaceInfo(info);
    } catch {
      setWorkspaceInfo({ workspace: null, role: "staff" });
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);

    try {
      const nextUsage = await fetchUsage();
      setUsage(nextUsage);
    } catch (err) {
      addToast("error", t("usageLoadError", { message: err.message }));
    } finally {
      setUsageLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  useEffect(() => {
    const billingState = new URLSearchParams(window.location.search).get("billing");

    if (!billingState) {
      return;
    }

    const refreshBilling = async () => {
      try {
        const [status] = await Promise.all([fetchBillingStatus(), loadUsage()]);
        setUsage((current) => ({ ...current, plan: status.plan }));
        addToast(
          billingState === "success" ? "success" : "error",
          billingState === "success" ? t("billingReturnSuccess") : t("billingReturnCancelled")
        );
      } catch (err) {
        addToast("error", t("billingStatusError", { message: err.message }));
      } finally {
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    refreshBilling();
  }, [loadUsage, t]);

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

  const runAiAction = async (action, noteOverride = null) => {
    if (usageLimitReached) {
      setAiError(t("upgradeToContinue"));
      addToast("error", t("upgradeToContinue"));
      return;
    }

    const targetNote = noteOverride || selectedAiNote;
    const loadingKey = noteOverride ? `${action}:${noteOverride.id}` : action;

    setAiError("");
    setAiLoadingAction(loadingKey);

    try {
      if ((action === "summary" || action === "tags") && !targetNote) {
        throw new Error(t("aiSelectNoteRequired"));
      }

      const result =
        action === "summary"
          ? await summarizeNote(targetNote.id)
          : action === "tags"
            ? await suggestTags(targetNote.id)
            : await generateSmartInsights();

      if (targetNote?.id) {
        setSelectedAiNoteId(targetNote.id);
      }
      setAiResult(result);
      await loadUsage();
      addToast("success", t("aiResultReady"));
    } catch (err) {
      setAiError(err.message);
      addToast("error", t("aiRequestError", { message: err.message }));
    } finally {
      setAiLoadingAction("");
    }
  };

  const saveAiResultToNote = async () => {
    if (!canSaveAiToNote) {
      return;
    }

    setAiSavingAction("note");
    setAiError("");

    try {
      const appendedBody = [
        selectedAiNote.body,
        "---",
        "AI Summary:",
        selectedAiResultText
      ].filter(Boolean).join("\n\n");

      await handleUpdate(selectedAiNote.id, { body: appendedBody });
      addToast("success", t("savedToNote"));
    } catch {
      setAiError(t("couldNotSave"));
      addToast("error", t("couldNotSave"));
    } finally {
      setAiSavingAction("");
    }
  };

  const saveAiResultAsComment = async () => {
    if (!canSaveAiAsComment) {
      return;
    }

    setAiSavingAction("comment");
    setAiError("");

    try {
      await createComment(selectedAiNote.id, { text: selectedAiResultText });
      setNotes((current) =>
        current.map((note) =>
          note.id === selectedAiNote.id
            ? { ...note, commentsCount: (note.commentsCount || 0) + 1 }
            : note
        )
      );
      addToast("success", t("savedAsComment"));
    } catch {
      setAiError(t("couldNotSave"));
      addToast("error", t("couldNotSave"));
    } finally {
      setAiSavingAction("");
    }
  };

  const startUpgrade = async () => {
    setUpgradeLoading(true);

    try {
      const session = await createCheckoutSession();
      window.location.href = session.checkoutUrl;
    } catch (err) {
      addToast("error", t("checkoutError", { message: err.message }));
      setUpgradeLoading(false);
    }
  };

  const manageBilling = async () => {
    setPortalLoading(true);

    try {
      const session = await createPortalSession();
      window.location.href = session.portalUrl;
    } catch (err) {
      addToast("error", t("billingPortalError", { message: err.message }));
      setPortalLoading(false);
    }
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
      setAdminSuccess(t("roleUpdateSuccess"));
      addToast("success", t("roleUpdateSuccess"));
      await loadAdminUsers();
    } catch {
      setAdminError(t("roleUpdateFailed"));
      addToast("error", t("roleUpdateFailed"));
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
            <label className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
              <span className="sr-only">{t("language")}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="bg-white text-sm font-medium text-slate-700 outline-none"
                aria-label={t("language")}
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {user?.email}
            </span>
            <Button
              onClick={loadNotes}
              className="h-10 bg-white !text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:!text-slate-950 [&_svg]:!text-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              {t("refresh")}
            </Button>
            <div className="relative">
              <Button
                onClick={() => setExportOpen((current) => !current)}
                disabled={loading}
                className="h-10 bg-white !text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:!text-slate-950 [&_svg]:!text-slate-700"
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
              className="h-10 bg-white !text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:!text-slate-950 [&_svg]:!text-slate-700"
            >
              <User className="h-4 w-4" />
              {t("profile")}
            </Button>
            <Link
              to="/guide"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <HelpCircle className="h-4 w-4 text-slate-700" />
              {t("guide")}
            </Link>
            <Link
              to="/settings"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <Settings className="h-4 w-4 text-slate-700" />
              {t("settings")}
            </Link>
            {isAdmin ? (
              <Button
                onClick={() => setAdminOpen(true)}
                className="h-10 bg-white !text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:!text-slate-950 [&_svg]:!text-slate-700"
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

      {showGuideOnboarding ? (
        <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {t("welcomeGuidePrompt")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("welcomeGuideDescription")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={openGuideFromOnboarding}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  {t("viewGuide")}
                </button>
                <button
                  type="button"
                  onClick={rememberGuideOnboarding}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("skip")}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((stat) => {
            const StatIcon = stat.icon;
            const iconClass =
              stat.tone === "amber"
                ? "bg-amber-50 text-amber-700"
                : stat.tone === "emerald"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700";
            const barClass = stat.tone === "amber" ? "bg-amber-500" : "bg-emerald-600";

            return (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${iconClass}`}>
                    <StatIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 truncate text-2xl font-bold capitalize text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">{stat.detail}</p>
                {typeof stat.progress === "number" ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${barClass}`}
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">{t("productInsights")}</h2>
              <p className="text-xs font-medium text-slate-500">{t("currentLoadedNotes")}</p>
            </div>
            <BarChart3 className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("mostUsedCategory")}
                </p>
                <Folder className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                {mostUsedCategory || t("noInsightYet")}
              </p>
              {mostUsedCategory ? (
                <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  {t("notesCount", { count: mostUsedCategoryCount })}
                </span>
              ) : null}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("latestNoteCreated")}
                </p>
                <CalendarDays className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                {latestCreatedNote?.title || t("noInsightYet")}
              </p>
              {latestCreatedNote?.createdAt ? (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {formatDisplayDate(latestCreatedNote.createdAt)}
                </p>
              ) : null}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("notesCreatedThisWeek")}
                </p>
                <TrendingUp className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {t("notesCount", { count: notesCreatedThisWeek })}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${weekProgress}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">{t("createNote")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("notes")}</p>
          <div className="mt-5">
            <NoteForm
              key={`${hasWorkspace}-${user?.defaultNoteScope || "private"}`}
              onCreate={handleCreate}
              hasWorkspace={hasWorkspace}
              defaultVisibility={
                hasWorkspace && user?.defaultNoteScope === "workspace" ? "workspace" : "private"
              }
              onCreateSuccess={(note) =>
                addToast("success", t("createdNote", { title: note.title }))
              }
              onCreateError={(err) => addToast("error", t("createNoteError", { message: err.message }))}
            />
          </div>
        </aside>

        <section>
          <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-950">{t("aiTools")}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{t("aiToolsDescription")}</p>
              </div>
              <label className="w-full lg:max-w-sm">
                <span className="text-sm font-medium text-slate-700">{t("selectNoteForAi")}</span>
                <select
                  value={selectedAiNote?.id || ""}
                  onChange={(event) => setSelectedAiNoteId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  disabled={!notes.length}
                >
                  {notes.length ? null : <option value="">{t("noInsightYet")}</option>}
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{t("planAndUsage")}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("currentPlan")}:{" "}
                    <span className="font-semibold capitalize text-slate-950">
                      {usagePlanLabel}
                    </span>
                    {usage.plan === "premium" ? (
                      <span className="ml-2 inline-flex rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">
                        {t("premiumBadge")}
                      </span>
                    ) : null}
                  </p>
                </div>
                {usage.plan === "premium" ? (
                  <button
                    type="button"
                    onClick={manageBilling}
                    disabled={portalLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {t("manageBilling")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startUpgrade}
                    disabled={upgradeLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {upgradeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t("upgrade")}
                  </button>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    {t("aiUsage")}
                    <span className="group relative inline-flex">
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                        aria-label={t("aiUsageHelp")}
                        title={t("aiUsageTooltip")}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-600 shadow-soft group-hover:block group-focus-within:block"
                      >
                        {t("aiUsageTooltip")}
                      </span>
                    </span>
                  </span>
                  <span>
                    {usageLoading
                      ? t("loading")
                      : t("aiUsesRemaining", {
                          remaining: remainingAiUses,
                          limit: usage.aiUsageLimit
                        })}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${
                      usageLimitReached ? "bg-red-600" : "bg-emerald-600"
                    }`}
                    style={{ width: `${usageProgress}%` }}
                  />
                </div>
                {usageLimitReached ? (
                  <p className="mt-2 text-sm font-medium text-red-700">
                    {t("upgradeToContinue")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => runAiAction("summary")}
                disabled={Boolean(aiLoadingAction) || !notes.length || usageLimitReached}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoadingAction === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {t("summarizeSelectedNote")}
              </button>
              <button
                type="button"
                onClick={() => runAiAction("tags")}
                disabled={Boolean(aiLoadingAction) || !notes.length || usageLimitReached}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoadingAction === "tags" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                {t("suggestTags")}
              </button>
              <button
                type="button"
                onClick={() => runAiAction("insights")}
                disabled={Boolean(aiLoadingAction) || usageLimitReached}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoadingAction === "insights" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                {t("generateSmartInsights")}
              </button>
            </div>
            {aiError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {aiError}
              </p>
            ) : null}
            {aiResult ? (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">{t("aiResult")}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-800">
                      {t("aiPlaceholderNotice")}
                    </p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    {aiResult.provider}
                  </span>
                </div>
                {aiResult.summary ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {aiResult.summary}
                  </p>
                ) : null}
                {aiResult.suggestedTags ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiResult.suggestedTags.length ? (
                      aiResult.suggestedTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600">{t("noSuggestedTags")}</p>
                    )}
                  </div>
                ) : null}
                {aiResult.insights ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                      {t("totalNotes")}: <strong>{aiResult.insights.totalNotes}</strong>
                    </p>
                    <p className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                      {t("mostUsedCategory")}: <strong>{aiResult.insights.topCategory}</strong>
                    </p>
                    <p className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                      {t("pinnedNotes")}: <strong>{aiResult.insights.pinnedCount}</strong>
                    </p>
                    <p className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                      {t("starredNotes")}: <strong>{aiResult.insights.starredCount}</strong>
                    </p>
                    <p className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 sm:col-span-2">
                      {aiResult.insights.suggestedFocus}
                    </p>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col gap-2 border-t border-emerald-200 pt-4 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={saveAiResultToNote}
                    disabled={!canSaveAiToNote || Boolean(aiSavingAction)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {aiSavingAction === "note" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t("saveToNote")}
                  </button>
                  <button
                    type="button"
                    onClick={saveAiResultAsComment}
                    disabled={!canSaveAiAsComment || Boolean(aiSavingAction)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {aiSavingAction === "comment" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    {t("saveAsComment")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
                {t("emptyAiInsightsDescription")}
              </div>
            )}
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-700">{t("quickFilters")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={togglePinnedFilter}
                  className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                    pinnedFilter === "true"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={pinnedFilter === "true"}
                >
                  <Pin className="h-3.5 w-3.5" />
                  {t("pinned")}
                </button>
                <button
                  type="button"
                  onClick={toggleStarredFilter}
                  className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                    favoritesFilter === "true"
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={favoritesFilter === "true"}
                >
                  <Star className="h-3.5 w-3.5" />
                  {t("starred")}
                </button>
                <button
                  type="button"
                  onClick={() => toggleScopeChip("workspace")}
                  className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                    scopeFilter === "workspace"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={scopeFilter === "workspace"}
                >
                  <Users className="h-3.5 w-3.5" />
                  {t("workspace")}
                </button>
                <button
                  type="button"
                  onClick={() => toggleScopeChip("private")}
                  className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                    scopeFilter === "private"
                      ? "border-slate-400 bg-slate-100 text-slate-900"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={scopeFilter === "private"}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {t("privateNote")}
                </button>
                <button
                  type="button"
                  onClick={toggleThisWeekFilter}
                  className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                    thisWeekFilter === "true"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={thisWeekFilter === "true"}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t("thisWeek")}
                </button>
              </div>
            </div>
          </div>

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
              <span className="sr-only">{t("scopeFilter")}</span>
              <select
                value={scopeFilter}
                onChange={(event) => {
                  setScopeFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                aria-label={t("scopeFilter")}
              >
                <option value="all">{t("allNotes")}</option>
                <option value="private">{t("myPrivateNotes")}</option>
                <option value="workspace">{t("workspaceNotes")}</option>
              </select>
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
              emptyTitle={notesEmptyState.title}
              emptyDescription={notesEmptyState.description}
              emptyVariant={notesEmptyState.variant}
              hasWorkspace={hasWorkspace}
              onRunAiAction={runAiAction}
              aiLoadingAction={aiLoadingAction}
              usageLimitReached={usageLimitReached}
              onUpdateSuccess={(note) => addToast("success", t("updated", { title: note.title }))}
              onUpdateError={(err) =>
                addToast(
                  "error",
                  DETAIL_ERROR_MESSAGES.has(err.message)
                    ? err.message
                    : t("updateNoteError", { message: err.message })
                )
              }
              currentUser={user}
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

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${roleBadgeClassName("user")}`}>
                  user
                </span>
                <p className="mt-2 text-xs leading-5 text-slate-600">{t("userRoleDescription")}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${roleBadgeClassName("admin")}`}>
                  admin
                </span>
                <p className="mt-2 text-xs leading-5 text-slate-600">{t("adminRoleDescription")}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${roleBadgeClassName("superadmin")}`}>
                  superadmin
                </span>
                <p className="mt-2 text-xs leading-5 text-slate-600">{t("superadminRoleDescription")}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-semibold text-slate-950">{t("users")}</h3>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={adminSearch}
                      onChange={(event) => setAdminSearch(event.target.value)}
                      className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      placeholder={t("searchUsers")}
                      aria-label={t("searchUsers")}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={loadAdminUsers}
                    disabled={adminLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${adminLoading ? "animate-spin" : ""}`} />
                    {t("refresh")}
                  </button>
                </div>
              </div>

              {!canEditRoles ? (
                <p className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {t("adminViewOnly")}
                </p>
              ) : null}

              {canEditRoles ? (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t("selfRoleChangeDisabled")}
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
                    {filteredAdminUsers.map((adminUser) => (
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
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ${roleBadgeClassName(adminUser.role)}`}>
                              {adminUser.role}
                            </span>
                            <select
                              value={adminUser.role}
                              onChange={(event) => handleRoleChange(adminUser, event.target.value)}
                              disabled={adminUser.id === user?.id || updatingRoleId === adminUser.id}
                              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold capitalize text-slate-800 shadow-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                              aria-label={`${t("role")}: ${adminUser.name}`}
                              title={adminUser.id === user?.id ? t("selfRoleChangeDisabled") : t("role")}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="superadmin">superadmin</option>
                            </select>
                            {updatingRoleId === adminUser.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                            ) : null}
                            {adminUser.id === user?.id ? (
                              <span className="text-xs text-slate-500" title={t("selfRoleChangeDisabled")}>
                                {t("you")}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ${roleBadgeClassName(adminUser.role)}`}>
                            {adminUser.role}
                          </span>
                        )}
                        <p className="text-xs text-slate-500 sm:text-sm">
                          {new Date(adminUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {!filteredAdminUsers.length ? (
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
