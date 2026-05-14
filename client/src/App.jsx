import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <Outlet />
      <PwaInstallPrompt />
    </ErrorBoundary>
  );
}
