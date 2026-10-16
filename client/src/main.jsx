import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { I18nProvider } from "./context/I18nContext.jsx";
import AcceptInvitePage from "./pages/AcceptInvitePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import GuidePage from "./pages/GuidePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LegalPage from "./pages/LegalPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ManualPage from "./pages/ManualPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { ProtectedRoute } from "./routes/ProtectedRoute.jsx";
import { registerPwa } from "./pwa/registerPwa.js";
import { QueryProvider } from "./api/queryClient.jsx";
import "./styles.css";

registerPwa();

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <LandingPage /> },
        { path: "invite/:token", element: <AcceptInvitePage /> },
        { path: "privacy", element: <LegalPage type="privacy" /> },
        { path: "terms", element: <LegalPage type="terms" /> },
        { path: "support", element: <LegalPage type="support" /> },
        { path: "login", element: <LoginPage /> },
        { path: "register", element: <RegisterPage /> },
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: "guide",
          element: (
            <ProtectedRoute>
              <GuidePage />
            </ProtectedRoute>
          )
        },
        {
          path: "manual",
          element: (
            <ProtectedRoute>
              <ManualPage />
            </ProtectedRoute>
          )
        },
        {
          path: "settings",
          element: (
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          )
        }
      ]
    }
  ],
  {
    future: {
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_relativeSplatPath: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
