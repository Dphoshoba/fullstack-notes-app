import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "./Button.jsx";
import { useI18n } from "../context/I18nContext.jsx";

const initialValues = {
  title: "",
  body: "",
  tags: "",
  category: "General",
  starred: false,
  pinned: false
};

export function NoteForm({ onCreate, onCreateError, onCreateSuccess }) {
  const { t } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
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
        starred: values.starred,
        pinned: values.pinned,
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      setValues(initialValues);
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
        <label className="text-sm font-medium text-slate-700" htmlFor="title">
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={updateField}
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
          className="mt-2 w-full resize-none rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder={t("body")}
        />
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
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder={t("tags")}
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

      <Button type="submit" loading={saving} className="w-full bg-emerald-700 hover:bg-emerald-800">
        <Plus className="h-4 w-4" />
        {t("createNote")}
      </Button>
    </form>
  );
}
