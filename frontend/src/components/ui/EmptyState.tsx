/**
 * EmptyState
 * ----------
 * Presentational placeholder shown when a list/collection has no data. Displays
 * an icon, title, description, and an optional call-to-action button. All text
 * has sensible defaults so callers can render it with no props.
 */
import { FolderOpen } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  /** Headline text (defaults to "No data found"). */
  title?: string;
  /** Supporting description text. */
  description?: string;
  /** Custom icon node; falls back to a folder icon when omitted. */
  icon?: ReactNode;
  /** Label for the optional action button. */
  actionLabel?: string;
  /** Click handler for the optional action button. */
  onAction?: () => void;
}

/**
 * Renders an empty-state placeholder with optional call-to-action.
 *
 * @param title - Headline text.
 * @param description - Supporting copy.
 * @param icon - Optional custom icon; defaults to a folder icon.
 * @param actionLabel - Label for the action button.
 * @param onAction - Handler invoked when the action button is clicked.
 * @returns The empty-state element. The action button only renders when both
 *          `actionLabel` and `onAction` are provided.
 */
export function EmptyState({
  title = "No data found",
  description = "There's nothing here yet. Get started by creating a new entry.",
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {/* Use the provided icon, or a default folder icon. */}
        {icon ?? <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
      {/* Only render the action button when both a label and handler are given. */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
