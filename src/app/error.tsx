"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4 bg-zinc-950 text-zinc-100 p-6">
      <p className="text-sm text-zinc-400 text-center max-w-xs">
        Failed to load transit data. This is usually a temporary issue.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
      >
        Try again
      </button>
      {error.digest && (
        <p className="text-[10px] text-zinc-600 font-mono">{error.digest}</p>
      )}
    </div>
  );
}
