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
  { name: "Luxembourg Times", url: "https://www.luxtimes.lu/rss/luxembourg", category: "news", lang: "en" },
  { name: "Delano", url: "https://delano.lu/feed", category: "news", lang: "en" },
  { name: "Chronicle.lu", url: "https://chronicle.lu/rss.xml", category: "news", lang: "en" },
  { name: "Tageblatt", url: "https://www.tageblatt.lu/feed", category: "news", lang: "de" },
  { name: "Virgule", url: "https://www.virgule.lu/feed", category: "news", lang: "fr" },
  { name: "Wort EN", url: "https://www.wort.lu/en/rss.xml", category: "news", lang: "en" },

  { name: "Paperjam", url: "https://paperjam.lu/feed", category: "business", lang: "fr" },
  { name: "Chamber of Commerce", url: "https://www.cc.lu/rss/news", category: "business", lang: "en" },
  { name: "Luxinnovation", url: "https://www.luxinnovation.lu/feed/", category: "business", lang: "en" },
  { name: "Luxembourg for Finance", url: "https://www.luxembourgforfinance.com/feed/", category: "business", lang: "en" },

  { name: "gouvernement.lu (EN)", url: "https://gouvernement.lu/en/actualites.gouv_actualites.rss-en.xml", category: "government", lang: "en" },
  { name: "gouvernement.lu (FR)", url: "https://gouvernement.lu/fr/actualites.gouv_actualites.rss-fr.xml", category: "government", lang: "fr" },
  { name: "Luxembourg.public.lu", url: "https://luxembourg.public.lu/en.rss.xml", category: "government", lang: "en" },

  { name: "Visit Luxembourg", url: "https://www.visitluxembourg.com/feed", category: "events", lang: "en" },
  { name: "Echo.lu", url: "https://www.echo.lu/rss", category: "events", lang: "en" },
  { name: "Luxembourg City", url: "https://www.vdl.lu/en/rss.xml", category: "events", lang: "en" },
];
