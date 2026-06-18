/**
 * ErrorState
 * ----------
 * Presentational component shown when content fails to load. Displays an alert
 * icon, title, description, and an optional retry button. Text props default to
 * generic error messaging.
 */
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  /** Headline text (defaults to "Something went wrong"). */
  title?: string;
  /** Supporting description text. */
  description?: string;
  /** Optional retry handler; when provided, a "Try Again" button is rendered. */
  onRetry?: () => void;
}

/**
 * Renders an error-state placeholder with an optional retry action.
 *
 * @param title - Headline text.
 * @param description - Supporting copy.
 * @param onRetry - Handler invoked when the retry button is clicked; the button
 *                  only renders when this is provided.
 * @returns The error-state element.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
      {/* Only render the retry button when a handler is supplied. */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
