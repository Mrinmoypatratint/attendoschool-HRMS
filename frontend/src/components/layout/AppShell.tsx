/**
 * AppShell
 * --------
 * Top-level authenticated application layout. Composes the persistent sidebar
 * navigation and top header around a routed content area. The nested route's
 * element is rendered into the `<Outlet />`.
 */
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

/**
 * Renders the main application chrome (sidebar + header) with the active child
 * route displayed in the central content region.
 *
 * @returns The application shell layout containing the routed outlet.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {/* Active nested route renders here. */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
