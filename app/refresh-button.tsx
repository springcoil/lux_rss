"use client";

import { useState, useTransition } from "react";
import { runRefresh } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "ok"; inserted: number; pruned: number; sources: number; failed: number }
  | { kind: "error"; message: string };

export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function onClick() {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      try {
        const r = await runRefresh();
        setStatus({ kind: "ok", ...r });
      } catch (e) {
        setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Collecting…" : "Collect sources"}
      </button>
      {status.kind === "ok" && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          +{status.inserted} new · {status.sources} sources
          {status.failed > 0 ? ` · ${status.failed} failed` : ""}
          {status.pruned > 0 ? ` · pruned ${status.pruned}` : ""}
        </span>
      )}
      {status.kind === "error" && (
        <span className="text-xs text-red-600 dark:text-red-400">{status.message}</span>
      )}
    </div>
  );
}
