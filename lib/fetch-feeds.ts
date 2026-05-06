import { eq, notInArray, sql } from "drizzle-orm";
import { db } from "./db/client";
import { items, sources as sourcesTable } from "./db/schema";
import { sources as registry, type SourceDef } from "./sources";
import { makeParser, extractItem } from "./feed-parser";

const parser = makeParser();

type FetchResult = {
  source: string;
  inserted: number;
  total: number;
  error?: string;
};

async function ensureSources() {
  for (const s of registry) {
    await db
      .insert(sourcesTable)
      .values(s)
      .onConflictDoUpdate({
        target: sourcesTable.name,
        set: { url: s.url, category: s.category, lang: s.lang },
      });
  }
  const names = registry.map((s) => s.name);
  await db.delete(sourcesTable).where(notInArray(sourcesTable.name, names));
}

async function fetchSource(def: SourceDef): Promise<FetchResult> {
  const [row] = await db.select().from(sourcesTable).where(eq(sourcesTable.name, def.name));
  if (!row) return { source: def.name, inserted: 0, total: 0, error: "source row missing" };

  try {
    const feed = await parser.parseURL(def.url);
    let inserted = 0;
    for (const entry of feed.items) {
      const values = extractItem(entry, row.id, def.category);
      if (!values) continue;

      const result = await db
        .insert(items)
        .values(values)
        .onConflictDoNothing()
        .returning({ id: items.id });

      if (result.length > 0) inserted++;
    }

    await db
      .update(sourcesTable)
      .set({ lastFetchedAt: new Date(), lastError: null })
      .where(eq(sourcesTable.id, row.id));

    return { source: def.name, inserted, total: feed.items.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db
      .update(sourcesTable)
      .set({ lastFetchedAt: new Date(), lastError: message })
      .where(eq(sourcesTable.id, row.id));
    return { source: def.name, inserted: 0, total: 0, error: message };
  }
}

async function prune(retentionDays = 30) {
  const result = await db.execute(
    sql`delete from items where fetched_at < now() - (${retentionDays} || ' days')::interval`
  );
  return result.rowCount ?? 0;
}

export async function refreshAll(): Promise<{ results: FetchResult[]; pruned: number }> {
  await ensureSources();
  const results = await Promise.all(registry.map(fetchSource));
  const pruned = await prune();
  return { results, pruned };
}
