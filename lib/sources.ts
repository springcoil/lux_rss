export type Category = "news" | "business" | "government" | "events";

export type SourceDef = {
  name: string;
  url: string;
  category: Category;
  lang: "en" | "fr" | "de" | "lb";
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "news", label: "News" },
  { id: "business", label: "Business" },
  { id: "government", label: "Government" },
  { id: "events", label: "Events & Activities" },
];

export const sources: SourceDef[] = [
  { name: "RTL Today", url: "https://today.rtl.lu/rss/news", category: "news", lang: "en" },
  { name: "Luxembourg Times", url: "https://www.luxtimes.lu/rss", category: "news", lang: "en" },
  {
    name: "gouvernement.lu (EN)",
    url: "https://gouvernement.lu/en/actualites/toutes_actualites.rss",
    category: "government",
    lang: "en",
  },
  {
    name: "gouvernement.lu (FR)",
    url: "https://gouvernement.lu/fr/actualites/toutes_actualites.rss",
    category: "government",
    lang: "fr",
  },
];
