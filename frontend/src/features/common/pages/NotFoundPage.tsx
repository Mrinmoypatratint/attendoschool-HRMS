import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-4 p-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-text-secondary">The requested route does not exist.</p>
        <div className="mt-4">
          <Link to="/login" className="text-sm font-medium text-primary hover:text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

