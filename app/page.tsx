import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { items, sources } from "@/lib/db/schema";
import { CATEGORIES, type Category } from "@/lib/sources";
import { formatDate } from "@/lib/format-date";
import { RefreshButton } from "./refresh-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LANG_LABELS: Record<string, string> = { en: "EN", fr: "FR", de: "DE", lb: "LB" };

function isCategory(v: string | undefined): v is Category {
  return v === "news" || v === "business" || v === "government" || v === "events";
}

async function getRows(category: Category) {
  return db
    .select({
      id: items.id,
      title: items.title,
      link: items.link,
      summary: items.summary,
      publishedAt: items.publishedAt,
      sourceName: sources.name,
      sourceLang: sources.lang,
    })
    .from(items)
    .innerJoin(sources, eq(items.sourceId, sources.id))
    .where(eq(items.category, category))
    .orderBy(desc(items.publishedAt))
    .limit(200);
}

async function getLastFetched() {
  const [row] = await db
    .select({ ts: sql<Date | null>`max(${sources.lastFetchedAt})` })
    .from(sources);
  return row?.ts ?? null;
}

async function getSourceErrors() {
  return db
    .select({ name: sources.name, error: sources.lastError })
    .from(sources)
    .where(sql`${sources.lastError} is not null`);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const params = await searchParams;
  const category: Category = isCategory(params.cat) ? params.cat : "news";

  const [rows, lastFetched, errors] = await Promise.all([
    getRows(category),
    getLastFetched(),
    getSourceErrors(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Luxembourg Daily</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Updated {lastFetched ? formatDate(lastFetched) : "never"}
            {lastFetched ? " (Europe/Luxembourg)" : ""}
          </p>
        </div>
        <RefreshButton />
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          return (
            <Link
              key={c.id}
              href={`/?cat=${c.id}`}
              className={
                "rounded-full px-3 py-1 text-sm transition " +
                (active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-200/60 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800")
              }
            >
              {c.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No items yet. The cron will populate this feed on its next run.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((r) => (
            <li key={r.id} className="py-4">
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{r.sourceName}</span>
                  <span>·</span>
                  <span>{LANG_LABELS[r.sourceLang] ?? r.sourceLang.toUpperCase()}</span>
                  <span>·</span>
                  <span>{formatDate(r.publishedAt)}</span>
                </div>
                <h2 className="text-base font-medium leading-snug group-hover:underline">
                  {r.title}
                </h2>
                {r.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.summary}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <details className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
          <summary className="cursor-pointer">Source errors ({errors.length})</summary>
          <ul className="mt-2 space-y-1">
            {errors.map((e) => (
              <li key={e.name}>
                <span className="font-medium">{e.name}:</span> {e.error}
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
