import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lux RSS — Luxembourg news, business, government, events",
  description: "Daily aggregation of Luxembourg news, government announcements, and events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
