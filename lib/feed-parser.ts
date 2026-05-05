import Parser from "rss-parser";
import type { Category } from "./sources";

export function makeParser() {
  return new Parser({
    timeout: 10_000,
    headers: { "User-Agent": "lux-rss/1.0 (+https://github.com/)" },
  });
}

export function parseFeedDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type FeedEntry = {
  guid?: string;
  id?: string;
  link?: string;
  title?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
};

export type ExtractedItem = {
  sourceId: number;
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  publishedAt: Date | null;
  category: Category;
};

export function extractItem(
  entry: FeedEntry,
  sourceId: number,
  category: Category
): ExtractedItem | null {
  const guid = entry.guid || entry.id || entry.link || entry.title;
  if (!guid || !entry.link) return null;

  const summary = (entry.contentSnippet || entry.content || entry.summary || null)
    ?.toString()
    .slice(0, 1000) ?? null;

  return {
    sourceId,
    guid: String(guid),
    title: entry.title?.trim() || "(untitled)",
    link: entry.link,
    summary,
    publishedAt: parseFeedDate(entry.isoDate) ?? parseFeedDate(entry.pubDate),
    category,
  };
}
