import { pgTable, serial, text, timestamp, varchar, integer, uniqueIndex, index } from "drizzle-orm/pg-core";

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  lang: varchar("lang", { length: 8 }).notNull(),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  lastError: text("last_error"),
});

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    summary: text("summary"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    category: varchar("category", { length: 32 }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqGuid: uniqueIndex("items_source_guid_uniq").on(t.sourceId, t.guid),
    byCategoryPublished: index("items_category_published_idx").on(t.category, t.publishedAt),
  })
);

export type Source = typeof sources.$inferSelect;
export type Item = typeof items.$inferSelect;
