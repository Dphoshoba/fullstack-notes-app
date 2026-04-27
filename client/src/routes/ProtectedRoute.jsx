import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { booting, isAuthenticated } = useAuth();
  const { t } = useI18n();

  if (booting) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 text-slate-900">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("loading")}
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
