import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { AuthLayout } from "../components/AuthLayout.jsx";
import { Button } from "../components/Button.jsx";
import { FormField } from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("createAccount")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          {t("alreadyHaveAccount")}{" "}
          <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to="/login">
            {t("logIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormField
          label={t("name")}
          name="name"
          type="text"
          value={form.name}
          onChange={updateField}
          autoComplete="name"
          required
        />
        <FormField
          label={t("email")}
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          autoComplete="email"
          required
        />
        <FormField
          label={t("password")}
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          autoComplete="new-password"
          minLength="8"
          required
        />

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <Button type="submit" loading={loading} className="w-full">
          <UserPlus className="h-4 w-4" />
          {t("register")}
        </Button>
      </form>
    </AuthLayout>
  );
}
