/**
 * Skeleton
 * --------
 * Generic shimmering placeholder block used to indicate loading content. Merges
 * caller-provided classes (e.g. width/height) with the base pulse styling and
 * forwards all standard div attributes.
 */
import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/**
 * Renders an animated skeleton placeholder `<div>`.
 *
 * @param className - Additional classes merged with the base skeleton styles.
 * @param props - Any other standard `<div>` attributes, spread onto the element.
 * @returns The skeleton placeholder element.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // `cn` merges the base pulse/rounded styling with any caller overrides.
      className={cn("animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80", className)}
      {...props}
    />
  );
}

export default Skeleton;
