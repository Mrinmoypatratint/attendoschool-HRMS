/**
 * LoadingScreen.tsx
 * -----------------
 * Full-viewport institutional transition & loading screen.
 * Displays the institutional crest with ambient gold/emerald glowing aura
 * and smooth animated status indicator.
 */

export function LoadingScreen({ title }: { title?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-center selection:bg-emerald-500">
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm">
        {/* Animated Crest Container */}
        <div className="relative flex items-center justify-center h-28 w-28">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/50 animate-ring-spin" />
          <div className="h-20 w-20 rounded-2xl bg-slate-900/90 border border-amber-400/30 p-2 shadow-xl flex items-center justify-center">
            <img
              src="/greenwood-crest.svg"
              alt="Institutional Portal"
              className="h-full w-full object-contain animate-crest-pulse"
            />
          </div>
        </div>

        <h3 className="mt-5 text-lg font-bold text-white tracking-wide font-serif">
          GreenWood International School
        </h3>

        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{title ?? "Loading institutional workspace..."}</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
