import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}
