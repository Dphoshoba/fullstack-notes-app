import { Bot, Download, Edit3, FileText, Loader2, MessageSquare, Paperclip, Pin, Save, SearchX, Star, Tags, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createComment,
  deleteAttachment,
  deleteComment,
  downloadAttachmentFile,
  fetchAttachments,
  fetchComments,
  uploadAttachment,
  updateComment
} from "../api/notes.js";
import { useI18n } from "../context/I18nContext.jsx";

const noteTimestamp = (note) => new Date(note.updatedAt || note.createdAt || 0).getTime();

const sortNotes = (notes) =>
  [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return noteTimestamp(b) - noteTimestamp(a);
  });

const noteToForm = (note) => ({
  title: note.title || "",
  body: note.body || "",
  tags: note.tags?.join(", ") || "",
  category: note.category || "General",
  visibility: note.visibility || "private",
  starred: Boolean(note.starred),
  pinned: Boolean(note.pinned)
});

const parseTags = (tags) =>
  tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatFileSize = (size) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function NoteAttachments({ note, currentUser, onAttachmentError }) {
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
                    {attachment.mimeType} • {formatFileSize(attachment.size)} •{" "}
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

function NoteComments({ note, currentUser, onCommentError }) {
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
  onUpdate,
  onUpdateError,
  onUpdateSuccess,
  onRunAiAction,
  aiLoadingAction,
  usageLimitReached,
  deletingId,
  currentUser
}) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const summaryLoading = aiLoadingAction === `summary:${note.id}`;
  const tagsLoading = aiLoadingAction === `tags:${note.id}`;
  const aiActionDisabled = saving || Boolean(aiLoadingAction);

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

  return (
    <article
      className={`rounded-lg border p-5 shadow-sm ${
        note.pinned
          ? "border-emerald-300 bg-emerald-50/70 shadow-emerald-950/5"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {note.pinned ? <Pin className="h-4 w-4 text-emerald-700" /> : null}
            <h3 className="truncate text-base font-semibold text-slate-950">{note.title}</h3>
                {note.pinned ? (
                  <span className="shrink-0 rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">
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

      <div className="mt-5">
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          {note.category || "General"}
        </span>
        {note.starred ? (
          <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            <Star className="h-3 w-3 fill-current" />
            {t("starred")}
          </span>
        ) : null}
        <span className="ml-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {(note.visibility || "private") === "workspace" ? t("workspaceNote") : t("privateNote")}
        </span>
      </div>

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

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRunAiAction?.("summary", note)}
          disabled={aiActionDisabled}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`${t("suggestTagsForThisNote")}: ${note.title}`}
          title={usageLimitReached ? t("upgradeToContinue") : t("suggestTagsForThisNote")}
        >
          {tagsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tags className="h-3.5 w-3.5" />}
          {t("suggestTags")}
        </button>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          aria-expanded={detailsOpen}
        >
          <MessageSquare className="h-4 w-4" />
          {t("comments")} / {t("attachments")}
        </button>
      </div>

      {detailsOpen ? (
        <>
          <NoteAttachments note={note} currentUser={currentUser} onAttachmentError={onUpdateError} />
          <NoteComments note={note} currentUser={currentUser} onCommentError={onUpdateError} />
        </>
      ) : null}
    </article>
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

  const updateField = (event) => {
    const { name, type, value, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const closeModal = () => {
    if (!saving) {
      onClose();
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.body.trim() || !form.category.trim()) {
      setError(t("noteRequiredFields"));
      return;
    }

    setSaving(true);

    try {
      const updatedNote = await onUpdate(note.id, {
        title: form.title.trim(),
        body: form.body.trim(),
        tags: parseTags(form.tags),
        category: form.category.trim(),
        visibility: hasWorkspace ? form.visibility : "private",
        starred: form.starred,
        pinned: form.pinned
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
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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
  emptyVariant = "notes",
  onUpdateError,
  onUpdateSuccess,
  onRunAiAction,
  aiLoadingAction,
  usageLimitReached,
  hasWorkspace = false,
  currentUser
}) {
  const [editingNote, setEditingNote] = useState(null);
  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);

  if (!notes.length) {
    const EmptyIcon = emptyVariant === "search" ? SearchX : FileText;

    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <EmptyIcon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onDelete={onDelete}
            onEdit={setEditingNote}
            onUpdate={onUpdate}
            onUpdateError={onUpdateError}
            onUpdateSuccess={onUpdateSuccess}
            onRunAiAction={onRunAiAction}
            aiLoadingAction={aiLoadingAction}
            usageLimitReached={usageLimitReached}
            deletingId={deletingId}
            currentUser={currentUser}
          />
        ))}
      </div>

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
