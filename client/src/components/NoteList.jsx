import { Edit3, FileText, Loader2, Pin, Save, SearchX, Star, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

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
  starred: Boolean(note.starred),
  pinned: Boolean(note.pinned)
});

const parseTags = (tags) =>
  tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

function NoteCard({ note, onDelete, onEdit, onUpdate, onUpdateError, onUpdateSuccess, deletingId }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

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
    </article>
  );
}

function EditNoteModal({ note, onClose, onUpdate, onUpdateError, onUpdateSuccess }) {
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
  onUpdateSuccess
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
            deletingId={deletingId}
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
        />
      ) : null}
    </>
  );
}
