import { LogIn } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { trackEvent } from "../api/analytics.js";
import { AuthLayout } from "../components/AuthLayout.jsx";
import { Button } from "../components/Button.jsx";
import { FormField } from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = location.state?.from?.pathname || "/dashboard";
  const authMessage = location.state?.message || "";

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    trackEvent("click_login", { location: "login_form" });

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("logIn")}
      subtitle={t("logInSubtitle")}
      footer={
        <>
          {t("needAccount")}{" "}
          <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to="/register">
            {t("register")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
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
          autoComplete="current-password"
          required
        />

        {authMessage ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{authMessage}</p>
        ) : null}
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <Button type="submit" loading={loading} className="w-full">
          <LogIn className="h-4 w-4" />
          {t("logIn")}
        </Button>
      </form>
    </AuthLayout>
  );
}
