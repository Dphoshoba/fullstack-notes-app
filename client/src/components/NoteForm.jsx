import { Copy, Loader2, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { getSmartSuggestions } from "../api/ai.js";
import { Button } from "./Button.jsx";
import { useI18n } from "../context/I18nContext.jsx";

const meetingTemplate = ["Agenda", "", "Discussion", "", "Decisions", "", "Action items", "", "Next steps"].join("\n");

const initialValues = {
  title: "",
  body: "",
  tags: "",
  category: "General",
  noteType: "standard",
  meetingDate: "",
  attendees: "",
  followUpDate: "",
  visibility: "private",
  starred: false,
  pinned: false
};

export const suggestionsToText = (suggestions) =>
  [
    suggestions.suggestedTitle ? `Suggested title: ${suggestions.suggestedTitle}` : "",
    suggestions.possibleTags?.length ? `Possible tags: ${suggestions.possibleTags.join(", ")}` : "",
    suggestions.missingDetails?.length
      ? `Missing details:\n${suggestions.missingDetails.map((item) => `- ${item}`).join("\n")}`
      : "",
    suggestions.actionItems?.length
      ? `Possible action items:\n${suggestions.actionItems.map((item) => `- ${item}`).join("\n")}`
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");

export function SmartSuggestionsPanel({
  suggestions,
  loading,
  error,
  copied,
  onApplyTitle,
  onApplyTags,
  onCopy,
  t
}) {
  if (!suggestions && !loading && !error) {
    return null;
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">{t("smartSuggestions")}</p>
          <p className="mt-1 text-xs text-emerald-800">{t("smartSuggestionsDescription")}</p>
        </div>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-700" /> : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {suggestions ? (
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          {suggestions.suggestedTitle ? (
            <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase text-slate-500">{t("clearerTitleSuggestion")}</p>
              <p className="mt-1 font-semibold text-slate-950">{suggestions.suggestedTitle}</p>
            </div>
          ) : null}
          {suggestions.possibleTags?.length ? (
            <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase text-slate-500">{t("possibleTags")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.possibleTags.map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {suggestions.missingDetails?.length ? (
            <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase text-slate-500">{t("missingDetails")}</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {suggestions.missingDetails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {suggestions.actionItems?.length ? (
            <div className="rounded-md bg-white p-3 ring-1 ring-emerald-100">
              <p className="text-xs font-semibold uppercase text-slate-500">{t("possibleActionItems")}</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {suggestions.actionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onApplyTitle}
              disabled={!suggestions.suggestedTitle}
              className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("applySuggestedTitle")}
            </button>
            <button
              type="button"
              onClick={onApplyTags}
              disabled={!suggestions.possibleTags?.length}
              className="inline-flex h-9 items-center justify-center rounded-md border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("applySuggestedTags")}
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
              {copied ? t("copiedToClipboard") : t("copySuggestions")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function NoteForm({
  onCreate,
  onCreateError,
  onCreateSuccess,
  hasWorkspace = false,
  defaultVisibility = "private",
  prefillValues = null
}) {
  const { t } = useI18n();
  const [values, setValues] = useState({ ...initialValues, visibility: defaultVisibility });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [suggestionsCopied, setSuggestionsCopied] = useState(false);

  useEffect(() => {
    if (!prefillValues) {
      return;
    }

    setValues((current) => ({
      ...current,
      ...prefillValues,
      visibility: hasWorkspace
        ? prefillValues.visibility || current.visibility || defaultVisibility
        : "private"
    }));
  }, [defaultVisibility, hasWorkspace, prefillValues]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const useMeetingTemplate = () => {
    setValues((current) => ({
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
        title: values.title,
        body: values.body,
        noteType: values.noteType
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

    setValues((current) => ({ ...current, title: suggestions.suggestedTitle }));
  };

  const applySuggestedTags = () => {
    if (!suggestions?.possibleTags?.length) {
      return;
    }

    setValues((current) => ({ ...current, tags: suggestions.possibleTags.join(", ") }));
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

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const note = await onCreate({
        title: values.title,
        body: values.body,
        category: values.category,
        noteType: values.noteType,
        meetingMeta:
          values.noteType === "meeting"
            ? {
                meetingDate: values.meetingDate,
                attendees: values.attendees
                  .split(",")
                  .map((attendee) => attendee.trim())
                  .filter(Boolean),
                followUpDate: values.followUpDate,
                sourceType: "manual"
              }
            : undefined,
        visibility: hasWorkspace ? values.visibility : "private",
        starred: values.starred,
        pinned: values.pinned,
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      setValues({ ...initialValues, visibility: hasWorkspace ? defaultVisibility : "private" });
      setSuggestions(null);
      setSuggestionsError("");
      setSuggestionsCopied(false);
      onCreateSuccess?.(note);
    } catch (err) {
      setError(err.message);
      onCreateError?.(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="noteType">
          {t("noteType")}
        </label>
        <select
          id="noteType"
          name="noteType"
          value={values.noteType}
          onChange={updateField}
          className="premium-input mt-2 h-11 w-full px-3 text-sm"
        >
          <option value="standard">{t("standardNote")}</option>
          <option value="meeting">{t("meetingNote")}</option>
        </select>
      </div>

      {values.noteType === "meeting" ? (
        <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("meetingDate")}</span>
              <input
                type="date"
                name="meetingDate"
                value={values.meetingDate}
                onChange={updateField}
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("followUpDate")}</span>
              <input
                type="date"
                name="followUpDate"
                value={values.followUpDate}
                onChange={updateField}
                className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="text-sm font-medium text-slate-700">{t("attendees")}</span>
            <input
              name="attendees"
              value={values.attendees}
              onChange={updateField}
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="title">
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={updateField}
          required
          className="premium-input mt-2 h-11 w-full px-3 text-sm"
          placeholder={t("title")}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="body">
          {t("body")}
        </label>
        <textarea
          id="body"
          name="body"
          value={values.body}
          onChange={updateField}
          required
          rows="5"
          className="premium-input mt-2 w-full resize-none px-3 py-3 text-sm"
          placeholder={t("body")}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="visibility">
          {t("noteVisibility")}
        </label>
        <select
          id="visibility"
          name="visibility"
          value={hasWorkspace ? values.visibility : "private"}
          onChange={updateField}
          disabled={!hasWorkspace}
          className="premium-input mt-2 h-11 w-full px-3 text-sm disabled:bg-slate-100 disabled:text-slate-500"
        >
          <option value="private">{t("privateNote")}</option>
          <option value="workspace">{t("workspaceNote")}</option>
        </select>
        {!hasWorkspace ? (
          <p className="mt-2 text-xs font-medium text-slate-500">{t("workspaceRequired")}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="category">
          {t("category")}
        </label>
        <input
          id="category"
          name="category"
          value={values.category}
          onChange={updateField}
          required
          className="premium-input mt-2 h-11 w-full px-3 text-sm"
          placeholder={t("category")}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="tags">
          {t("tags")}
        </label>
        <input
          id="tags"
          name="tags"
          value={values.tags}
          onChange={updateField}
          className="premium-input mt-2 h-11 w-full px-3 text-sm"
          placeholder={t("tags")}
        />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={requestSmartSuggestions}
          disabled={suggestionsLoading || (!values.title.trim() && !values.body.trim())}
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

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="starred"
          checked={values.starred}
          onChange={updateField}
          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
        />
        {t("starred")}
      </label>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="pinned"
          checked={values.pinned}
          onChange={updateField}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
        />
        {t("pinThisNote")}
      </label>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Button type="submit" loading={saving} className="w-full bg-emerald-700 shadow-emerald-950/10 hover:bg-emerald-800">
        <Plus className="h-4 w-4" />
        {t("createNote")}
      </Button>
    </form>
  );
}
