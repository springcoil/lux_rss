import { describe, expect, it } from "vitest";
import { extractItem, makeParser, parseFeedDate } from "../feed-parser";
import { CATEGORIES, sources, type Category } from "../sources";

const VALID_CATEGORIES = new Set<Category>(CATEGORIES.map((c) => c.id));
const VALID_LANGS = new Set(["en", "fr", "de", "lb"] as const);

describe("sources.ts shape", () => {
  it("every name is unique", () => {
    const names = sources.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every category is in CATEGORIES", () => {
    for (const s of sources) {
      expect(VALID_CATEGORIES.has(s.category)).toBe(true);
    }
  });

  it("every lang is one of en|fr|de|lb", () => {
    for (const s of sources) {
      expect(VALID_LANGS.has(s.lang)).toBe(true);
    }
  });

  it("every url parses as a valid URL", () => {
    for (const s of sources) {
      expect(() => new URL(s.url), `${s.name} (${s.url})`).not.toThrow();
    }
  });
});

describe("extractItem (offline)", () => {
  it("maps an entry with isoDate to a valid publishedAt", () => {
    const item = extractItem(
      {
        guid: "g1",
        link: "https://example.com/a",
        title: "Hello",
        contentSnippet: "snippet",
        isoDate: "2026-05-04T10:00:00Z",
      },
      42,
      "news"
    );
    expect(item).not.toBeNull();
    expect(item?.sourceId).toBe(42);
    expect(item?.guid).toBe("g1");
    expect(item?.link).toBe("https://example.com/a");
    expect(item?.title).toBe("Hello");
    expect(item?.summary).toBe("snippet");
    expect(item?.publishedAt).toBeInstanceOf(Date);
    expect(item?.publishedAt?.getTime()).toBe(Date.UTC(2026, 4, 4, 10, 0, 0));
    expect(item?.category).toBe("news");
  });

  it("falls back to pubDate when isoDate is missing", () => {
    const item = extractItem(
      {
        guid: "g2",
        link: "https://example.com/b",
        title: "B",
        pubDate: "Tue, 04 May 2026 12:00:00 GMT",
      },
      1,
      "business"
    );
    expect(item?.publishedAt?.getTime()).toBe(Date.UTC(2026, 4, 4, 12, 0, 0));
  });

  it("returns publishedAt=null for malformed isoDate (regression)", () => {
    const item = extractItem(
      {
        guid: "g3",
        link: "https://example.com/c",
        title: "C",
        isoDate: "Mon, 32 Foo 2025 25:99:99",
      },
      1,
      "news"
    );
    expect(item).not.toBeNull();
    expect(item?.publishedAt).toBeNull();
  });

  it("returns publishedAt=null when both date fields are missing", () => {
    const item = extractItem(
      { guid: "g4", link: "https://example.com/d", title: "D" },
      1,
      "news"
    );
    expect(item?.publishedAt).toBeNull();
  });

  it("falls back from a bad isoDate to a good pubDate", () => {
    const item = extractItem(
      {
        guid: "g5",
        link: "https://example.com/e",
        title: "E",
        isoDate: "completely broken",
        pubDate: "Tue, 04 May 2026 12:00:00 GMT",
      },
      1,
      "news"
    );
    expect(item?.publishedAt?.getTime()).toBe(Date.UTC(2026, 4, 4, 12, 0, 0));
  });

  it("returns null when guid AND id AND link AND title are all missing", () => {
    const item = extractItem({}, 1, "news");
    expect(item).toBeNull();
  });

  it("returns null when link is missing (cannot link out)", () => {
    const item = extractItem(
      { guid: "has-guid", title: "T" },
      1,
      "news"
    );
    expect(item).toBeNull();
  });

  it("trims title and falls back to (untitled)", () => {
    const a = extractItem(
      { guid: "x", link: "https://example.com/x", title: "  Trim Me  " },
      1,
      "news"
    );
    expect(a?.title).toBe("Trim Me");

    const b = extractItem(
      { guid: "y", link: "https://example.com/y", title: "" },
      1,
      "news"
    );
    expect(b?.title).toBe("(untitled)");
  });

  it("truncates summary at 1000 chars", () => {
    const long = "x".repeat(2000);
    const item = extractItem(
      {
        guid: "z",
        link: "https://example.com/z",
        title: "Z",
        contentSnippet: long,
      },
      1,
      "news"
    );
    expect(item?.summary?.length).toBe(1000);
  });

  it("uses link as guid fallback", () => {
    const item = extractItem(
      { link: "https://example.com/no-guid", title: "T" },
      1,
      "news"
    );
    expect(item?.guid).toBe("https://example.com/no-guid");
  });

  it("uses contentSnippet > content > summary > null for summary", () => {
    const a = extractItem(
      { guid: "1", link: "x", title: "x", contentSnippet: "snip", content: "html", summary: "sum" },
      1,
      "news"
    );
    expect(a?.summary).toBe("snip");

    const b = extractItem(
      { guid: "2", link: "x", title: "x", content: "html", summary: "sum" },
      1,
      "news"
    );
    expect(b?.summary).toBe("html");

    const c = extractItem(
      { guid: "3", link: "x", title: "x", summary: "sum" },
      1,
      "news"
    );
    expect(c?.summary).toBe("sum");

    const d = extractItem({ guid: "4", link: "x", title: "x" }, 1, "news");
    expect(d?.summary).toBeNull();
  });
});

describe("RSS XML parsing (offline, real rss-parser)", () => {
  const parser = makeParser();

  it("parses a minimal RSS 2.0 feed with isoDate and bad-date items without throwing", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Test</title>
  <link>https://example.com</link>
  <description>t</description>
  <item>
    <title>Good</title>
    <link>https://example.com/good</link>
    <guid>good</guid>
    <pubDate>Tue, 04 May 2026 12:00:00 GMT</pubDate>
    <description>desc</description>
  </item>
  <item>
    <title>Missing date</title>
    <link>https://example.com/no-date</link>
    <guid>no-date</guid>
    <description>desc</description>
  </item>
  <item>
    <title>No link, should be skipped</title>
    <guid>no-link</guid>
    <description>desc</description>
  </item>
</channel></rss>`;

    const feed = await parser.parseString(xml);
    expect(feed.items.length).toBe(3);

    const extracted = feed.items
      .map((entry) => extractItem(entry, 1, "news"))
      .filter((x) => x !== null);

    expect(extracted.length).toBe(2);
    expect(extracted[0]?.title).toBe("Good");
    expect(extracted[0]?.publishedAt).toBeInstanceOf(Date);
    expect(extracted[1]?.title).toBe("Missing date");
    expect(extracted[1]?.publishedAt).toBeNull();
  });
});

const RUN_LIVE = process.env.RUN_LIVE_FEEDS === "1";

describe.skipIf(!RUN_LIVE)("live RSS feeds (RUN_LIVE_FEEDS=1)", () => {
  const parser = makeParser();

  for (const source of sources) {
    it(
      `${source.name} — returns ≥1 parseable item with safe date handling`,
      async () => {
        let feed;
        try {
          feed = await parser.parseURL(source.url);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn(`[upstream] ${source.name}: ${msg}`);
          return;
        }

        expect(
          feed.items.length,
          `${source.name} returned an empty feed — drop it from sources.ts`
        ).toBeGreaterThan(0);

        let parseableItems = 0;
        let totalDates = 0;
        let nullDates = 0;
        for (const entry of feed.items) {
          expect(() => parseFeedDate(entry.isoDate)).not.toThrow();
          expect(() => parseFeedDate(entry.pubDate)).not.toThrow();
          expect(() => extractItem(entry, 1, source.category)).not.toThrow();

          if (extractItem(entry, 1, source.category) !== null) {
            parseableItems++;
          }

          const published = parseFeedDate(entry.isoDate) ?? parseFeedDate(entry.pubDate);
          if (published === null) {
            nullDates++;
          } else {
            expect(Number.isFinite(published.getTime())).toBe(true);
          }
          totalDates++;
        }

        expect(
          parseableItems,
          `${source.name} returned ${feed.items.length} items but none extract — drop or fix mapping`
        ).toBeGreaterThan(0);

        if (totalDates > 0 && nullDates === totalDates) {
          console.warn(
            `[upstream] ${source.name}: 100% of ${totalDates} items have unparseable dates — feed format may have changed`
          );
        }
      },
      20_000
    );
  }
});
