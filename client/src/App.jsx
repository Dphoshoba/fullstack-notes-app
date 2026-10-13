import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt.jsx";
import { PwaUpdatePrompt } from "./components/PwaUpdatePrompt.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <Outlet />
      <PwaUpdatePrompt />
      <PwaInstallPrompt />
    </ErrorBoundary>
  );
}
