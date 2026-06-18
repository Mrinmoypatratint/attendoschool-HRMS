/**
 * LoadingScreen
 * -------------
 * Full-viewport loading placeholder used while async/auth state resolves.
 * Renders animated skeleton bars inside a centered card with an optional
 * status message.
 */

/**
 * Renders a centered, full-height loading screen with skeleton placeholders.
 *
 * @param title - Optional status message shown beneath the skeletons (defaults to "Loading").
 * @returns The loading screen element.
 */
export function LoadingScreen({ title }: { title?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="animate-pulse rounded-lg bg-background h-6 w-2/3" aria-hidden="true" />
        <div className="mt-4 animate-pulse rounded-lg bg-background h-4 w-full" aria-hidden="true" />
        <div className="mt-2 animate-pulse rounded-lg bg-background h-4 w-5/6" aria-hidden="true" />
        <p className="mt-4 text-sm text-text-secondary">{title ?? "Loading"}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
