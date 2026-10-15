import { Bot, Clock3, Copy, Download, Edit3, FileText, Loader2, MessageSquare, MoreHorizontal, Paperclip, Pin, RotateCcw, Save, SearchX, Share2, Sparkles, Star, Tags, Trash2, Upload, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getSmartSuggestions } from "../api/ai.js";
import {
  createComment,
  deleteAttachment,
  deleteComment,
  downloadAttachmentFile,
  fetchAttachments,
  fetchComments,
  fetchNote,
  fetchNoteHistory,
  restoreNoteHistory,
  uploadAttachment,
  updateComment
} from "../api/notes.js";
import { SmartSuggestionsPanel, suggestionsToText } from "./NoteForm.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { sanitizeMultilineText, sanitizeSingleLineText } from "../utils/textSanitizer.js";

const noteTimestamp = (note) => new Date(note.updatedAt || note.createdAt || 0).getTime();

const sortNotes = (notes) =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return noteTimestamp(b) - noteTimestamp(a);
  });

const sharedFromFooter = "Shared from Notes Workspace";

const noteToShareText = (note) => [
  `Title: ${note.title || ""}`,
  `Content: ${note.body || ""}`,
  "",
  sharedFromFooter
].join("\n");

const noteToPlainText = (note) => [
  note.title || "Untitled note",
  "",
  note.body || "",
  "",
  sharedFromFooter
].join("\n");

const safeFilename = (value) =>
  (value || "note")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "note";

const downloadTextFile = ({ contents, filename }) => {
  const blob = new window.Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const noteToForm = (note) => ({
  title: note.title || "",
  body: note.body || "",
  tags: note.tags?.join(", ") || "",
  category: note.category || "General",
  noteType: note.noteType || "standard",
  meetingDate: note.meetingMeta?.meetingDate ? note.meetingMeta.meetingDate.slice(0, 10) : "",
  attendees: note.meetingMeta?.attendees?.join(", ") || "",
  followUpDate: note.meetingMeta?.followUpDate ? note.meetingMeta.followUpDate.slice(0, 10) : "",
  visibility: note.visibility || "private",
  starred: Boolean(note.starred),
  pinned: Boolean(note.pinned),
  isActionNote: Boolean(
    note.dueDate ||
      note.dueTime ||
      note.reminderAt ||
      note.priority ||
      (note.actionStatus && note.actionStatus !== "open")
  ),
  dueDate: note.dueDate ? note.dueDate.slice(0, 10) : "",
  dueTime: note.dueTime || "",
  reminderAt: note.reminderAt ? note.reminderAt.slice(0, 16) : "",
  actionStatus: note.actionStatus || "open",
  priority: note.priority || ""
});

const meetingTemplate = ["Agenda", "", "Discussion", "", "Decisions", "", "Action items", "", "Next steps"].join("\n");

const parseTags = (tags) =>
  sanitizeSingleLineText(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatMeetingDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const hasActionNoteFields = (note) =>
  Boolean(
    note.dueDate ||
      note.dueTime ||
      note.reminderAt ||
      note.priority ||
      (note.actionStatus && note.actionStatus !== "open")
  );

const actionStatusLabel = (status, t) => {
  if (status === "in_progress") return t("inProgress");
  if (status === "done") return t("done");
  return t("open");
};

const priorityLabel = (priority, t) => {
  if (priority === "low") return t("priorityLow");
  if (priority === "medium") return t("priorityMedium");
  if (priority === "high") return t("priorityHigh");
  return "";
};

const priorityBadgeClass = (priority) => {
  if (priority === "high") return "bg-red-50 text-red-700 ring-red-200";
  if (priority === "medium") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-sky-50 text-sky-700 ring-sky-200";
};

const formatActionDueDate = (note) => {
  if (!note.dueDate) {
    return "";
  }

  const dueAt = new Date(note.dueDate);

  if (note.dueTime) {
    const [hours, minutes] = note.dueTime.split(":").map(Number);
    dueAt.setHours(hours || 0, minutes || 0, 0, 0);
  }

  return dueAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: note.dueTime ? "numeric" : undefined,
    minute: note.dueTime ? "2-digit" : undefined
  });
};

const isActionOverdue = (note) => {
  if (!note.dueDate || note.actionStatus === "done") {
    return false;
  }

  const dueAt = new Date(note.dueDate);

  if (note.dueTime) {
    const [hours, minutes] = note.dueTime.split(":").map(Number);
    dueAt.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    dueAt.setHours(23, 59, 59, 999);
  }

  return dueAt.getTime() < Date.now();
};

const toTextLines = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item?.text || ""))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
};

const normalizeActionItems = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return { text: item.trim() };
        }

        return {
          text: item?.text?.trim() || "",
          owner: item?.owner?.trim() || "",
          dueDate: item?.dueDate || item?.due || "",
          status: item?.status?.trim() || ""
        };
      })
      .filter((item) => item.text);
  }

  return toTextLines(value).map((text) => ({ text }));
};

const statusLabel = (status, t) => {
  if (status === "open") {
    return t("open");
  }

  if (status === "done") {
    return t("done");
  }

  return status;
};

const formatFileSize = (size) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function MeetingSummary({ note }) {
  const { t } = useI18n();
  const meta = note.meetingMeta || {};
  const attendees = Array.isArray(meta.attendees)
    ? meta.attendees.filter(Boolean)
    : toTextLines(meta.attendees);
  const agendaItems = toTextLines(meta.agenda);
  const decisions = toTextLines(meta.decisions);
  const actionItems = normalizeActionItems(meta.actionItems);
  const hasSummaryContent = Boolean(
    meta.meetingDate ||
      attendees.length ||
      meta.followUpDate ||
      agendaItems.length ||
      decisions.length ||
      actionItems.length
  );

  if (note.noteType !== "meeting" || !hasSummaryContent) {
    return null;
  }

  return (
    <section className="mt-5 rounded-md border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-950">{t("meetingSummary")}</h4>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
          {t("meeting")}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {meta.meetingDate ? (
          <div className="rounded-md bg-white/80 px-3 py-2 ring-1 ring-indigo-100">
            <p className="text-xs font-semibold uppercase text-slate-500">{t("meetingDate")}</p>
            <p className="mt-1 text-sm text-slate-800">{formatMeetingDate(meta.meetingDate)}</p>
          </div>
        ) : null}

        {meta.followUpDate ? (
          <div className="rounded-md bg-white/80 px-3 py-2 ring-1 ring-indigo-100">
            <p className="text-xs font-semibold uppercase text-slate-500">{t("followUpDate")}</p>
            <p className="mt-1 text-sm text-slate-800">{formatMeetingDate(meta.followUpDate)}</p>
          </div>
        ) : null}
      </div>

      {attendees.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">{t("attendees")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {attendees.map((attendee) => (
              <span key={attendee} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-indigo-100">
                {attendee}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {agendaItems.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">{t("agenda")}</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            {agendaItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {decisions.length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">{t("decisions")}</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            {decisions.map((decision) => (
              <li key={decision}>- {decision}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase text-slate-500">{t("actionItems")}</p>
        {actionItems.length ? (
          <div className="mt-2 space-y-2">
            {actionItems.map((item, index) => (
              <div key={`${item.text}-${index}`} className="rounded-md bg-white px-3 py-2 ring-1 ring-indigo-100">
                <p className="text-sm font-medium text-slate-800">{item.text}</p>
                {item.owner || item.dueDate || item.status ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.owner ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {item.owner}
                      </span>
                    ) : null}
                    {item.dueDate ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {formatMeetingDate(item.dueDate)}
                      </span>
                    ) : null}
                    {item.status ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        {statusLabel(item.status, t)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-indigo-100">
            {t("noActionItemsYet")}
          </p>
        )}
      </div>
    </section>
  );
}

function NoteMetadataBadges({ note }) {
  const { t } = useI18n();
  const hasActionMetadata = hasActionNoteFields(note);
  const actionOverdue = isActionOverdue(note);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          {note.category || "General"}
        </span>
        {note.starred ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            <Star className="h-3 w-3 fill-current" />
            {t("starred")}
          </span>
        ) : null}
        {note.noteType === "meeting" ? (
          <span className="inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
            {t("meeting")}
          </span>
        ) : null}
        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {(note.visibility || "private") === "workspace" ? t("workspaceNote") : t("privateNote")}
        </span>
      </div>

      {hasActionMetadata ? (
        <div className="mt-4 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-900">
              {t("actionNote")}
            </span>
            {note.dueDate ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${
                  actionOverdue
                    ? "bg-red-50 text-red-700 ring-red-200"
                    : "bg-blue-50 text-blue-700 ring-blue-200"
                }`}
              >
                <Clock3 className="h-3 w-3" />
                {actionOverdue ? t("overdue") : t("due")}: {formatActionDueDate(note)}
              </span>
            ) : null}
            <span className="inline-flex rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
              {actionStatusLabel(note.actionStatus || "open", t)}
            </span>
            {note.priority ? (
              <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${priorityBadgeClass(note.priority)}`}>
                {priorityLabel(note.priority, t)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function NoteAttachments({ note, currentUser, onAttachmentError, onCountChange }) {
  const { t } = useI18n();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const onAttachmentErrorRef = useRef(onAttachmentError);
  const canDeleteAny =
    note.owner === currentUser?.id ||
    ((note.visibility || "private") === "workspace" &&
      ["owner", "manager"].includes(currentUser?.workspaceRole));

  useEffect(() => {
    onAttachmentErrorRef.current = onAttachmentError;
  }, [onAttachmentError]);

  const reportAttachmentError = useCallback((message) => {
    const nextError = new Error(message);
    setError(message);
    onAttachmentErrorRef.current?.(nextError);
  }, []);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextAttachments = await fetchAttachments(note.id);
      setAttachments(nextAttachments);
    } catch {
      reportAttachmentError("Attachments could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [note.id, reportAttachmentError]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const nextAttachments = await fetchAttachments(note.id);
        if (alive) {
          setAttachments(nextAttachments);
        }
      } catch {
        if (alive) {
          reportAttachmentError("Attachments could not be loaded");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [note.id, reportAttachmentError]);

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadAttachment(note.id, file);
      await loadAttachments();
      onCountChange?.(1);
    } catch {
      reportAttachmentError("Attachment could not be uploaded");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId) => {
    try {
      await deleteAttachment(attachmentId);
      await loadAttachments();
      onCountChange?.(-1);
    } catch (err) {
      setError(err.message);
      onAttachmentErrorRef.current?.(err);
    }
  };

  const openAttachment = async (attachment) => {
    try {
      await downloadAttachmentFile(attachment);
    } catch (err) {
      setError(err.message);
      onAttachmentErrorRef.current?.(err);
    }
  };

  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-emerald-700" />
          <h4 className="text-sm font-semibold text-slate-950">{t("attachments")}</h4>
        </div>
        <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {t("uploadFile")}
          <input
            type="file"
            className="sr-only"
            onChange={uploadFile}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt,.md"
            disabled={uploading}
          />
        </label>
      </div>

      {error ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{t("loading")}</p>
      ) : null}

      {!loading && !attachments.length ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{t("noAttachmentsYet")}</p>
      ) : null}

      <div className="space-y-2">
        {attachments.map((attachment) => {
          const uploader = attachment.uploadedBy;
          const isUploader = uploader?.id === currentUser?.id || uploader?._id === currentUser?.id;
          const canDelete = isUploader || canDeleteAny;

          return (
            <div key={attachment.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{attachment.originalName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {attachment.mimeType} - {formatFileSize(attachment.size)} -{" "}
                    {new Date(attachment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openAttachment(attachment)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-950"
                    aria-label={`${t("download")}: ${attachment.originalName}`}
                    title={t("download")}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-700 transition hover:bg-red-50"
                      aria-label={`${t("deleteAttachment")}: ${attachment.originalName}`}
                      title={t("deleteAttachment")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NoteComments({ note, currentUser, onCommentError, onCountChange }) {
  const { t } = useI18n();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const onCommentErrorRef = useRef(onCommentError);

  const canDeleteAny =
    (note.visibility || "private") === "workspace" &&
    ["owner", "manager"].includes(currentUser?.workspaceRole);

  useEffect(() => {
    onCommentErrorRef.current = onCommentError;
  }, [onCommentError]);

  const reportCommentError = useCallback((message) => {
    const nextError = new Error(message);
    setError(message);
    onCommentErrorRef.current?.(nextError);
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextComments = await fetchComments(note.id);
      setComments(nextComments);
    } catch {
      reportCommentError("Comments could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [note.id, reportCommentError]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const nextComments = await fetchComments(note.id);
        if (alive) {
          setComments(nextComments);
        }
      } catch {
        if (alive) {
          reportCommentError("Comments could not be loaded");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [note.id, reportCommentError]);

  const submitComment = async (event) => {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    setSaving(true);

    try {
      await createComment(note.id, { text: text.trim() });
      await loadComments();
      onCountChange?.(1);
      setText("");
    } catch {
      reportCommentError("Comment could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditingText(comment.text);
  };

  const submitEdit = async (commentId) => {
    if (!editingText.trim()) {
      return;
    }

    try {
      await updateComment(commentId, { text: editingText.trim() });
      await loadComments();
      setEditingId("");
      setEditingText("");
    } catch {
      reportCommentError("Comment could not be saved");
    }
  };

  const removeComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      await loadComments();
      onCountChange?.(-1);
    } catch (err) {
      onCommentErrorRef.current?.(err);
    }
  };

  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-emerald-700" />
        <h4 className="text-sm font-semibold text-slate-950">{t("comments")}</h4>
      </div>

      {error ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{t("loading")}</p>
      ) : null}

      {!loading && !comments.length ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{t("noCommentsYet")}</p>
      ) : null}

      <div className="space-y-3">
        {comments.map((comment) => {
          const author = comment.userId;
          const isOwn = author?.id === currentUser?.id || author?._id === currentUser?.id;
          const canDelete = isOwn || canDeleteAny;

          return (
            <div key={comment.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {author?.name || t("unknown")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {isOwn ? (
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      className="inline-flex h-7 items-center rounded-md px-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
                    >
                      {t("edit")}
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => removeComment(comment.id)}
                      className="inline-flex h-7 items-center rounded-md px-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      {t("delete")}
                    </button>
                  ) : null}
                </div>
              </div>

              {editingId === comment.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    rows="2"
                    className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => submitEdit(comment.id)}
                      className="inline-flex h-8 items-center rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800"
                    >
                      {t("save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId("")}
                      className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.text}</p>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={submitComment} className="mt-3 flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows="2"
          className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder={t("addComment")}
        />
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("postComment")}
        </button>
      </form>
    </section>
  );
}

function NoteCard({
  note,
  onDelete,
  onEdit,
  onOpen,
  onUpdate,
  onUpdateError,
  onUpdateSuccess,
  onNoteRestored,
  onShareSuccess,
  onShareError,
  onRunAiAction,
  aiLoadingAction,
  usageLimitReached,
  deletingId,
  currentUser,
  defaultExpanded = false
}) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(defaultExpanded);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activityCounts, setActivityCounts] = useState({
    comments: note.commentsCount || 0,
    attachments: note.attachmentsCount || 0
  });
  const summaryLoading = aiLoadingAction === `summary:${note.id}`;
  const tagsLoading = aiLoadingAction === `tags:${note.id}`;
  const aiActionDisabled = saving || Boolean(aiLoadingAction);

  useEffect(() => {
    setActivityCounts({
      comments: note.commentsCount || 0,
      attachments: note.attachmentsCount || 0
    });
  }, [note.attachmentsCount, note.commentsCount, note.id]);

  const updateActivityCount = (key, delta) => {
    setActivityCounts((current) => ({
      ...current,
      [key]: Math.max((current[key] || 0) + delta, 0)
    }));
  };

  const toggleStarred = async () => {
    setSaving(true);

    try {
      const updatedNote = await onUpdate(note.id, { starred: !note.starred });
      onUpdateSuccess?.(updatedNote);
    } catch (err) {
      onUpdateError?.(err);
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text) => {
    try {
      await window.navigator.clipboard.writeText(text);
      onShareSuccess?.(t("copiedToClipboard"));
    } catch {
      onShareError?.(t("copyFailed"));
    }
  };

  const copyNote = () => {
    copyText(noteToPlainText(note));
  };

  const shareNote = () => {
    copyText(noteToShareText(note));
  };

  const exportNoteAsText = () => {
    downloadTextFile({
      contents: noteToPlainText(note),
      filename: `${safeFilename(note.title)}.txt`
    });
    onShareSuccess?.(t("exportSuccess", { format: "TXT" }));
  };

  const openNote = (event) => {
    if (event.target.closest("button, a, input, textarea, select, label")) {
      return;
    }

    onOpen?.(note);
  };

  const openNoteFromKeyboard = (event) => {
    if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    onOpen?.(note);
  };

  return (
    <article
      className={`premium-card premium-card-hover p-5 ${
        note.pinned
          ? "border-emerald-300 bg-emerald-50/80 shadow-emerald-950/10"
          : ""
      } cursor-pointer focus-within:cursor-auto focus:outline-none focus:ring-4 focus:ring-emerald-100`}
      role="button"
      tabIndex={0}
      onClick={openNote}
      onKeyDown={openNoteFromKeyboard}
      aria-label={`${t("viewNote")}: ${note.title}`}
      title={t("viewNote")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {note.pinned ? <Pin className="h-4 w-4 text-emerald-700" /> : null}
            <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-950">{note.title}</h3>
            {note.pinned ? (
              <span className="shrink-0 rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white shadow-sm shadow-emerald-950/15">
                {t("pinned")}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(note.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleStarred}
            disabled={saving}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition disabled:opacity-50 ${
              note.starred
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                : "text-slate-500 hover:bg-slate-100 hover:text-amber-600"
            }`}
            aria-label={`${t("favorite")}: ${note.title}`}
            title={t("favorite")}
          >
            <Star className={`h-4 w-4 ${note.starred ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(note)}
            disabled={saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label={`${t("editNote")}: ${note.title}`}
            title={t("editNote")}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            disabled={deletingId === note.id || saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            aria-label={`${t("deleteNote")}: ${note.title}`}
            title={t("deleteNote")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {note.body}
      </p>

      <NoteMetadataBadges note={note} />

      {note.tags?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        {actionsOpen ? (
          <>
            <button
              type="button"
              onClick={copyNote}
              className="premium-button inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
              title={t("copyNote")}
            >
              <Copy className="h-3.5 w-3.5" />
              {t("copyNote")}
            </button>
            <button
              type="button"
              onClick={shareNote}
              className="premium-button inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
              title={t("shareNote")}
            >
              <Share2 className="h-3.5 w-3.5" />
              {t("shareNote")}
            </button>
            <button
              type="button"
              onClick={exportNoteAsText}
              className="premium-button inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
              title={t("exportAsText")}
            >
              <Download className="h-3.5 w-3.5" />
              {t("exportAsText")}
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="premium-button inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
              title={t("noteHistory")}
            >
              <Clock3 className="h-3.5 w-3.5" />
              {t("history")}
            </button>
            <button
              type="button"
              onClick={() => onRunAiAction?.("summary", note)}
              disabled={aiActionDisabled}
              className="premium-button inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`${t("summarizeThisNote")}: ${note.title}`}
              title={usageLimitReached ? t("upgradeToContinue") : t("summarizeThisNote")}
            >
              {summaryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
              {t("summarize")}
            </button>
            <button
              type="button"
              onClick={() => onRunAiAction?.("tags", note)}
              disabled={aiActionDisabled}
              className="premium-button inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`${t("suggestTagsForThisNote")}: ${note.title}`}
              title={usageLimitReached ? t("upgradeToContinue") : t("suggestTagsForThisNote")}
            >
              {tagsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tags className="h-3.5 w-3.5" />}
              {t("suggestTags")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setActionsOpen((current) => !current)}
            className="premium-button inline-flex h-8 w-fit items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            aria-expanded={actionsOpen}
            aria-haspopup="menu"
            aria-label={actionsOpen ? t("hideActions") : t("moreActions")}
            title={actionsOpen ? t("hideActions") : t("moreActions")}
          >
            {actionsOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            {actionsOpen ? t("hideActions") : t("moreActions")}
          </button>
        )}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          className="premium-button inline-flex min-h-9 w-full flex-wrap items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-950/[0.03] transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 sm:w-auto"
          aria-expanded={detailsOpen}
        >
          <MessageSquare className="h-4 w-4" />
          {t("comments")} / {t("attachments")}
          <span
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
            title={activityCounts.comments ? t("comments") : t("noCommentsYet")}
          >
            <MessageSquare className="h-3 w-3" />
            {activityCounts.comments}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
            title={activityCounts.attachments ? t("attachments") : t("noAttachmentsYet")}
          >
            <Paperclip className="h-3 w-3" />
            {activityCounts.attachments}
          </span>
        </button>
      </div>

      {detailsOpen ? (
        <>
          <MeetingSummary note={note} />
          <NoteAttachments
            note={note}
            currentUser={currentUser}
            onAttachmentError={onUpdateError}
            onCountChange={(delta) => updateActivityCount("attachments", delta)}
          />
          <NoteComments
            note={note}
            currentUser={currentUser}
            onCommentError={onUpdateError}
            onCountChange={(delta) => updateActivityCount("comments", delta)}
          />
        </>
      ) : null}

      {historyOpen ? (
        <NoteHistoryModal
          note={note}
          onClose={() => setHistoryOpen(false)}
          onRestore={async (historyId) => {
            const restored = await restoreNoteHistory(note.id, historyId);
            onNoteRestored?.(restored);
            return restored;
          }}
          onRestoreError={onUpdateError}
        />
      ) : null}
    </article>
  );
}

function ViewNoteModal({ note, onClose, onEdit }) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-lg border border-slate-200 bg-white shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-note-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">{t("notes")}</p>
            <h2 id="view-note-title" className="mt-1 truncate text-xl font-bold text-slate-950">
              {note.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(note.updatedAt || note.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              title={t("editNote")}
            >
              <Edit3 className="h-4 w-4" />
              {t("edit")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={t("close")}
              title={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
              {note.body}
            </p>
          </div>

          <NoteMetadataBadges note={note} />

          {note.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <MeetingSummary note={note} />
        </div>
      </section>
    </div>
  );
}

function NoteTitleIndexModal({ notes, onClose, onJumpToNote }) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-xl flex-col rounded-lg border border-slate-200 bg-white shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-index-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">{t("notes")}</p>
            <h2 id="note-index-title" className="mt-1 text-xl font-bold text-slate-950">
              {t("noteIndex")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{t("noteIndexDescription")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t("close")}
            title={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            {notes.map((note, index) => (
              <button
                key={note.id}
                type="button"
                onClick={() => onJumpToNote(note.id)}
                className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-950">
                    {note.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {note.category || "General"} • {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function NoteHistoryModal({ note, onClose, onRestore, onRestoreError }) {
  const { t } = useI18n();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState("");

  useEffect(() => {
    let alive = true;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const items = await fetchNoteHistory(note.id);
        if (alive) {
          setHistory(items);
        }
      } catch (err) {
        if (alive) {
          setError(err.message || t("noteHistoryLoadError"));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      alive = false;
    };
  }, [note.id, t]);

  const restoreVersion = async (historyId) => {
    setRestoringId(historyId);
    setError("");

    try {
      await onRestore(historyId);
      onClose();
    } catch (err) {
      setError(err.message || t("noteHistoryRestoreError"));
      onRestoreError?.(err);
    } finally {
      setRestoringId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col rounded-lg border border-slate-200 bg-white shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-history-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">{t("noteHistory")}</p>
            <h2 id="note-history-title" className="mt-1 truncate text-xl font-bold text-slate-950">
              {note.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t("close")}
            title={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {loading ? (
            <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">{t("loading")}</p>
          ) : null}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {!loading && !history.length ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              {t("noNoteHistory")}
            </p>
          ) : null}

          <div className="space-y-3">
            {history.map((item) => (
              <article key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("editedBy")} {item.editedBy?.name || item.editedBy?.email || t("unknown")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreVersion(item.id)}
                    disabled={Boolean(restoringId)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {restoringId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    {t("restoreVersion")}
                  </button>
                </div>

                <div className="mt-3 rounded-md bg-white p-3 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-950">{item.snapshot?.title}</p>
                  <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {item.snapshot?.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                      {item.snapshot?.category || "General"}
                    </span>
                    {(item.snapshot?.tags || []).map((tag) => (
                      <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function EditNoteModal({
  note,
  onClose,
  onUpdate,
  onUpdateError,
  onUpdateSuccess,
  hasWorkspace = false
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => noteToForm(note));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [suggestionsCopied, setSuggestionsCopied] = useState(false);

  const updateField = (event) => {
    const { name, type, value, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const useMeetingTemplate = () => {
    setForm((current) => ({
      ...current,
      body: current.body.trim() ? current.body : meetingTemplate
    }));
  };

  const requestSmartSuggestions = async () => {
    setSuggestionsError("");
    setSuggestionsCopied(false);
    setSuggestionsLoading(true);

    try {
      const result = await getSmartSuggestions({
        title: form.title,
        body: form.body,
        noteType: form.noteType
      });
      setSuggestions(result.suggestions);
    } catch (err) {
      setSuggestionsError(err.message);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const applySuggestedTitle = () => {
    if (!suggestions?.suggestedTitle) {
      return;
    }

    setForm((current) => ({ ...current, title: suggestions.suggestedTitle }));
  };

  const applySuggestedTags = () => {
    if (!suggestions?.possibleTags?.length) {
      return;
    }

    setForm((current) => ({ ...current, tags: suggestions.possibleTags.join(", ") }));
  };

  const copySuggestions = async () => {
    if (!suggestions) {
      return;
    }

    try {
      await window.navigator.clipboard.writeText(suggestionsToText(suggestions));
      setSuggestionsCopied(true);
    } catch {
      setSuggestionsError(t("copyFailed"));
    }
  };

  const closeModal = () => {
    if (!saving) {
      onClose();
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setError("");

    const title = sanitizeSingleLineText(form.title);
    const body = sanitizeMultilineText(form.body);
    const category = sanitizeSingleLineText(form.category);

    if (!title || !body || !category) {
      setError(t("noteRequiredFields"));
      return;
    }

    setSaving(true);

    try {
      const updatedNote = await onUpdate(note.id, {
        title,
        body,
        tags: parseTags(form.tags),
        category,
        noteType: form.noteType,
        meetingMeta:
          form.noteType === "meeting"
            ? {
                meetingDate: form.meetingDate,
                attendees: parseTags(form.attendees),
                agenda: note.meetingMeta?.agenda || "",
                decisions: note.meetingMeta?.decisions || "",
                actionItems: note.meetingMeta?.actionItems || "",
                followUpDate: form.followUpDate,
                sourceType: note.meetingMeta?.sourceType || "manual"
              }
            : undefined,
        visibility: hasWorkspace ? form.visibility : "private",
        starred: form.starred,
        pinned: form.pinned,
        dueDate: form.isActionNote ? form.dueDate : null,
        dueTime: form.isActionNote ? form.dueTime : "",
        reminderAt: form.isActionNote ? form.reminderAt : null,
        actionStatus: form.isActionNote ? form.actionStatus : "open",
        priority: form.isActionNote ? form.priority : ""
      });
      onUpdateSuccess?.(updatedNote);
      onClose();
    } catch (err) {
      setError(err.message);
      onUpdateError?.(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col rounded-lg border border-slate-200 bg-white shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-note-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">{t("notes")}</p>
            <h2 id="edit-note-title" className="mt-1 text-xl font-bold text-slate-950">
              {t("editNote")}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={saving}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
            aria-label={t("closeEditNote")}
            title={t("closeEditNote")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submitEdit} className="overflow-y-auto px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">{t("noteType")}</span>
              <select
                name="noteType"
                value={form.noteType}
                onChange={updateField}
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="standard">{t("standardNote")}</option>
                <option value="meeting">{t("meetingNote")}</option>
              </select>
            </label>

            {form.noteType === "meeting" ? (
              <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-3 sm:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("meetingDate")}</span>
                    <input
                      type="date"
                      name="meetingDate"
                      value={form.meetingDate}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("followUpDate")}</span>
                    <input
                      type="date"
                      name="followUpDate"
                      value={form.followUpDate}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className="text-sm font-medium text-slate-700">{t("attendees")}</span>
                  <input
                    name="attendees"
                    value={form.attendees}
                    onChange={updateField}
                    className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    placeholder={t("attendeesHint")}
                  />
                </label>
                <button
                  type="button"
                  onClick={useMeetingTemplate}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  {t("useMeetingTemplate")}
                </button>
              </div>
            ) : null}

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">{t("title")}</span>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">{t("body")}</span>
              <textarea
                name="body"
                value={form.body}
                onChange={updateField}
                required
                rows="7"
                className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("noteVisibility")}</span>
              <select
                name="visibility"
                value={hasWorkspace ? form.visibility : "private"}
                onChange={updateField}
                disabled={!hasWorkspace}
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="private">{t("privateNote")}</option>
                <option value="workspace">{t("workspaceNote")}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("category")}</span>
              <input
                name="category"
                value={form.category}
                onChange={updateField}
                required
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("tags")}</span>
              <input
                name="tags"
                value={form.tags}
                onChange={updateField}
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                placeholder={t("tagsHint")}
              />
            </label>

            <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 sm:col-span-2">
              <label className="flex min-h-8 cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  name="isActionNote"
                  checked={form.isActionNote}
                  onChange={updateField}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                {t("actionNote")}
              </label>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t("actionNoteDescription")}</p>

              {form.isActionNote ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("dueDate")}</span>
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("dueTime")}</span>
                    <input
                      type="time"
                      name="dueTime"
                      value={form.dueTime}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("reminderAt")}</span>
                    <input
                      type="datetime-local"
                      name="reminderAt"
                      value={form.reminderAt}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{t("actionStatus")}</span>
                    <select
                      name="actionStatus"
                      value={form.actionStatus}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="open">{t("open")}</option>
                      <option value="in_progress">{t("inProgress")}</option>
                      <option value="done">{t("done")}</option>
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">{t("priority")}</span>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={updateField}
                      className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">{t("noPriority")}</option>
                      <option value="low">{t("priorityLow")}</option>
                      <option value="medium">{t("priorityMedium")}</option>
                      <option value="high">{t("priorityHigh")}</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={requestSmartSuggestions}
              disabled={suggestionsLoading || (!form.title.trim() && !form.body.trim())}
              className="premium-button inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm shadow-emerald-950/[0.03] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {suggestionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t("getSmartSuggestions")}
            </button>
            <SmartSuggestionsPanel
              suggestions={suggestions}
              loading={suggestionsLoading}
              error={suggestionsError}
              copied={suggestionsCopied}
              onApplyTitle={applySuggestedTitle}
              onApplyTags={applySuggestedTags}
              onCopy={copySuggestions}
              t={t}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="pinned"
                checked={form.pinned}
                onChange={updateField}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
              />
              {t("pinned")}
            </label>
            <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="starred"
                checked={form.starred}
                onChange={updateField}
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              {t("starred")}
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function NoteListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="premium-card p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex shrink-0 gap-1">
              <div className="h-9 w-9 animate-pulse rounded-md bg-slate-100" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-slate-100" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="mt-6 flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-md bg-emerald-50" />
            <div className="h-6 w-16 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoteList({
  notes,
  onDelete,
  onUpdate,
  deletingId,
  emptyTitle = "No notes yet",
  emptyDescription = "Create your first note from the form.",
  emptyActionLabel = "",
  emptyActionTo = "",
  emptyVariant = "notes",
  onUpdateError,
  onUpdateSuccess,
  onNoteRestored,
  onShareSuccess,
  onShareError,
  onRunAiAction,
  aiLoadingAction,
  usageLimitReached,
  hasWorkspace = false,
  currentUser,
  targetNoteId = "",
  onTargetNoteChange
}) {
  const { t } = useI18n();
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [viewingExternalNote, setViewingExternalNote] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const noteCardRefs = useRef({});
  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);
  const activeViewingNote = viewingNote || viewingExternalNote;

  const openEditNote = (note) => {
    setViewingNote(null);
    setViewingExternalNote(null);
    onTargetNoteChange?.("");
    setEditingNote(note);
  };

  const openNote = (note) => {
    setViewingExternalNote(null);
    setViewingNote(note);
    onTargetNoteChange?.(note.id);
  };

  const closeViewer = () => {
    setViewingNote(null);
    setViewingExternalNote(null);
    onTargetNoteChange?.("");
  };

  const jumpToNote = (noteId) => {
    setIndexOpen(false);
    const note = sortedNotes.find((item) => item.id === noteId);
    if (note) {
      setViewingExternalNote(null);
      setViewingNote(note);
    }
    onTargetNoteChange?.(noteId);
    window.setTimeout(() => {
      noteCardRefs.current[noteId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  useEffect(() => {
    if (!targetNoteId) {
      setViewingExternalNote(null);
      return;
    }

    const localNote = sortedNotes.find((note) => note.id === targetNoteId);

    if (localNote) {
      setViewingExternalNote(null);
      setViewingNote(localNote);
      window.setTimeout(() => {
        noteCardRefs.current[targetNoteId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    let alive = true;
    setTargetLoading(true);
    fetchNote(targetNoteId)
      .then((note) => {
        if (alive) {
          setViewingNote(null);
          setViewingExternalNote(note);
        }
      })
      .catch((err) => {
        if (alive) {
          onUpdateError?.(err);
          onTargetNoteChange?.("");
        }
      })
      .finally(() => {
        if (alive) {
          setTargetLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [onTargetNoteChange, onUpdateError, sortedNotes, targetNoteId]);

  if (!notes.length) {
    const EmptyIcon = emptyVariant === "search" ? SearchX : FileText;

    return (
      <>
        {targetLoading ? (
          <p className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {t("loadingNotes")}
          </p>
        ) : null}
        <div className="premium-card border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <EmptyIcon className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {emptyDescription}
          </p>
          {emptyActionLabel && emptyActionTo ? (
            <Link
              to={emptyActionTo}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-950/10 transition hover:bg-emerald-800"
            >
              <UserPlus className="h-4 w-4" />
              {emptyActionLabel}
            </Link>
          ) : null}
        </div>
        {activeViewingNote ? (
          <ViewNoteModal
            note={activeViewingNote}
            onClose={closeViewer}
            onEdit={openEditNote}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.03] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{t("noteIndex")}</p>
          <p className="text-xs text-slate-500">{t("noteIndexDescription")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex h-8 items-center justify-center rounded px-3 text-xs font-semibold transition ${
                viewMode === "cards" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {t("cardView")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex h-8 items-center justify-center rounded px-3 text-xs font-semibold transition ${
                viewMode === "list" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {t("listView")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIndexOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <FileText className="h-3.5 w-3.5" />
            {t("showNoteTitles")}
          </button>
        </div>
      </div>

      {targetLoading ? (
        <p className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {t("loadingNotes")}
        </p>
      ) : null}

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
          <div className="hidden grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>{t("title")}</span>
            <span>{t("category")}</span>
            <span>{t("updatedDate")}</span>
            <span>{t("actionStatus")}</span>
            <span className="text-right">{t("edit")}</span>
          </div>
          <div className="divide-y divide-slate-200">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                ref={(element) => {
                  if (element) {
                    noteCardRefs.current[note.id] = element;
                  } else {
                    delete noteCardRefs.current[note.id];
                  }
                }}
                className="grid gap-3 px-4 py-3 transition hover:bg-slate-50 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr_120px] lg:items-center"
              >
                <button
                  type="button"
                  onClick={() => openNote(note)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate text-sm font-semibold text-slate-950">{note.title}</span>
                  <span className="mt-1 block line-clamp-1 text-xs text-slate-500">{note.body}</span>
                </button>
                <span className="w-fit rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  {note.category || "General"}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                </span>
                <span className="flex flex-wrap gap-2">
                  {hasActionNoteFields(note) ? (
                    <>
                      <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                        {actionStatusLabel(note.actionStatus || "open", t)}
                      </span>
                      {note.dueDate ? (
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                          {formatActionDueDate(note)}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">{t("standardNote")}</span>
                  )}
                </span>
                <span className="flex justify-start gap-1 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => onUpdate(note.id, { starred: !note.starred }).then(onUpdateSuccess).catch(onUpdateError)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                      note.starred ? "bg-amber-50 text-amber-600" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title={t("favorite")}
                  >
                    <Star className={`h-4 w-4 ${note.starred ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditNote(note)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    title={t("editNote")}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    title={t("deleteNote")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedNotes.map((note, index) => (
          <div
            key={note.id}
            ref={(element) => {
              if (element) {
                noteCardRefs.current[note.id] = element;
              } else {
                delete noteCardRefs.current[note.id];
              }
            }}
          >
            <NoteCard
              note={note}
              defaultExpanded={index === 0}
              onDelete={onDelete}
              onEdit={openEditNote}
              onOpen={openNote}
              onUpdate={onUpdate}
              onUpdateError={onUpdateError}
              onUpdateSuccess={onUpdateSuccess}
              onNoteRestored={onNoteRestored}
              onShareSuccess={onShareSuccess}
              onShareError={onShareError}
              onRunAiAction={onRunAiAction}
              aiLoadingAction={aiLoadingAction}
              usageLimitReached={usageLimitReached}
              deletingId={deletingId}
              currentUser={currentUser}
            />
          </div>
        ))}
      </div>
      )}

      {indexOpen ? (
        <NoteTitleIndexModal
          notes={sortedNotes}
          onClose={() => setIndexOpen(false)}
          onJumpToNote={jumpToNote}
        />
      ) : null}

      {activeViewingNote ? (
        <ViewNoteModal
          note={activeViewingNote}
          onClose={closeViewer}
          onEdit={openEditNote}
        />
      ) : null}

      {editingNote ? (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onUpdate={onUpdate}
          onUpdateError={onUpdateError}
          onUpdateSuccess={onUpdateSuccess}
          hasWorkspace={hasWorkspace}
        />
      ) : null}
    </>
  );
}
