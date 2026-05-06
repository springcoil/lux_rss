# Plan: Add Luxembourg business & events RSS feeds

## Goal
Expand `lib/sources.ts` with verified **business** and **events** feeds. Cover with tests. Ship as one commit per category.

## Scope
- **In:** business + events feeds. Find alternatives where original outlets have no RSS.
- **Out:** re-verifying existing news outlets (Wort, Tageblatt, Virgule, Chronicle, Luxembourg.public.lu). User didn't ask, current 4 feeds work.
- **Out:** scraping fallback. RSS-only, per current architecture.

## Steps

### 1. Research (resumable)
Subagent investigates each outlet, writes results to `scripts/feed-research.json` after each verification — so a crash or interrupt tomorrow resumes from the last completed entry, not from scratch.

Schema:
```json
{
  "outlets": [
    { "name": "Paperjam", "category": "business", "status": "verified|no-feed|pending",
      "url": "https://...", "lang": "en|fr|de|lb", "checkedAt": "ISO-8601",
      "alternative": { "name": "...", "url": "..." } | null }
  ]
}
```

Verification rule: WebFetch the candidate URL and confirm valid RSS/Atom XML with ≥1 `<item>`/`<entry>`. No guessed URLs (`/rss`, `/feed` paths must be confirmed, not assumed).

**Business candidates:** Paperjam, Delano, Luxembourg for Finance, Chamber of Commerce, Luxinnovation.
**Events candidates:** Visit Luxembourg, Luxembourg City tourism (vdl.lu), Echo.lu, Philharmonie, Mudam, agenda.lu.

### 2. Update `lib/sources.ts` and ship per category
Two commits, in order:

1. `feat(sources): add business RSS feeds` — business entries + tests pass against them.
2. `feat(sources): add events RSS feeds` — events entries + tests pass against them.

Each commit must pass `RUN_LIVE_FEEDS=1 npm test` on its own.

### 3. Tests
Existing live test at `lib/__tests__/fetch-feeds.integration.test.ts:209` iterates `sources` automatically — new entries are covered.

Add:
- **Stricter live smoke test:** every feed returns ≥1 parseable item (current test only warns on empty).
- **Unit test for `sources.ts` shape:** unique `name`, valid `category`/`lang`, parseable `url`.

### 4. Drop, don't ship
Any feed failing live tests is removed before commit. Better fewer good feeds than one broken one.

## Resume key
If interrupted: read `scripts/feed-research.json`, skip entries with `status != "pending"`, continue.
